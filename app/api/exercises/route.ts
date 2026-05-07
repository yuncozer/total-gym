import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { fetchExercisesByCategory, type Exercise } from "@/app/lib/wgerApi";
import { muscleGroupsData } from "@/lib/data/ejercicios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const muscleGroupId = searchParams.get("muscleGroup");
  const equipmentCategory = searchParams.get("equipment");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    let exercises: Exercise[] = [];

    if (muscleGroupId) {
      const muscleGroup = muscleGroupsData.find(m => m.id === muscleGroupId);
      
      if (muscleGroup) {
        let equipmentIds: number[] | undefined;
        
        if (equipmentCategory && equipmentCategory !== "all") {
          equipmentIds = getEquipmentIdsByCategory(equipmentCategory);
        }
        
        exercises = await fetchExercisesByCategory(
          muscleGroup.wgerCategoryId,
          equipmentIds,
          limit
        );

        if (muscleGroup.wgerMuscleIds.length > 0) {
          exercises = filterByMuscles(exercises, muscleGroup.wgerMuscleIds, muscleGroup.wgerSecondaryMuscleIds);
        }
      }
    } else {
      exercises = await fetchExercisesByCategory(0, undefined, limit);
    }

    return NextResponse.json(
      {
        success: true,
        total: exercises.length,
        data: exercises,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching exercises from WGER:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

function getEquipmentIdsByCategory(category: string): number[] {
  switch (category) {
    case "barbell":
      return [1, 2];
    case "dumbbell":
      return [3];
    case "body weight":
      return [6, 7];
    default:
      return [4, 5, 8, 9, 10, 11];
  }
}

function filterByMuscles(
  exercises: Exercise[],
  primaryMuscleIds: number[],
  secondaryMuscleIds: number[]
): Exercise[] {
  return exercises.filter(ex => {
    const hasPrimaryMuscle = ex.muscleIds.some(id => primaryMuscleIds.includes(id));
    const hasSecondaryMuscle = ex.secondaryMuscleIds.some(id => secondaryMuscleIds.includes(id));
    return hasPrimaryMuscle || hasSecondaryMuscle;
  });
}
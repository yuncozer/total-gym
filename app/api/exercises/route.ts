import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import type { Exercise } from "@/app/lib/wgerApi";
import { muscleGroupsData } from "@/lib/data/ejercicios";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

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

        const { data: localData } = await supabase
          .from("exercises")
          .select("*")
          .eq("muscle_group_id", muscleGroup.id)
          .eq("is_active", true);

        if (localData && localData.length > 0) {
          exercises = localData.map(mapRowToExercise);

          if (equipmentIds) {
            exercises = exercises.filter((ex) =>
              ex.equipmentIds.some((id) => equipmentIds!.includes(id))
            );
          }

          exercises = exercises.slice(0, limit);
        }
      }
    } else {
      const { data: localData } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_active", true)
        .limit(limit);

      if (localData && localData.length > 0) {
        exercises = localData.map(mapRowToExercise);
      }
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
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

function mapRowToExercise(row: any): Exercise {
  return {
    id: row.id.toString(),
    uuid: row.uuid ?? "",
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "",
    categoryId: row.category_id,
    muscles: row.muscles ?? [],
    muscleIds: row.muscle_ids ?? [],
    secondaryMuscles: row.secondary_muscles ?? [],
    secondaryMuscleIds: row.secondary_muscle_ids ?? [],
    equipment: row.equipment ?? "",
    equipmentIds: row.equipment_ids ?? [],
    equipmentCategory: row.equipment_category ?? "",
    imageUrl: row.image_url,
    images: row.images ?? [],
    variationGroup: row.variation_group,
  };
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


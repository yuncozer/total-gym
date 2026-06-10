import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function createSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const supabase = createSupabaseClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exercises } = await request.json();

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Invalid exercises data" }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("workout_sets")
      .delete()
      .eq("workout_id", workoutId);

    if (deleteError) throw deleteError;

    const setsToInsert = exercises.flatMap((ej: { exerciseId: string; name: string; muscleGroup?: string; sets: unknown[] }, ejIndex: number) =>
      (ej.sets as Array<{ reps: number | null; weight_kg: number | null; is_cardio?: boolean; distance_km?: number | null; duration_minutes?: number | null; is_completed: boolean; exercise_order?: number; muscle_group?: string; image_url?: string; description?: string }>).map((s, index) => ({
        workout_id: workoutId,
        exercise_id: ej.exerciseId,
        exercise_name: ej.name,
        set_number: index + 1,
        reps: s.is_cardio ? null : (Number(s.reps) || 0),
        weight_kg: s.is_cardio ? null : (Number(s.weight_kg) || 0),
        is_cardio: s.is_cardio || false,
        distance_km: s.is_cardio ? (Number(s.distance_km) || 0) : null,
        duration_minutes: s.is_cardio ? (Number(s.duration_minutes) || 0) : null,
        is_completed: Boolean(s.is_completed),
        exercise_order: s.exercise_order ?? ejIndex,
        muscle_group: s.muscle_group ?? ej.muscleGroup ?? null,
        image_url: s.image_url ?? null,
        description: s.description ?? null,
      }))
    );

    const { error: insertError } = await supabase
      .from("workout_sets")
      .insert(setsToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving sets:", error);
    return NextResponse.json({ error: "Failed to save sets" }, { status: 500 });
  }
}
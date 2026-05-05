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

    const setsToInsert = exercises.flatMap((ej: { exerciseId: string; name: string; sets: unknown[] }) =>
      (ej.sets as Array<{ reps: number; weight_kg: number; is_completed: boolean }>).map((s, index) => ({
        workout_id: workoutId,
        exercise_id: ej.exerciseId,
        exercise_name: ej.name,
        set_number: index + 1,
        reps: Number(s.reps) || 0,
        weight_kg: Number(s.weight_kg) || 0,
        is_completed: Boolean(s.is_completed)
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
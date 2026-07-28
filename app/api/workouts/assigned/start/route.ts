import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { RoutineExercise } from "@/lib/trainer/types";

function createAuthClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const authClient = createAuthClient(request);
    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: assignment } = await adminClient
      .from("routine_assignments")
      .select("id, trainer_routines(exercises)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: "No active assignment" }, { status: 404 });
    }

    const { data: existing } = await authClient
      .from("workouts")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("assignment_id", assignment.id)
      .eq("status", "pendiente")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }

    const routineRel = assignment.trainer_routines as unknown as
      | { exercises: RoutineExercise[] }
      | { exercises: RoutineExercise[] }[]
      | null;
    const routine = Array.isArray(routineRel) ? routineRel[0] : routineRel;
    const exercises: RoutineExercise[] = routine?.exercises || [];

    if (exercises.length === 0) {
      return NextResponse.json({ error: "Routine has no exercises" }, { status: 400 });
    }

    const fecha = new Date().toISOString().split("T")[0];

    const { data: workout, error: workoutError } = await authClient
      .from("workouts")
      .insert({
        user_id: session.user.id,
        date: fecha,
        status: "pendiente",
        assignment_id: assignment.id,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    const setsToInsert = exercises.flatMap((ej, ejIndex) =>
      Array.from({ length: ej.setsCount || 1 }, (_, index) => ({
        workout_id: workout.id,
        exercise_id: ej.exerciseId,
        exercise_name: ej.name,
        set_number: index + 1,
        reps: ej.isCardio ? null : 0,
        weight_kg: ej.isCardio ? null : 0,
        is_cardio: ej.isCardio || false,
        distance_km: ej.isCardio ? 0 : null,
        duration_minutes: ej.isCardio ? 0 : null,
        is_completed: false,
        image_url: ej.imageUrl || null,
        exercise_order: ejIndex,
        muscle_group: ej.muscleGroup || null,
        target_reps: ej.targetReps ?? null,
        target_weight_kg: ej.targetWeightKg ?? null,
        target_rpe: ej.targetRpe ?? null,
        rest_seconds: ej.restSeconds ?? null,
        trainer_note: ej.note || null,
      }))
    );

    const { error: setsError } = await authClient
      .from("workout_sets")
      .insert(setsToInsert);

    if (setsError) throw setsError;

    return NextResponse.json({ id: workout.id });
  } catch (error) {
    console.error("Error starting assigned workout:", error);
    return NextResponse.json({ error: "Failed to start assigned workout" }, { status: 500 });
  }
}

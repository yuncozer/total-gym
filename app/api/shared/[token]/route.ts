import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const { data: share, error: shareError } = await supabase
      .from("shared_workouts")
      .select("workout_id, created_at, expires_at")
      .eq("token", token)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(share.expires_at);
    if (expiresAt < now) {
      return NextResponse.json({
        error: "Share link has expired",
        expired: true,
        created_at: share.created_at,
        expires_at: share.expires_at,
      }, { status: 410 });
    }

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("id, name, date, completed_at, started_at")
      .eq("id", share.workout_id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("exercise_id, exercise_name, set_number, reps, weight_kg, is_cardio, distance_km, duration_minutes, is_completed, muscle_group, image_url, description")
      .eq("workout_id", share.workout_id)
      .order("exercise_order", { ascending: true })
      .order("set_number", { ascending: true });

    if (setsError) throw setsError;

    const exerciseMap = new Map<string, {
      exerciseId: string;
      name: string;
      muscleGroup: string | null;
      imageUrl: string | null;
      sets: Array<{
        set_number: number;
        reps: number | null;
        weight_kg: number | null;
        is_cardio: boolean;
        is_completed: boolean;
        distance_km: number | null;
        duration_minutes: number | null;
      }>;
    }>();

    for (const set of sets || []) {
      const key = set.exercise_id;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, {
          exerciseId: key,
          name: set.exercise_name,
          muscleGroup: set.muscle_group,
          imageUrl: set.image_url,
          sets: [],
        });
      }
      exerciseMap.get(key)!.sets.push({
        set_number: set.set_number,
        reps: set.reps,
        weight_kg: set.weight_kg,
        is_cardio: set.is_cardio ?? false,
        is_completed: set.is_completed,
        distance_km: set.distance_km,
        duration_minutes: set.duration_minutes,
      });
    }

    const exercises = Array.from(exerciseMap.values());

    const { data: photos } = await supabase
      .from("workout_photos")
      .select("id, storage_path, created_at")
      .eq("workout_id", share.workout_id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      workout: {
        id: workout.id,
        name: workout.name,
        date: workout.date,
        completed_at: workout.completed_at,
      },
      exercises,
      photos: (photos || []).map(p => {
        const { data } = supabase.storage.from("workout-photos").getPublicUrl(p.storage_path);
        return { id: p.id, url: data.publicUrl, createdAt: p.created_at };
      }),
      created_at: share.created_at,
      expires_at: share.expires_at,
    });
  } catch (error) {
    console.error("Error fetching shared workout:", error);
    return NextResponse.json({ error: "Failed to fetch shared workout" }, { status: 500 });
  }
}

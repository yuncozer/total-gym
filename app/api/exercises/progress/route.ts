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

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exercise_id");

    if (!exerciseId) {
      return NextResponse.json({ error: "exercise_id is required" }, { status: 400 });
    }

    const { data: sets, error } = await supabase
      .from("workout_sets")
      .select("weight_kg, reps, completed_at, workout_id")
      .eq("exercise_id", exerciseId)
      .eq("is_completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true });

    if (error) throw error;

    const workoutIds = [...new Set((sets || []).map(s => s.workout_id))];

    const { data: workouts } = await supabase
      .from("workouts")
      .select("id, date, started_at")
      .in("id", workoutIds.length > 0 ? workoutIds : ["none"])
      .eq("user_id", session.user.id);

    const workoutMap = new Map((workouts || []).map(w => [w.id, w.date || w.started_at?.split("T")[0] || ""]));

    const aggregated: { date: string; maxWeight: number; maxReps: number; volume: number }[] = [];

    for (const set of sets || []) {
      const date = workoutMap.get(set.workout_id) || set.completed_at?.split("T")[0] || "";
      if (!date) continue;

      const existing = aggregated.find(a => a.date === date);
      if (existing) {
        existing.maxWeight = Math.max(existing.maxWeight, set.weight_kg || 0);
        existing.maxReps = Math.max(existing.maxReps, set.reps || 0);
        existing.volume += (set.reps || 0) * (set.weight_kg || 0);
      } else {
        aggregated.push({
          date,
          maxWeight: set.weight_kg || 0,
          maxReps: set.reps || 0,
          volume: (set.reps || 0) * (set.weight_kg || 0),
        });
      }
    }

    return NextResponse.json(aggregated);
  } catch (error) {
    console.error("Error loading exercise progress:", error);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

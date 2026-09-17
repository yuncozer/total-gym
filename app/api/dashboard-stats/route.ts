import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { localDate, shiftDate, todayIn } from "@/lib/time/timezone";
import { resolveUserTimeZone } from "@/lib/time/userTimeZone";
import { resolveIsPremium } from "@/lib/premium/server";

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
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const session = authUser ? { user: authUser } : null;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    // "Hoy" y la racha se miden en la zona del usuario. Con el servidor en UTC,
    // a las 19:00 en UTC-5 "hoy" ya era mañana y la racha se rompía sola.
    const tz = await resolveUserTimeZone(supabase, userId);
    const todayStr = todayIn(tz);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();

    const isPremium = resolveIsPremium(sub);

    let query = supabase
      .from("workouts")
      .select("id, date, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed");

    if (!isPremium) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 30);
      dateLimit.setHours(0, 0, 0, 0);
      query = query.gte("started_at", dateLimit.toISOString());
    }

    const { data: completedWorkouts, error: workoutsError } = await query;

    if (workoutsError) throw workoutsError;

    if (!completedWorkouts || completedWorkouts.length === 0) {
      return NextResponse.json({
        todayWorkout: false,
        streak: 0,
        totalWorkouts: 0,
        totalSets: 0,
        lastWorkoutMuscles: []
      });
    }

    const workoutIds = completedWorkouts.map(w => w.id);
    let totalSets = 0;
    let lastWorkoutMuscles: string[] = [];

    if (workoutIds.length > 0) {
      const { data: allSets } = await supabase
        .from("workout_sets")
        .select("id, workout_id, muscle_group")
        .in("workout_id", workoutIds)
        .eq("is_completed", true);
      
      totalSets = allSets?.length || 0;

      const sortedWorkouts = [...completedWorkouts].sort((a, b) => {
        const dateA = a.completed_at || a.date || "";
        const dateB = b.completed_at || b.date || "";
        return dateB.localeCompare(dateA);
      });
      const lastWorkout = sortedWorkouts[0];

      if (lastWorkout && lastWorkout.id && allSets) {
        const lastSets = allSets.filter(s => s.workout_id === lastWorkout.id);
        const muscleSet = new Set<string>();
        lastSets.forEach(s => {
          if (s.muscle_group) muscleSet.add(s.muscle_group);
        });
        lastWorkoutMuscles = Array.from(muscleSet);
      }
    }

    const workoutDates = completedWorkouts
      .map(w => {
        if (w.date) return w.date;
        if (w.completed_at) return localDate(tz, new Date(w.completed_at));
        return null;
      })
      .filter(Boolean) as string[];

    const todayWorkout = workoutDates.includes(todayStr);
    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));

    const dateSet = new Set(uniqueDates);
    let streak = 0;
    let cursor = todayStr;

    if (todayWorkout) {
      streak = 1;
      cursor = shiftDate(cursor, -1);
    }

    while (dateSet.has(cursor)) {
      streak++;
      cursor = shiftDate(cursor, -1);
    }

    return NextResponse.json({
      todayWorkout,
      streak,
      totalWorkouts: completedWorkouts.length,
      totalSets,
      lastWorkoutMuscles
    });
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

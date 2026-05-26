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

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();

    const isPremium = !sub || (sub.plan === "premium" && sub.status === "active");

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
        totalSets: 0
      });
    }

    const workoutIds = completedWorkouts.map(w => w.id);
    let totalSets = 0;

    if (workoutIds.length > 0) {
      const { data: allSets } = await supabase
        .from("workout_sets")
        .select("id", { count: 'exact' })
        .in("workout_id", workoutIds)
        .eq("is_completed", true);
      
      totalSets = allSets?.length || 0;
    }

    const workoutDates = completedWorkouts
      .map(w => {
        if (w.date) return w.date;
        if (w.completed_at) {
          const d = new Date(w.completed_at);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split("T")[0];
        }
        return null;
      })
      .filter(Boolean) as string[];

    const todayWorkout = workoutDates.includes(todayStr);
    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const checkDate = new Date(today);

    if (todayWorkout) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      todayWorkout,
      streak,
      totalWorkouts: completedWorkouts.length,
      totalSets
    });
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

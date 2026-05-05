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

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: weekWorkouts } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("started_at", monday.toISOString());

    const { data: monthWorkouts } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("started_at", firstDayOfMonth.toISOString());

    const { data: allWorkouts } = await supabase
      .from("workouts")
      .select("id, started_at")
      .eq("user_id", session.user.id)
      .not("completed_at", "is", null)
      .order("started_at", { ascending: false });

    let streak = 0;
    if (allWorkouts && allWorkouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(today);
      const workoutDates = new Set(
        allWorkouts.map(w => {
          const d = new Date(w.started_at);
          d.setHours(0, 0, 0, 0);
          return d.toISOString().split("T")[0];
        })
      );

      while (workoutDates.has(currentDate.toISOString().split("T")[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    const { data: setsData } = await supabase
      .from("workout_sets")
      .select("reps, weight_kg")
      .eq("is_completed", true);

    let totalVolume = 0;
    if (setsData) {
      setsData.forEach(set => {
        totalVolume += (set.reps || 0) * (set.weight_kg || 0);
      });
    }

    return NextResponse.json({
      weekWorkouts: weekWorkouts?.length || 0,
      monthWorkouts: monthWorkouts?.length || 0,
      streak,
      totalVolume: Math.round(totalVolume)
    });
  } catch (error) {
    console.error("Error loading stats:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
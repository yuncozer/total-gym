import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, email, level, xp, current_streak, longest_streak")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fallback to auth.users email if profile email is missing
    if (!profile.email) {
      const { data: authEmail } = await (adminClient.rpc as any)("get_user_email", { p_user_id: id });
      if (authEmail) profile.email = authEmail as string;
    }

    const { count: weekWorkouts } = await adminClient
      .from("workouts")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", id)
      .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const weekSetsRes = await adminClient
      .from("workout_sets")
      .select("reps, weight_kg")
      .eq("is_completed", true);

    const { data: userWorkouts } = await adminClient
      .from("workouts")
      .select("id")
      .eq("user_id", id);

    const userWorkoutIds = (userWorkouts || []).map(w => w.id);

    let totalVolume = 0;
    if (weekSetsRes.data && userWorkoutIds.length > 0) {
      const { data: weekSets } = await adminClient
        .from("workout_sets")
        .select("reps, weight_kg")
        .eq("is_completed", true)
        .in("workout_id", userWorkoutIds);

      if (weekSets) {
        weekSets.forEach(set => {
          totalVolume += (set.reps || 0) * (set.weight_kg || 0);
        });
      }
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      level: profile.level,
      xp: profile.xp,
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      weekWorkouts: weekWorkouts || 0,
      totalVolume: Math.round(totalVolume),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

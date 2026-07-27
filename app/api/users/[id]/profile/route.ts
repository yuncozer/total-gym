import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { levelFromXp } from "@/lib/gamification";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient: any = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (session.user.id !== id) {
      const { data: friendRow } = await adminClient
        .from("friends")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("friend_id", id)
        .maybeSingle();

      const { data: clientRow } = await adminClient
        .from("trainer_clients")
        .select("id")
        .eq("trainer_id", session.user.id)
        .eq("user_id", id)
        .maybeSingle();

      if (!friendRow && !clientRow) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fallback to auth.users email if profile email is missing
    if (!profile.email) {
      const { data: authEmail } = await adminClient.rpc("get_user_email", { p_user_id: id });
      if (authEmail) profile.email = authEmail as string;
    }

    // Calculate XP, level, streak from raw workout data (no DB function dependency)
    const { data: userWorkouts } = await adminClient
      .from("workouts")
      .select("id, completed_at")
      .eq("user_id", id);

    const completedWorkouts = (userWorkouts || []).filter((w: any) => w.completed_at);
    const workoutIds = (userWorkouts || []).map((w: any) => w.id);

    const { data: allSets } = await adminClient
      .from("workout_sets")
      .select("id, workout_id")
      .eq("is_completed", true)
      .in("workout_id", workoutIds.length > 0 ? workoutIds : ["none"]);

    const userWorkoutIdSet = new Set(workoutIds);
    const totalSets = (allSets || []).filter((s: any) => userWorkoutIdSet.has(s.workout_id)).length;
    const totalWorkouts = completedWorkouts.length;

    const xp = totalSets * 10 + totalWorkouts * 25;
    const level = levelFromXp(xp);

    // Calculate streak
    const workoutDates: string[] = completedWorkouts.map((w: any) => {
      const d = new Date(w.completed_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const checkDate = new Date(today);
    if (uniqueDates.includes(todayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const ds = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(ds)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }

    let longestStreak = 0;
    if (uniqueDates.length > 0) {
      let run = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const curr = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diff = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) run++;
        else { longestStreak = Math.max(longestStreak, run); run = 1; }
      }
      longestStreak = Math.max(longestStreak, run);
    }

    // Best-effort save back to profiles
    await adminClient.from("profiles").update({
      xp, level, current_streak: currentStreak, longest_streak: longestStreak
    }).eq("id", id).maybeSingle();

    const { count: weekWorkouts } = await adminClient
      .from("workouts")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", id)
      .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const weekSetsRes = await adminClient
      .from("workout_sets")
      .select("reps, weight_kg")
      .eq("is_completed", true);

    let totalVolume = 0;
    if (weekSetsRes.data && workoutIds.length > 0) {
      const { data: weekSets } = await adminClient
        .from("workout_sets")
        .select("reps, weight_kg")
        .eq("is_completed", true)
        .in("workout_id", workoutIds);

      if (weekSets) {
        weekSets.forEach((set: any) => {
          totalVolume += (set.reps || 0) * (set.weight_kg || 0);
        });
      }
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      level,
      xp,
      currentStreak,
      longestStreak,
      weekWorkouts: weekWorkouts || 0,
      totalVolume: Math.round(totalVolume),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

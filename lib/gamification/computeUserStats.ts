import type { SupabaseClient } from "@supabase/supabase-js";
import { levelFromXp } from "@/lib/gamification";

export interface UserStats {
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  weekWorkouts: number;
  totalVolume: number;
}

export async function computeUserStats(adminClient: SupabaseClient, userId: string): Promise<UserStats> {
  const { data: userWorkouts } = await adminClient
    .from("workouts")
    .select("id, completed_at")
    .eq("user_id", userId);

  const completedWorkouts = (userWorkouts || []).filter((w: { completed_at: string | null }) => w.completed_at);
  const workoutIds = (userWorkouts || []).map((w: { id: string }) => w.id);

  const { data: allSets } = await adminClient
    .from("workout_sets")
    .select("id, workout_id")
    .eq("is_completed", true)
    .in("workout_id", workoutIds.length > 0 ? workoutIds : ["none"]);

  const userWorkoutIdSet = new Set(workoutIds);
  const totalSets = (allSets || []).filter((s: { workout_id: string }) => userWorkoutIdSet.has(s.workout_id)).length;
  const totalWorkouts = completedWorkouts.length;

  const xp = totalSets * 10 + totalWorkouts * 25;
  const level = levelFromXp(xp);

  const workoutDates: string[] = completedWorkouts.map((w: { completed_at: string }) => {
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

  await adminClient.from("profiles").update({
    xp, level, current_streak: currentStreak, longest_streak: longestStreak
  }).eq("id", userId).maybeSingle();

  const { count: weekWorkouts } = await adminClient
    .from("workouts")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", userId)
    .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  let totalVolume = 0;
  if (workoutIds.length > 0) {
    const { data: sets } = await adminClient
      .from("workout_sets")
      .select("reps, weight_kg")
      .eq("is_completed", true)
      .in("workout_id", workoutIds);

    (sets || []).forEach((set: { reps: number | null; weight_kg: number | null }) => {
      totalVolume += (set.reps || 0) * (set.weight_kg || 0);
    });
  }

  return {
    level,
    xp,
    currentStreak,
    longestStreak,
    weekWorkouts: weekWorkouts || 0,
    totalVolume: Math.round(totalVolume),
  };
}

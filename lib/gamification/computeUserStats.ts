import type { SupabaseClient } from "@supabase/supabase-js";
import { levelFromXp } from "@/lib/gamification";

function formatDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

  const { data: allSets } = workoutIds.length > 0
    ? await adminClient
        .from("workout_sets")
        .select("workout_id, reps, weight_kg")
        .eq("is_completed", true)
        .in("workout_id", workoutIds)
    : { data: [] as Array<{ workout_id: string; reps: number | null; weight_kg: number | null }> };

  const userWorkoutIdSet = new Set(workoutIds);
  const userSets = (allSets || []).filter((s: { workout_id: string }) => userWorkoutIdSet.has(s.workout_id));
  const totalSets = userSets.length;
  const totalWorkouts = completedWorkouts.length;

  const xp = totalSets * 10 + totalWorkouts * 25;
  const level = levelFromXp(xp);

  const workoutDates: string[] = completedWorkouts.map((w: { completed_at: string }) =>
    formatDay(new Date(w.completed_at))
  );
  const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));
  const dateSet = new Set(uniqueDates);

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);
  if (dateSet.has(formatDay(today))) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (dateSet.has(formatDay(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
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
  for (const set of userSets) {
    totalVolume += (set.reps || 0) * (set.weight_kg || 0);
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

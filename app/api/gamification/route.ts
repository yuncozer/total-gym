import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { levelFromXp } from "@/lib/gamification";

async function calculateGamification(adminClient: any, userId: string) {
  // Count completed sets
  const { data: setsData } = await adminClient
    .from("workout_sets")
    .select("workout_id")
    .eq("is_completed", true);

  // Get user's workout IDs
  const { data: userWorkouts } = await adminClient
    .from("workouts")
    .select("id, completed_at")
    .eq("user_id", userId);

  const userWorkoutIds = new Set<string>((userWorkouts || []).map((w: any) => w.id));
  const completedWorkouts = (userWorkouts || []).filter((w: any) => w.completed_at);

  let totalSets = 0;
  for (const w of userWorkoutIds) {
    totalSets += (setsData || []).filter((s: any) => s.workout_id === w).length;
  }

  const totalWorkouts = completedWorkouts.length;
  const xp = totalSets * 10 + totalWorkouts * 25;
  const level = levelFromXp(xp);

  // Calculate streak
  const workoutDates: string[] = completedWorkouts
    .map((w: any) => {
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
    const dateStr = checkDate.toISOString().split("T")[0];
    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  // Calculate longest streak
  let longestStreak = 0;
  if (uniqueDates.length > 0) {
    let run = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diff = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        run++;
      } else {
        longestStreak = Math.max(longestStreak, run);
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);
  }

  // Best-effort save to profiles
  await adminClient
    .from("profiles")
    .update({ xp, level, current_streak: currentStreak, longest_streak: longestStreak })
    .eq("id", userId)
    .maybeSingle();

  return { xp, level, currentStreak, longestStreak };
}

export async function GET(request: NextRequest) {
  try {
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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const result = await calculateGamification(adminClient, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching gamification:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const result = await calculateGamification(adminClient, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing gamification:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

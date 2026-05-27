import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin/route";
import { getAdminClient } from "@/lib/admin/client";

export async function GET(request: NextRequest) {
  const { error } = await checkAdminAccess(request);
  if (error) return error;

  const supabase = getAdminClient();

  const [usersRes, workoutsRes, setsRes, premiumRes, activeUsersRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("workouts").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("workout_sets").select("id", { count: "exact", head: true }).eq("is_completed", true),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "premium").eq("status", "active"),
    supabase.from("workouts").select("user_id").eq("status", "completed").gte("started_at", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  const activeUsers = activeUsersRes.data
    ? new Set(activeUsersRes.data.map((w: { user_id: string }) => w.user_id)).size
    : 0;

  return NextResponse.json({
    totalUsers: usersRes.count || 0,
    totalWorkouts: workoutsRes.count || 0,
    totalSetsCompleted: setsRes.count || 0,
    premiumUsers: premiumRes.count || 0,
    activeUsers30d: activeUsers,
  });
}

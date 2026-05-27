import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin/route";
import { getAdminClient } from "@/lib/admin/client";

export async function GET(request: NextRequest) {
  const { error } = await checkAdminAccess(request);
  if (error) return error;

  const supabase = getAdminClient();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const userIds = (profiles || []).map((p: { id: string }) => p.id);

  const [workoutsRes, subsRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("user_id, started_at")
      .eq("status", "completed")
      .in("user_id", userIds.length > 0 ? userIds : ["none"]),
    supabase
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end")
      .in("user_id", userIds.length > 0 ? userIds : ["none"]),
  ]);

  const workoutCounts: Record<string, number> = {};
  const lastActivity: Record<string, string | null> = {};
  for (const w of workoutsRes.data || []) {
    workoutCounts[w.user_id] = (workoutCounts[w.user_id] || 0) + 1;
    const started = w.started_at;
    if (!lastActivity[w.user_id] || started > lastActivity[w.user_id]!) {
      lastActivity[w.user_id] = started;
    }
  }

  const subMap: Record<string, { plan: string; status: string; current_period_end: string | null }> = {};
  for (const s of subsRes.data || []) {
    subMap[s.user_id] = { plan: s.plan, status: s.status, current_period_end: s.current_period_end };
  }

  const users = (profiles || []).map((p: { id: string; email: string; created_at: string }) => ({
    id: p.id,
    email: p.email,
    createdAt: p.created_at,
    totalWorkouts: workoutCounts[p.id] || 0,
    lastActivity: lastActivity[p.id] || null,
    subscription: subMap[p.id] || { plan: "free", status: "inactive", current_period_end: null },
  }));

  return NextResponse.json(users);
}

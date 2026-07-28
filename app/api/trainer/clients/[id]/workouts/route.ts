import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, user_id")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!client.user_id) {
    return NextResponse.json({ workouts: [] });
  }

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("id, date, name, completed_at")
    .eq("user_id", client.user_id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  const workoutIds = (workouts || []).map((w) => w.id);
  const { data: comments } = workoutIds.length > 0
    ? await supabase.from("session_comments").select("workout_id").in("workout_id", workoutIds)
    : { data: [] as { workout_id: string }[] };

  const countMap = new Map<string, number>();
  for (const c of comments || []) {
    countMap.set(c.workout_id, (countMap.get(c.workout_id) || 0) + 1);
  }

  return NextResponse.json({
    workouts: (workouts || []).map((w) => ({
      id: w.id,
      date: w.date,
      name: w.name,
      completedAt: w.completed_at,
      commentCount: countMap.get(w.id) || 0,
    })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin/route";
import { getAdminClient } from "@/lib/admin/client";

export async function GET(request: NextRequest) {
  const { error } = await checkAdminAccess(request);
  if (error) return error;

  const supabase = getAdminClient();

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("exercise_id, exercise_name")
    .eq("is_completed", true);

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 });
  }

  const counts: Record<string, { exerciseId: string; name: string; count: number }> = {};

  for (const set of sets || []) {
    const key = set.exercise_id;
    if (!counts[key]) {
      counts[key] = { exerciseId: key, name: set.exercise_name || "Unknown", count: 0 };
    }
    counts[key].count++;
  }

  const sorted = Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json(sorted);
}

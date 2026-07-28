import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdherenceStatus, type AdherenceStatus } from "./adherence";

interface ClientLike {
  userId: string | null;
}

export async function enrichWithAdherence<T extends ClientLike>(
  supabase: SupabaseClient,
  clients: T[]
): Promise<(T & { lastWorkoutAt: string | null; adherenceStatus: AdherenceStatus })[]> {
  const linkedUserIds = [...new Set(clients.filter((c) => c.userId).map((c) => c.userId as string))];

  const lastWorkoutMap = new Map<string, string>();
  if (linkedUserIds.length > 0) {
    const { data } = await supabase
      .from("workouts")
      .select("user_id, started_at")
      .in("user_id", linkedUserIds)
      .eq("status", "completed")
      .order("started_at", { ascending: false });

    for (const row of data || []) {
      if (!lastWorkoutMap.has(row.user_id)) {
        lastWorkoutMap.set(row.user_id, row.started_at);
      }
    }
  }

  return clients.map((c) => {
    const lastWorkoutAt = c.userId ? lastWorkoutMap.get(c.userId) ?? null : null;
    return { ...c, lastWorkoutAt, adherenceStatus: getAdherenceStatus(lastWorkoutAt) };
  });
}

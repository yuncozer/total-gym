import type { SupabaseClient } from "@supabase/supabase-js";

interface ClientLike {
  userId: string | null;
}

export async function enrichWithAvatar<T extends ClientLike>(
  supabase: SupabaseClient,
  clients: T[]
): Promise<(T & { avatarUrl: string | null })[]> {
  const linkedUserIds = [...new Set(clients.filter((c) => c.userId).map((c) => c.userId as string))];

  const avatarMap = new Map<string, string | null>();
  if (linkedUserIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, avatar_url").in("id", linkedUserIds);
    for (const row of data || []) {
      avatarMap.set(row.id, row.avatar_url);
    }
  }

  return clients.map((c) => ({
    ...c,
    avatarUrl: c.userId ? avatarMap.get(c.userId) ?? null : null,
  }));
}

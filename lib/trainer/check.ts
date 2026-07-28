import type { SupabaseClient } from "@supabase/supabase-js";

export async function isTrainer(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("trainers")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return !!data;
}

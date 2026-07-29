import type { SupabaseClient } from "@supabase/supabase-js";

export async function claimInviteToken(
  adminClient: SupabaseClient,
  userId: string,
  inviteToken: string | null | undefined
): Promise<boolean> {
  if (!inviteToken) return false;

  const { data: pending } = await adminClient
    .from("trainer_clients")
    .select("id")
    .eq("invite_token", inviteToken)
    .is("user_id", null)
    .eq("status", "invited")
    .maybeSingle();

  if (!pending) return false;

  const { error } = await adminClient
    .from("trainer_clients")
    .update({
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pending.id);

  return !error;
}

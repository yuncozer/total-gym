import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("trainer_progress_shares")
    .select("token, expires_at")
    .eq("client_id", id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ token: existing.token, expiresAt: existing.expires_at });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: created, error: insertError } = await supabase
    .from("trainer_progress_shares")
    .insert({ client_id: id, trainer_id: trainerId, expires_at: expiresAt })
    .select("token, expires_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ token: created.token, expiresAt: created.expires_at });
}

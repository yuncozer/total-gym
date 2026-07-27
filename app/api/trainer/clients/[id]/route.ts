import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { mapTrainerClient as mapClient } from "@/lib/trainer/mapClient";
import { enrichWithAdherence } from "@/lib/trainer/enrichAdherence";

const EDITABLE_FIELDS: Record<string, string> = {
  displayName: "display_name",
  email: "email",
  phone: "phone",
  status: "status",
  goal: "goal",
  level: "level",
  startDate: "start_date",
  notes: "notes",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("trainer_clients")
    .select("*")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [enriched] = await enrichWithAdherence(supabase, [mapClient(data)]);

  return NextResponse.json({ client: enriched });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, column] of Object.entries(EDITABLE_FIELDS)) {
    if (key in body) updates[column] = body[key];
  }

  const { data, error: updateError } = await supabase
    .from("trainer_clients")
    .update(updates)
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client: mapClient(data) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { error: deleteError } = await supabase
    .from("trainer_clients")
    .delete()
    .eq("id", id)
    .eq("trainer_id", trainerId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

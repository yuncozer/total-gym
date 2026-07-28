import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

const EDITABLE_FIELDS: Record<string, string> = {
  scheduledAt: "scheduled_at",
  durationMinutes: "duration_minutes",
  status: "status",
  location: "location",
  notes: "notes",
};

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
    .from("training_sessions")
    .update(updates)
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .select("id, client_id, scheduled_at, duration_minutes, status, location, notes")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: data.id,
      clientId: data.client_id,
      scheduledAt: data.scheduled_at,
      durationMinutes: data.duration_minutes,
      status: data.status,
      location: data.location,
      notes: data.notes,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { error: deleteError } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", id)
    .eq("trainer_id", trainerId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

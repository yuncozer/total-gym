import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

interface AssignmentRow {
  id: string;
  routine_id: string;
  client_id: string;
  status: string;
  created_at: string;
  trainer_routines: { name: string } | { name: string }[] | null;
}

function mapAssignment(row: AssignmentRow) {
  const rel = row.trainer_routines;
  const routineName = Array.isArray(rel) ? rel[0]?.name : rel?.name;
  return {
    id: row.id,
    routineId: row.routine_id,
    routineName: routineName || null,
    clientId: row.client_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("routine_assignments")
    .select("id, routine_id, client_id, status, created_at, trainer_routines(name)")
    .eq("client_id", id)
    .eq("trainer_id", trainerId)
    .eq("status", "active")
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ assignment: data ? mapAssignment(data as unknown as AssignmentRow) : null });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();
  const routineId = body.routineId ? String(body.routineId) : null;

  if (!routineId) {
    return NextResponse.json({ error: "routineId is required" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Este cliente todavía no tiene cuenta vinculada" }, { status: 400 });
  }

  const { data: routine } = await supabase
    .from("trainer_routines")
    .select("id")
    .eq("id", routineId)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  await supabase
    .from("routine_assignments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("client_id", id)
    .eq("status", "active");

  const { data, error: insertError } = await supabase
    .from("routine_assignments")
    .insert({
      routine_id: routineId,
      client_id: id,
      trainer_id: trainerId,
      user_id: client.user_id,
      status: "active",
    })
    .select("id, routine_id, client_id, status, created_at, trainer_routines(name)")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ assignment: mapAssignment(data as unknown as AssignmentRow) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { error: updateError } = await supabase
    .from("routine_assignments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("client_id", id)
    .eq("trainer_id", trainerId)
    .eq("status", "active");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

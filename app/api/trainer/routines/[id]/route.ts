import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

interface TrainerRoutineRow {
  id: string;
  trainer_id: string;
  name: string;
  description: string | null;
  goal: string | null;
  exercises: unknown;
  created_at: string;
  updated_at: string;
}

function mapRoutine(row: TrainerRoutineRow) {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    name: row.name,
    description: row.description,
    goal: row.goal,
    exercises: row.exercises,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("trainer_routines")
    .select("*")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  return NextResponse.json({ routine: mapRoutine(data) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("name" in body) updates.name = String(body.name).trim().slice(0, 60);
  if ("description" in body) updates.description = body.description ? String(body.description).trim() : null;
  if ("goal" in body) updates.goal = body.goal ? String(body.goal).trim() : null;
  if ("exercises" in body) updates.exercises = Array.isArray(body.exercises) ? body.exercises : [];

  const { data, error: updateError } = await supabase
    .from("trainer_routines")
    .update(updates)
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  return NextResponse.json({ routine: mapRoutine(data) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { error: deleteError } = await supabase
    .from("trainer_routines")
    .delete()
    .eq("id", id)
    .eq("trainer_id", trainerId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

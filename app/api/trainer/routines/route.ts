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

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("trainer_routines")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ routines: (data || []).map(mapRoutine) });
}

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();
  const name = body.name ? String(body.name).trim().slice(0, 60) : "";
  const description = body.description ? String(body.description).trim() : null;
  const goal = body.goal ? String(body.goal).trim() : null;
  const exercises = Array.isArray(body.exercises) ? body.exercises : [];

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (exercises.length === 0) {
    return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("trainer_routines")
    .insert({
      trainer_id: trainerId,
      name,
      description,
      goal,
      exercises,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ routine: mapRoutine(data) });
}

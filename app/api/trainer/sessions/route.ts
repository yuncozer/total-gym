import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

function mapSession(row: {
  id: string;
  client_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  location: string | null;
  notes: string | null;
}, clientName: string) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    location: row.location,
    notes: row.notes,
  };
}

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  let query = supabase
    .from("training_sessions")
    .select("id, client_id, scheduled_at, duration_minutes, status, location, notes")
    .eq("trainer_id", trainerId)
    .order("scheduled_at", { ascending: true });

  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  const { data, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const clientIds = [...new Set((data || []).map((s) => s.client_id))];
  const { data: clients } = clientIds.length > 0
    ? await supabase.from("trainer_clients").select("id, display_name").in("id", clientIds)
    : { data: [] as { id: string; display_name: string }[] };

  const nameMap = new Map((clients || []).map((c) => [c.id, c.display_name]));

  return NextResponse.json({
    sessions: (data || []).map((s) => mapSession(s, nameMap.get(s.client_id) || "")),
  });
}

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();

  const clientId = body.clientId ? String(body.clientId) : null;
  const scheduledAt = body.scheduledAt ? String(body.scheduledAt) : null;
  const durationMinutes = Number.isFinite(body.durationMinutes) ? Number(body.durationMinutes) : 60;
  const location = body.location ? String(body.location).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!clientId || !scheduledAt) {
    return NextResponse.json({ error: "clientId and scheduledAt are required" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, display_name")
    .eq("id", clientId)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data: created, error: insertError } = await supabase
    .from("training_sessions")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      location,
      notes,
    })
    .select("id, client_id, scheduled_at, duration_minutes, status, location, notes")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ session: mapSession(created, client.display_name) });
}

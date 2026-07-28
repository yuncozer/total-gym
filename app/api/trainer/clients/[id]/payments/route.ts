import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

function mapPayment(row: {
  id: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  paid_at: string;
  method: string | null;
  sessions_included: number | null;
  notes: string | null;
}) {
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at,
    method: row.method,
    sessionsIncluded: row.sessions_included,
    notes: row.notes,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: payments, error: fetchError } = await supabase
    .from("client_payments")
    .select("id, amount, currency, period_start, period_end, paid_at, method, sessions_included, notes")
    .eq("client_id", id)
    .order("paid_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let sessionsUsed = 0;
  const latestWithPackage = (payments || []).find((p) => p.sessions_included != null);
  if (latestWithPackage) {
    const { count } = await supabase
      .from("training_sessions")
      .select("*", { head: true, count: "exact" })
      .eq("client_id", id)
      .eq("status", "completed")
      .gte("scheduled_at", latestWithPackage.period_start || latestWithPackage.paid_at);
    sessionsUsed = count || 0;
  }

  return NextResponse.json({
    payments: (payments || []).map(mapPayment),
    sessionsUsed: latestWithPackage ? sessionsUsed : null,
  });
}

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

  const body = await request.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount is required" }, { status: 400 });
  }

  const { data: created, error: insertError } = await supabase
    .from("client_payments")
    .insert({
      client_id: id,
      trainer_id: trainerId,
      amount,
      currency: body.currency ? String(body.currency).slice(0, 8) : "USD",
      period_start: body.periodStart || null,
      period_end: body.periodEnd || null,
      method: body.method ? String(body.method).trim() : null,
      sessions_included: Number.isFinite(body.sessionsIncluded) ? Number(body.sessionsIncluded) : null,
      notes: body.notes ? String(body.notes).trim() : null,
    })
    .select("id, amount, currency, period_start, period_end, paid_at, method, sessions_included, notes")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ payment: mapPayment(created) });
}

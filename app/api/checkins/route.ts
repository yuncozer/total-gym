import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function mapCheckin(row: {
  id: string;
  weight_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
}) {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    waistCm: row.waist_cm,
    chestCm: row.chest_cm,
    armCm: row.arm_cm,
    thighCm: row.thigh_cm,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function delta(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 100) / 100;
}

export async function POST(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: link } = await admin
    .from("trainer_clients")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "No tienes un entrenador activo vinculado" }, { status: 400 });
  }

  const body = await request.json();
  const weightKg = typeof body.weightKg === "number" ? body.weightKg : null;
  const waistCm = typeof body.waistCm === "number" ? body.waistCm : null;
  const chestCm = typeof body.chestCm === "number" ? body.chestCm : null;
  const armCm = typeof body.armCm === "number" ? body.armCm : null;
  const thighCm = typeof body.thighCm === "number" ? body.thighCm : null;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : null;

  if ([weightKg, waistCm, chestCm, armCm, thighCm].every((v) => v == null)) {
    return NextResponse.json({ error: "Ingresa al menos una medida" }, { status: 400 });
  }

  const { data: previousRow } = await admin
    .from("client_checkins")
    .select("weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, notes, created_at, id")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await admin
    .from("client_checkins")
    .insert({
      client_id: link.id,
      user_id: session.user.id,
      weight_kg: weightKg,
      waist_cm: waistCm,
      chest_cm: chestCm,
      arm_cm: armCm,
      thigh_cm: thighCm,
      notes,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    checkin: mapCheckin(created),
    previous: previousRow ? mapCheckin(previousRow) : null,
    deltas: {
      weightKg: delta(weightKg, previousRow?.weight_kg),
      waistCm: delta(waistCm, previousRow?.waist_cm),
      chestCm: delta(chestCm, previousRow?.chest_cm),
      armCm: delta(armCm, previousRow?.arm_cm),
      thighCm: delta(thighCm, previousRow?.thigh_cm),
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

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

  const { data, error: fetchError } = await supabase
    .from("client_checkins")
    .select("id, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, notes, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({
    checkins: (data || []).map((row) => ({
      id: row.id,
      weightKg: row.weight_kg,
      waistCm: row.waist_cm,
      chestCm: row.chest_cm,
      armCm: row.arm_cm,
      thighCm: row.thigh_cm,
      notes: row.notes,
      createdAt: row.created_at,
    })),
  });
}

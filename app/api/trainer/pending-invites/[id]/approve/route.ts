import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data: client, error: fetchError } = await supabase
    .from("trainer_clients")
    .select("*")
    .eq("id", id)
    .eq("trainer_id", trainerId)
    .eq("status", "invited")
    .maybeSingle();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found or not in invited status" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("trainer_clients")
    .update({
      status: "active",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, client });
}

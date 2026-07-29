import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("trainer_clients")
    .select("id, display_name, email, invited_at")
    .eq("trainer_id", trainerId)
    .eq("status", "invited")
    .order("invited_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({
    pending: data || [],
    count: (data || []).length,
  });
}

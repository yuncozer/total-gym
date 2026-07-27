import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const { data } = await supabase
    .from("trainers")
    .select("display_name")
    .eq("user_id", trainerId)
    .maybeSingle();

  return NextResponse.json({
    isTrainer: true,
    displayName: data?.display_name ?? null,
  });
}

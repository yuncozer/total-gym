import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { mapTrainerClient as mapClient } from "@/lib/trainer/mapClient";
import { enrichWithAdherence } from "@/lib/trainer/enrichAdherence";
import { adherenceSeverity } from "@/lib/trainer/adherence";
import { enrichWithPaymentStatus } from "@/lib/trainer/enrichPaymentStatus";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { data, error: fetchError } = await supabase
    .from("trainer_clients")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const withAdherence = await enrichWithAdherence(supabase, (data || []).map(mapClient));
  const enriched = await enrichWithPaymentStatus(supabase, withAdherence);
  enriched.sort((a, b) => adherenceSeverity(a.adherenceStatus) - adherenceSeverity(b.adherenceStatus));

  return NextResponse.json({ clients: enriched });
}

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const displayName = body.displayName ? String(body.displayName).trim() : "";
  const phone = body.phone ? String(body.phone).trim() : null;
  const goal = body.goal ? String(body.goal).trim() : null;
  const level = body.level ? String(body.level).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (email) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      const { data, error: insertError } = await supabase
        .from("trainer_clients")
        .insert({
          trainer_id: trainerId,
          user_id: existingUser.id,
          display_name: displayName || existingUser.email,
          email: existingUser.email,
          phone,
          goal,
          level,
          notes,
          status: "active",
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return NextResponse.json({ error: "Ese cliente ya está en tu cartera" }, { status: 409 });
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ client: mapClient(data) });
    }
  }

  if (!displayName) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("trainer_clients")
    .insert({
      trainer_id: trainerId,
      user_id: null,
      display_name: displayName,
      email,
      phone,
      goal,
      level,
      notes,
      status: email ? "invited" : "active",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ client: mapClient(data) });
}

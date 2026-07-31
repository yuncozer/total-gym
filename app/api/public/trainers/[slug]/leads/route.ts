import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { normalizeWhatsappPhone } from "@/lib/trainer/socialLinks";
import { getTrainerEmail, sendTrainerLeadEmail, sendTrainerLeadWhatsapp } from "@/lib/trainer/notifyTrainer";

webpush.setVapidDetails(
  "mailto:notifications@totalgym.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: trainer } = await admin
    .from("trainers")
    .select("user_id, display_name, is_active, whatsapp_phone")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!trainer || !trainer.is_active) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 255) : "";

  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Nombre y email válidos son requeridos" }, { status: 400 });
  }

  const { data: existingLead } = await admin
    .from("trainer_clients")
    .select("id, invite_token, user_id")
    .eq("trainer_id", trainer.user_id)
    .eq("email", email)
    .maybeSingle();

  if (existingLead) {
    if (existingLead.user_id) {
      return NextResponse.json({ alreadyRequested: true, alreadyClient: true });
    }
    return NextResponse.json({ alreadyRequested: true, inviteToken: existingLead.invite_token });
  }

  const { data: matchedProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  const { data: created, error: insertError } = await admin
    .from("trainer_clients")
    .insert({
      trainer_id: trainer.user_id,
      user_id: matchedProfile?.id ?? null,
      display_name: name,
      email,
      status: "invited",
    })
    .select("id, invite_token")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const clientDetailUrl = `${process.env.NEXT_PUBLIC_APP_URL}/entrenador/clientes/${created.id}`;

  const { data: subs } = await admin.from("push_subs").select("*").eq("user_id", trainer.user_id);
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "Nuevo interesado 🎯",
          body: `${name} quiere entrenar contigo`,
          icon: "/icon-192.png",
          url: `/entrenador/clientes/${created.id}`,
        })
      );
    } catch {}
  }

  try {
    const trainerEmail = await getTrainerEmail(admin, trainer.user_id);
    if (trainerEmail) {
      await sendTrainerLeadEmail({
        to: trainerEmail,
        trainerName: trainer.display_name,
        leadName: name,
        leadEmail: email,
        clientDetailUrl,
      });
    }
  } catch (e) {
    console.error("[leads] email notify failed", e);
  }

  try {
    const phone = normalizeWhatsappPhone(trainer.whatsapp_phone || "");
    if (phone) {
      await sendTrainerLeadWhatsapp({ toPhone: phone, leadName: name, clientDetailUrl });
    }
  } catch (e) {
    console.error("[leads] whatsapp notify failed", e);
  }

  return NextResponse.json({ success: true, inviteToken: created.invite_token });
}

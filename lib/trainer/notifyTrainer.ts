import { SupabaseClient } from "@supabase/supabase-js";

export async function getTrainerEmail(admin: SupabaseClient, trainerUserId: string): Promise<string | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", trainerUserId)
    .maybeSingle();

  if (profile?.email) return profile.email;

  const { data } = await admin.auth.admin.getUserById(trainerUserId);
  return data?.user?.email ?? null;
}

interface SendTrainerLeadEmailParams {
  to: string;
  trainerName: string;
  leadName: string;
  leadEmail: string;
  clientDetailUrl: string;
}

export async function sendTrainerLeadEmail({
  to,
  trainerName,
  leadName,
  leadEmail,
  clientDetailUrl,
}: SendTrainerLeadEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.log("[notifyTrainer] Resend no configurado, se omite el correo", { to, leadName });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: "Nuevo interesado 🎯",
      html: `
        <p>Hola ${trainerName},</p>
        <p><strong>${leadName}</strong> (${leadEmail}) quiere entrenar contigo en TOTAL GYM.</p>
        <p><a href="${clientDetailUrl}" style="display:inline-block;background:#eab308;color:#050505;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">Revisar y responder</a></p>
      `,
    }),
  });

  if (!res.ok) {
    console.error("[notifyTrainer] Resend respondió con error", res.status, await res.text());
  }
}

interface SendTrainerLeadWhatsappParams {
  toPhone: string;
  leadName: string;
  clientDetailUrl: string;
}

export async function sendTrainerLeadWhatsapp({
  toPhone,
  leadName,
  clientDetailUrl,
}: SendTrainerLeadWhatsappParams): Promise<void> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_CLOUD_API_TEMPLATE_NAME;

  if (!token || !phoneNumberId || !templateName) {
    console.log("[notifyTrainer] Meta WhatsApp Cloud API no configurado, se omite el mensaje", { toPhone, leadName });
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_CLOUD_API_TEMPLATE_LANG || "es" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: leadName },
              { type: "text", text: clientDetailUrl },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    console.error("[notifyTrainer] Meta WhatsApp Cloud API respondió con error", res.status, await res.text());
  }
}

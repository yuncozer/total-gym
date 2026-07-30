import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { instagramUrl, tiktokUrl, xUrl, whatsappUrl } from "@/lib/trainer/socialLinks";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: trainer } = await admin
    .from("trainers")
    .select("user_id, display_name, bio, specialty, is_active, avatar_url, instagram_handle, tiktok_handle, x_handle, whatsapp_phone")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!trainer || !trainer.is_active) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const { count: activeClientCount } = await admin
    .from("trainer_clients")
    .select("*", { head: true, count: "exact" })
    .eq("trainer_id", trainer.user_id)
    .eq("status", "active");

  let avatarUrl = trainer.avatar_url as string | null;
  if (!avatarUrl) {
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", trainer.user_id)
      .maybeSingle();
    avatarUrl = ownerProfile?.avatar_url || null;
  }

  return NextResponse.json({
    displayName: trainer.display_name,
    bio: trainer.bio,
    specialty: trainer.specialty,
    avatarUrl,
    activeClientCount: activeClientCount || 0,
    social: {
      instagram: instagramUrl(trainer.instagram_handle),
      tiktok: tiktokUrl(trainer.tiktok_handle),
      x: xUrl(trainer.x_handle),
      whatsapp: whatsappUrl(trainer.whatsapp_phone),
    },
  });
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: trainer } = await admin
    .from("trainers")
    .select("user_id, display_name, bio, specialty, is_active")
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

  return NextResponse.json({
    displayName: trainer.display_name,
    bio: trainer.bio,
    specialty: trainer.specialty,
    activeClientCount: activeClientCount || 0,
  });
}

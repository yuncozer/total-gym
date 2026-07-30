import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "trainer-gallery";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: trainer } = await admin
    .from("trainers")
    .select("user_id, is_active")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!trainer || !trainer.is_active) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const { data } = await admin
    .from("trainer_gallery_items")
    .select("id, media_type, storage_path")
    .eq("trainer_id", trainer.user_id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data || []).map((item) => {
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(item.storage_path);
    return {
      id: item.id,
      mediaType: item.media_type as "image" | "video",
      url: urlData.publicUrl,
    };
  });

  return NextResponse.json({ items });
}

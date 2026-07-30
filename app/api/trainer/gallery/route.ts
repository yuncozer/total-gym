import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

const MAX_ITEMS = 12;
const BUCKET = "trainer-gallery";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const { data, error: fetchError } = await supabase
    .from("trainer_gallery_items")
    .select("id, media_type, storage_path, created_at")
    .eq("trainer_id", trainerId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const items = (data || []).map((item) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(item.storage_path);
    return {
      id: item.id,
      mediaType: item.media_type as "image" | "video",
      url: urlData.publicUrl,
      createdAt: item.created_at,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();

  const { count } = await supabase
    .from("trainer_gallery_items")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", trainerId);

  if ((count || 0) >= MAX_ITEMS) {
    return NextResponse.json({ error: `Máximo ${MAX_ITEMS} elementos en la galería` }, { status: 400 });
  }

  const body = await request.json();
  const storagePath = typeof body.storagePath === "string" ? body.storagePath : null;
  const mediaType = body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : null;

  if (!storagePath || !mediaType) {
    return NextResponse.json({ error: "storagePath y mediaType son requeridos" }, { status: 400 });
  }

  if (!storagePath.startsWith(`${trainerId}/`)) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("trainer_gallery_items")
    .insert({ trainer_id: trainerId, media_type: mediaType, storage_path: storagePath })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    id: inserted.id,
    mediaType,
    url: urlData.publicUrl,
    createdAt: inserted.created_at,
  });
}

export async function DELETE(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const body = await request.json();
  const itemId = typeof body.itemId === "string" ? body.itemId : null;
  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const supabase = getTrainerAdminClient();

  const { data: item } = await supabase
    .from("trainer_gallery_items")
    .select("storage_path")
    .eq("id", itemId)
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([item.storage_path]);
  await supabase.from("trainer_gallery_items").delete().eq("id", itemId);

  return NextResponse.json({ success: true });
}

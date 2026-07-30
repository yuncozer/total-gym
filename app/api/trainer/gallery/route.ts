import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";

const MAX_ITEMS = 12;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
const BUCKET = "trainer-gallery";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG, PNG, WEBP, MP4, MOV o WEBM" }, { status: 400 });
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Archivo muy grande (máx ${Math.round(maxSize / 1024 / 1024)}MB)` }, { status: 400 });
  }

  const mediaType = isVideo ? "video" : "image";
  const extByMime: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
  };
  const ext = extByMime[file.type] || "bin";
  const storagePath = `${trainerId}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("trainer_gallery_items")
    .insert({ trainer_id: trainerId, media_type: mediaType, storage_path: storagePath })
    .select("id, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
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

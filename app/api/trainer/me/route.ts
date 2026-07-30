import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { slugifyCustom, validateSlugFormat, SLUG_ERROR_MESSAGES } from "@/lib/trainer/slug";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
  normalizeXHandle,
  normalizeWhatsappPhone,
} from "@/lib/trainer/socialLinks";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const { data } = await supabase
    .from("trainers")
    .select("display_name, bio, specialty, public_slug, avatar_url, instagram_handle, tiktok_handle, x_handle, whatsapp_phone")
    .eq("user_id", trainerId)
    .maybeSingle();

  return NextResponse.json({
    isTrainer: true,
    displayName: data?.display_name ?? null,
    bio: data?.bio ?? null,
    specialty: data?.specialty ?? null,
    publicSlug: data?.public_slug ?? null,
    avatarUrl: data?.avatar_url ?? null,
    instagramHandle: data?.instagram_handle ?? null,
    tiktokHandle: data?.tiktok_handle ?? null,
    xHandle: data?.x_handle ?? null,
    whatsappPhone: data?.whatsapp_phone ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ("displayName" in body) updates.display_name = String(body.displayName).trim().slice(0, 60);
  if ("bio" in body) updates.bio = body.bio ? String(body.bio).trim().slice(0, 500) : null;
  if ("specialty" in body) updates.specialty = body.specialty ? String(body.specialty).trim().slice(0, 80) : null;

  if ("publicSlug" in body && body.publicSlug) {
    const requestedSlug = slugifyCustom(String(body.publicSlug));

    const formatError = validateSlugFormat(requestedSlug);
    if (formatError) {
      return NextResponse.json({ error: SLUG_ERROR_MESSAGES[formatError] }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("trainers")
      .select("user_id")
      .eq("public_slug", requestedSlug)
      .maybeSingle();

    if (existing && existing.user_id !== trainerId) {
      return NextResponse.json({ error: "Ese link ya está en uso, prueba otro" }, { status: 409 });
    }
    updates.public_slug = requestedSlug;
  }

  if ("instagramHandle" in body) updates.instagram_handle = body.instagramHandle ? normalizeInstagramHandle(String(body.instagramHandle)) || null : null;
  if ("tiktokHandle" in body) updates.tiktok_handle = body.tiktokHandle ? normalizeTikTokHandle(String(body.tiktokHandle)) || null : null;
  if ("xHandle" in body) updates.x_handle = body.xHandle ? normalizeXHandle(String(body.xHandle)) || null : null;
  if ("whatsappPhone" in body) updates.whatsapp_phone = body.whatsappPhone ? normalizeWhatsappPhone(String(body.whatsappPhone)) || null : null;

  const { data, error: updateError } = await supabase
    .from("trainers")
    .update(updates)
    .eq("user_id", trainerId)
    .select("display_name, bio, specialty, public_slug, avatar_url, instagram_handle, tiktok_handle, x_handle, whatsapp_phone")
    .single();

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "Ese link ya está en uso, prueba otro" }, { status: 409 });
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    displayName: data.display_name,
    bio: data.bio,
    specialty: data.specialty,
    publicSlug: data.public_slug,
    avatarUrl: data.avatar_url ?? null,
    instagramHandle: data.instagram_handle ?? null,
    tiktokHandle: data.tiktok_handle ?? null,
    xHandle: data.x_handle ?? null,
    whatsappPhone: data.whatsapp_phone ?? null,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { slugifyCustom } from "@/lib/trainer/slug";

export async function GET(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const supabase = getTrainerAdminClient();
  const { data } = await supabase
    .from("trainers")
    .select("display_name, bio, specialty, public_slug, avatar_url")
    .eq("user_id", trainerId)
    .maybeSingle();

  return NextResponse.json({
    isTrainer: true,
    displayName: data?.display_name ?? null,
    bio: data?.bio ?? null,
    specialty: data?.specialty ?? null,
    publicSlug: data?.public_slug ?? null,
    avatarUrl: data?.avatar_url ?? null,
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

  const { data, error: updateError } = await supabase
    .from("trainers")
    .update(updates)
    .eq("user_id", trainerId)
    .select("display_name, bio, specialty, public_slug, avatar_url")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    displayName: data.display_name,
    bio: data.bio,
    specialty: data.specialty,
    publicSlug: data.public_slug,
    avatarUrl: data.avatar_url ?? null,
  });
}

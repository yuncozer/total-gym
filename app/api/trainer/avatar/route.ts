import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { avatarPublicUrl, removeAvatarObject } from "@/lib/avatar/storage";

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const admin = getTrainerAdminClient();
  const avatarUrl = avatarPublicUrl(admin, "trainers", trainerId);

  const { error: updateError } = await admin
    .from("trainers")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", trainerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl });
}

export async function DELETE(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const admin = getTrainerAdminClient();
  await removeAvatarObject(admin, "trainers", trainerId);

  const { error: updateError } = await admin
    .from("trainers")
    .update({ avatar_url: null })
    .eq("user_id", trainerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl: null });
}

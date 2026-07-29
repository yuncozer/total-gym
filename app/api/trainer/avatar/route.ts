import { NextRequest, NextResponse } from "next/server";
import { checkTrainerAccess } from "@/lib/trainer/route";
import { getTrainerAdminClient } from "@/lib/trainer/client";
import { replaceAvatar, removeAvatarFiles } from "@/lib/avatar/storage";

export async function POST(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
  }

  const admin = getTrainerAdminClient();
  const result = await replaceAvatar(admin, `trainers/${trainerId}`, file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { error: updateError } = await admin
    .from("trainers")
    .update({ avatar_url: result.publicUrl })
    .eq("user_id", trainerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl: result.publicUrl });
}

export async function DELETE(request: NextRequest) {
  const { trainerId, error } = await checkTrainerAccess(request);
  if (error) return error;

  const admin = getTrainerAdminClient();
  await removeAvatarFiles(admin, `trainers/${trainerId}`);

  const { error: updateError } = await admin
    .from("trainers")
    .update({ avatar_url: null })
    .eq("user_id", trainerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl: null });
}

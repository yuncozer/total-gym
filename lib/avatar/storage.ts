import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ReplaceAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; status: number; error: string };

export async function removeAvatarFiles(
  admin: SupabaseClient,
  folder: string,
  keepPath?: string
): Promise<void> {
  const { data: existing } = await admin.storage.from(AVATAR_BUCKET).list(folder);
  const stale = (existing || [])
    .map((f) => `${folder}/${f.name}`)
    .filter((path) => path !== keepPath);

  if (stale.length > 0) {
    await admin.storage.from(AVATAR_BUCKET).remove(stale);
  }
}

export async function replaceAvatar(
  admin: SupabaseClient,
  folder: string,
  file: File
): Promise<ReplaceAvatarResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, status: 400, error: "El archivo debe ser una imagen" };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, status: 400, error: "La imagen supera 5MB" };
  }

  const ext = EXT_BY_MIME[file.type] || "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { ok: false, status: 500, error: uploadError.message };
  }

  await removeAvatarFiles(admin, folder, path);

  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}

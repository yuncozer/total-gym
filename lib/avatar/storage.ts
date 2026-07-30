import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export type AvatarFolder = "users" | "trainers";

export function avatarStoragePath(folder: AvatarFolder, userId: string): string {
  return `${folder}/${userId}/avatar.jpg`;
}

export function avatarPublicUrl(admin: SupabaseClient, folder: AvatarFolder, userId: string): string {
  const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(avatarStoragePath(folder, userId));
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeAvatarObject(admin: SupabaseClient, folder: AvatarFolder, userId: string): Promise<void> {
  await admin.storage.from(AVATAR_BUCKET).remove([avatarStoragePath(folder, userId)]);
}

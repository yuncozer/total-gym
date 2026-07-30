"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_BUCKET, MAX_AVATAR_SIZE, avatarStoragePath, type AvatarFolder } from "@/lib/avatar/storage";
import { reencodeImageAsJpeg } from "@/lib/media/image";

const OUTPUT_SIZE = 512;

export const AVATAR_UPDATED_EVENT = "tg:avatar-updated";

interface AvatarUploadProps {
  endpoint: string;
  folder: AvatarFolder;
  currentUrl: string | null;
  fallback: string;
  onChange: (url: string | null) => void;
  size?: "md" | "lg";
}

async function parseJsonResponse(res: Response, fallbackError: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(fallbackError);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(fallbackError);
  }
}

export function AvatarUpload({ endpoint, folder, currentUrl, fallback, onChange, size = "lg" }: AvatarUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const dimension = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const fallbackSize = size === "lg" ? "text-3xl" : "text-xl";

  const handlePick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("avatar.invalidType"));
      return;
    }

    if (file.size === 0) {
      toast.error(t("avatar.emptyFile"));
      return;
    }

    setBusy(true);
    try {
      const processed = await reencodeImageAsJpeg(file, { maxDimension: OUTPUT_SIZE, square: true, quality: 0.85 });
      if (processed.size === 0) {
        toast.error(t("avatar.emptyFile"));
        return;
      }
      if (processed.size > MAX_AVATAR_SIZE) {
        toast.error(t("avatar.tooLarge"));
        return;
      }

      const { data: { session } } = await createClient().auth.getSession();
      if (!session?.user) {
        toast.error(t("avatar.uploadError"));
        return;
      }

      const path = avatarStoragePath(folder, session.user.id);
      const { error: uploadError } = await createClient().storage
        .from(AVATAR_BUCKET)
        .upload(path, processed, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw new Error(uploadError.message || t("avatar.uploadError"));

      const res = await fetch(endpoint, { method: "POST" });
      const data = await parseJsonResponse(res, t("avatar.uploadError"));
      if (!res.ok) throw new Error(data.error || t("avatar.uploadError"));

      onChange(data.avatarUrl);
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT));
      toast.success(t("avatar.uploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("avatar.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await parseJsonResponse(res, t("avatar.removeError"));
      if (!res.ok) throw new Error(data.error || t("avatar.removeError"));

      onChange(null);
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT));
      toast.success(t("avatar.removed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("avatar.removeError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          aria-label={t("avatar.change")}
          className={`${dimension} rounded-full bg-[#0a0a0b] border-2 border-accent/70 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-accent hover:shadow-[0_0_18px_rgba(234,179,8,0.35)] disabled:cursor-not-allowed`}
        >
          {currentUrl ? (
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={`${fallbackSize} font-black text-accent`} style={{ fontFamily: "var(--font-oswald)" }}>
              {fallback.charAt(0).toUpperCase()}
            </span>
          )}
        </button>

        <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 pointer-events-none">
          {busy ? (
            <Loader2 className="w-4 h-4 text-black animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-black" />
          )}
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{t("avatar.title")}</p>
        <p className="text-xs text-muted-foreground mb-2">{t("avatar.hint")}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePick}
            disabled={busy}
            className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("avatar.change")}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {t("avatar.remove")}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

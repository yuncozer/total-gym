"use client";

import { useState, useEffect } from "react";
import { UserCircle, Loader2, AlertCircle, CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { TrainerSubnav } from "@/app/components/TrainerSubnav";
import { AvatarUpload } from "@/app/components/AvatarUpload";
import { TrainerGalleryManager } from "@/app/components/TrainerGalleryManager";
import { InstagramIcon, TikTokIcon, XIcon, WhatsAppIcon } from "@/app/components/SocialIcons";
import { useLanguage } from "@/lib/i18n";

export default function TrainerProfileSettingsPage() {
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/trainer/me")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setSpecialty(data.specialty || "");
        setPublicSlug(data.publicSlug || "");
        setAvatarUrl(data.avatarUrl || null);
        setInstagramHandle(data.instagramHandle || "");
        setTiktokHandle(data.tiktokHandle || "");
        setXHandle(data.xHandle || "");
        setWhatsappPhone(data.whatsappPhone || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const publicUrl = publicSlug && typeof window !== "undefined" ? `${window.location.origin}/e/${publicSlug}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/trainer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName, bio, specialty, publicSlug: publicSlug || undefined,
          instagramHandle, tiktokHandle, xHandle, whatsappPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("trainer.profileSaveError"));
      }
      setPublicSlug(data.publicSlug || "");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("trainer.profileSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <TrainerSubnav />

        <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("trainer.publicProfileTitle")}
          </h1>
        </div>

        {publicUrl && (
          <div className="bg-card/60 border border-accent/30 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              {t("trainer.publicProfileLinkTitle")}
            </p>
            <div className="flex items-center gap-2">
              <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{publicUrl}</p>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-icon hover:text-white transition-colors shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="bg-card border border rounded-2xl p-5 mb-4">
          <AvatarUpload
            endpoint="/api/trainer/avatar"
            folder="trainers"
            currentUrl={avatarUrl}
            fallback={displayName || "?"}
            onChange={setAvatarUrl}
          />
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("trainer.profileName")}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("trainer.profileSpecialty")}</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder={t("trainer.profileSpecialtyPlaceholder")}
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("trainer.profileBio")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={t("trainer.profileBioPlaceholder")}
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors resize-none"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t("trainer.profileSlug")}</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-icon shrink-0">/e/</span>
              <input
                type="text"
                value={publicSlug}
                onChange={(e) => setPublicSlug(e.target.value)}
                placeholder="tu-nombre"
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                disabled={saving}
              />
            </div>
            <p className="text-xs text-icon mt-1.5">Mínimo 3 caracteres, minúsculas, números y guiones</p>
          </div>

          <div className="pt-2 border-t border">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 mt-3">Redes sociales</p>
            <div className="space-y-3">
              <div className="relative">
                <InstagramIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="Instagram (usuario)"
                  className="w-full bg-background border border rounded-xl text-white pl-11 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={saving}
                />
              </div>
              <div className="relative">
                <TikTokIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                <input
                  type="text"
                  value={tiktokHandle}
                  onChange={(e) => setTiktokHandle(e.target.value)}
                  placeholder="TikTok (usuario)"
                  className="w-full bg-background border border rounded-xl text-white pl-11 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={saving}
                />
              </div>
              <div className="relative">
                <XIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                <input
                  type="text"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  placeholder="X / Twitter (usuario)"
                  className="w-full bg-background border border rounded-xl text-white pl-11 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={saving}
                />
              </div>
              <div className="relative">
                <WhatsAppIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="WhatsApp (con código de país)"
                  className="w-full bg-background border border rounded-xl text-white pl-11 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />{t("trainer.profileSaved")}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("trainer.profileSave")}
          </button>
        </form>

        <TrainerGalleryManager />
        </div>
      </main>
    </div>
  );
}

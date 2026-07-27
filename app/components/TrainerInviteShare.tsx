"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, QrCode, Clock } from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "@/lib/i18n";

interface TrainerInviteShareProps {
  inviteToken: string;
  clientName: string;
}

export function TrainerInviteShare({ inviteToken, clientName }: TrainerInviteShareProps) {
  const { t } = useLanguage();
  const inviteUrl = `${window.location.origin}/register?invite=${inviteToken}`;
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!showQr || !inviteUrl || qrDataUrl) return;
    QRCode.toDataURL(inviteUrl, {
      width: 220,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [showQr, inviteUrl, qrDataUrl]);

  const shareMessage = `${t("trainer.shareInviteMessage")} ${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "TOTAL GYM",
        text: t("trainer.shareInviteMessage"),
        url: inviteUrl,
      });
    } catch {}
  };

  return (
    <div className="bg-card/60 border border-accent/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
          {t("trainer.shareInviteTitle")}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
          <Clock className="w-3 h-3" />
          {t("trainer.shareInvitePending")}
        </span>
      </div>

      <p className="text-xs text-icon mb-3">{t("trainer.shareInviteSubtitle")}</p>

      <div className="bg-zinc-800/60 border border rounded-xl p-3 flex items-center gap-3 mb-3">
        <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{inviteUrl}</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">{t("trainer.shareInviteCopied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              {t("trainer.shareInviteCopy")}
            </>
          )}
        </button>
      </div>

      <button
        onClick={() => setShowQr((v) => !v)}
        className="w-full flex items-center justify-center gap-2 bg-background hover:bg-muted text-muted-foreground hover:text-white font-semibold py-2.5 rounded-xl border border transition-all cursor-pointer text-sm mb-3"
      >
        <QrCode className="w-4 h-4" />
        {showQr ? t("trainer.shareInviteHideQr") : t("trainer.shareInviteShowQr")}
      </button>

      {showQr && (
        <div className="flex justify-center mb-3">
          {qrDataUrl ? (
            <div className="bg-white p-3 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR de invitación para ${clientName}`} width={220} height={220} />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] bg-white/10 rounded-xl animate-pulse" />
          )}
        </div>
      )}

      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent font-semibold py-3 rounded-xl border border-accent/20 transition-all cursor-pointer mb-2"
        >
          <Share2 className="w-4 h-4" />
          {t("trainer.shareInviteNative")}
        </button>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank")}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold py-2.5 rounded-xl border border-green-600/20 text-sm transition-all cursor-pointer"
        >
          {t("trainer.shareInviteWhatsapp")}
        </button>
        <button
          onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(t("trainer.shareInviteMessage"))}`, "_blank")}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 font-semibold py-2.5 rounded-xl border border-sky-600/20 text-sm transition-all cursor-pointer"
        >
          {t("trainer.shareInviteTelegram")}
        </button>
      </div>
    </div>
  );
}

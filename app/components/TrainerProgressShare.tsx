"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2, FileBarChart } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface TrainerProgressShareProps {
  clientId: string;
}

export function TrainerProgressShare({ clientId }: TrainerProgressShareProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/trainer/clients/${clientId}/progress-share`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUrl(`${window.location.origin}/reporte/${data.token}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: "Informe de progreso · TOTAL GYM", url });
    } catch {}
  };

  return (
    <div className="bg-card/60 border border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <FileBarChart className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("trainer.progressReportTitle")}
        </span>
      </div>
      <p className="text-xs text-icon mb-3">{t("trainer.progressReportSubtitle")}</p>

      {!url ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent font-semibold py-2.5 rounded-xl border border-accent/20 transition-all cursor-pointer disabled:opacity-50 text-sm"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
          {t("trainer.progressReportGenerate")}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="bg-zinc-800/60 border border rounded-xl p-3 flex items-center gap-3">
            <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{url}</p>
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
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent font-semibold py-2.5 rounded-xl border border-accent/20 transition-all cursor-pointer text-sm"
            >
              <Share2 className="w-4 h-4" />
              {t("trainer.shareInviteNative")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

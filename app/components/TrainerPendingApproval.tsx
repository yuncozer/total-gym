"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, X, UserCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  clientId: string;
  onResolved: (status: "active" | "archived") => void;
}

export function TrainerPendingApproval({ clientId, onResolved }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await fetch(`/api/trainer/pending-invites/${clientId}/approve`, { method: "POST" });
      if (res.ok) onResolved("active");
    } catch {}
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      const res = await fetch(`/api/trainer/pending-invites/${clientId}/reject`, { method: "POST" });
      if (res.ok) onResolved("archived");
    } catch {}
    setLoading(null);
  };

  return (
    <div className="bg-card/60 border border-accent/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
          {t("trainer.pendingApprovalTitle")}
        </span>
      </div>

      <p className="text-xs text-icon mb-3">{t("trainer.pendingApprovalBody")}</p>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
        >
          {loading === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {t("trainer.approve")}
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
        >
          {loading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          {t("trainer.reject")}
        </button>
      </div>
    </div>
  );
}

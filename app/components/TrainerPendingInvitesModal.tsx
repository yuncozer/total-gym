"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, X, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface PendingInvite {
  id: string;
  display_name: string;
  email?: string | null;
  invited_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function TrainerPendingInvitesModal({ isOpen, onClose, onRefresh }: Props) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPending();
    }
  }, [isOpen]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/pending-invites");
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/trainer/pending-invites/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        onRefresh?.();
      }
    } catch {}
    setActionInProgress(null);
  };

  const handleReject = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/trainer/pending-invites/${id}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        onRefresh?.();
      }
    } catch {}
    setActionInProgress(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-16 right-4 z-50 w-full max-w-md bg-gradient-to-b from-card to-[#0e0e10] border border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="px-4 py-3 border-b border">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            {t("trainer.pendingInvites") || "Invitaciones pendientes"}
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : pending.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("trainer.noPendingInvites") || "No hay invitaciones pendientes"}
            </p>
          </div>
        ) : (
          <div className="py-2 max-h-96 overflow-y-auto">
            {pending.map((invite) => (
              <div
                key={invite.id}
                className="px-4 py-3 border-b border hover:bg-accent/5 transition-colors"
              >
                <div className="mb-2">
                  <p className="text-white text-sm font-medium truncate">
                    {invite.display_name}
                  </p>
                  {invite.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {invite.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(invite.id)}
                    disabled={actionInProgress === invite.id}
                    className="flex-1 px-3 py-2 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    {actionInProgress === invite.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {t("trainer.approve") || "Aprobar"}
                  </button>
                  <button
                    onClick={() => handleReject(invite.id)}
                    disabled={actionInProgress === invite.id}
                    className="flex-1 px-3 py-2 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    {actionInProgress === invite.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {t("trainer.reject") || "Rechazar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

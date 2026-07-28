"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dumbbell, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface SessionSummary {
  id: string;
  date: string;
  name: string | null;
  completedAt: string | null;
  commentCount: number;
}

interface TrainerRecentSessionsProps {
  clientId: string;
}

export function TrainerRecentSessions({ clientId }: TrainerRecentSessionsProps) {
  const { t, lang } = useLanguage();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trainer/clients/${clientId}/workouts`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setSessions(data.workouts || []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" });

  return (
    <div className="bg-card/60 border border rounded-xl p-4 mb-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
        {t("trainer.recentSessions")}
      </span>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-icon" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-icon py-2">{t("trainer.noSessions")}</p>
      ) : (
        <div className="space-y-1">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/entrenador/clientes/${clientId}/sesiones/${s.id}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Dumbbell className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{s.name || t("trainer.rosterTitle")}</p>
                <p className="text-[10px] text-icon">{formatDate(s.completedAt || s.date)}</p>
              </div>
              {s.commentCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-accent shrink-0">
                  <MessageCircle className="w-3 h-3" />
                  {s.commentCount}
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-icon shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

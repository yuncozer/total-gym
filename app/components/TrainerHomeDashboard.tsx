"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, AlertTriangle, CreditCard, CalendarClock, Dumbbell, Calendar, UserCircle, ChevronRight, UserPlus } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { adherenceSeverity, type AdherenceStatus } from "@/lib/trainer/adherence";

interface TrainerClient {
  id: string;
  userId: string | null;
  displayName: string;
  status: "invited" | "active" | "paused" | "archived";
  adherenceStatus: AdherenceStatus;
  paymentStatus: "current" | "due_soon" | "overdue" | "none";
}

interface TrainerSession {
  id: string;
  clientId: string;
  clientName: string;
  scheduledAt: string;
}

function adherenceDotColor(status: AdherenceStatus): string {
  switch (status) {
    case "green": return "bg-green-500";
    case "amber": return "bg-amber-500";
    case "red": return "bg-red-500";
    case "unknown": return "bg-zinc-600";
  }
}

function StatTile({ icon: Icon, value, label, accent }: { icon: typeof Users; value: number; label: string; accent?: string }) {
  return (
    <div className="bg-card/80 border border rounded-xl p-3 sm:p-4 text-center">
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 ${accent || "text-accent"}`} />
      <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
        {value}
      </div>
      <div className="text-icon text-xs sm:text-sm">{label}</div>
    </div>
  );
}

export function TrainerHomeDashboard() {
  const { t, lang } = useLanguage();
  const [clients, setClients] = useState<TrainerClient[]>([]);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    Promise.all([
      fetch("/api/trainer/clients").then((r) => (r.ok ? r.json() : { clients: [] })),
      fetch(`/api/trainer/sessions?from=${todayStart}&to=${todayEnd}`).then((r) => (r.ok ? r.json() : { sessions: [] })),
    ])
      .then(([clientsData, sessionsData]) => {
        setClients(clientsData.clients || []);
        setSessions(sessionsData.sessions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-card/40 border border rounded-xl p-3 sm:p-4 h-[86px] sm:h-[96px] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (clients.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <Link
          href="/entrenador/clientes/nuevo"
          className="group flex items-center gap-4 bg-card border border-accent/20 rounded-xl p-6 hover:border-accent/50 transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
            <UserPlus className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("trainer.homeEmptyTitle")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("trainer.homeEmptyDesc")}</p>
          </div>
          <span className="flex items-center gap-1.5 text-accent font-semibold text-sm shrink-0 whitespace-nowrap">
            {t("trainer.homeEmptyCta")}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </section>
    );
  }

  const activeCount = clients.filter((c) => c.status === "active").length;
  const paymentAttentionCount = clients.filter((c) => c.paymentStatus === "due_soon" || c.paymentStatus === "overdue").length;

  const attentionClients = clients
    .filter((c) =>
      (c.userId && (c.adherenceStatus === "red" || c.adherenceStatus === "amber")) ||
      c.paymentStatus === "due_soon" || c.paymentStatus === "overdue"
    )
    .sort((a, b) => adherenceSeverity(a.adherenceStatus) - adherenceSeverity(b.adherenceStatus));

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="max-w-4xl mx-auto px-4 mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatTile icon={Users} value={activeCount} label={t("trainer.homeActiveClients")} />
        <StatTile
          icon={AlertTriangle}
          value={attentionClients.length}
          label={t("trainer.homeNeedsAttention")}
          accent={attentionClients.length > 0 ? "text-red-400" : undefined}
        />
        <StatTile
          icon={CreditCard}
          value={paymentAttentionCount}
          label={t("trainer.homePaymentsDue")}
          accent={paymentAttentionCount > 0 ? "text-amber-400" : undefined}
        />
        <StatTile icon={CalendarClock} value={sessions.length} label={t("trainer.homeSessionsToday")} />
      </div>

      {sessions.length > 0 && (
        <div className="bg-card/60 border border rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{t("trainer.homeTodayTitle")}</h3>
          <div className="space-y-1">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href="/entrenador/agenda"
                className="flex items-center justify-between gap-2 text-sm hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                <span className="text-white truncate">{s.clientName}</span>
                <span className="text-icon text-xs shrink-0">{formatTime(s.scheduledAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {attentionClients.length > 0 && (
        <div className="bg-card/60 border border rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">{t("trainer.homeAttentionTitle")}</h3>
          <div className="space-y-1">
            {attentionClients.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/entrenador/clientes/${c.id}`}
                className="flex items-center gap-3 hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              >
                {(c.adherenceStatus === "red" || c.adherenceStatus === "amber") && (
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${adherenceDotColor(c.adherenceStatus)}`} />
                )}
                <span className="text-white text-sm flex-1 truncate">{c.displayName}</span>
                {(c.paymentStatus === "due_soon" || c.paymentStatus === "overdue") && (
                  <CreditCard className={`w-3.5 h-3.5 shrink-0 ${c.paymentStatus === "overdue" ? "text-red-400" : "text-amber-400"}`} />
                )}
                <ChevronRight className="w-4 h-4 text-icon shrink-0" />
              </Link>
            ))}
          </div>
          {attentionClients.length > 5 && (
            <Link href="/entrenador" className="block text-center text-xs text-accent mt-2 hover:underline">
              {t("trainer.homeViewAll")}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/entrenador" className="flex flex-col items-center gap-2 bg-card/60 border border rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer">
          <Users className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground text-center">{t("trainer.rosterTitle")}</span>
        </Link>
        <Link href="/entrenador/rutinas" className="flex flex-col items-center gap-2 bg-card/60 border border rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer">
          <Dumbbell className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground text-center">{t("trainer.myRoutinesLink")}</span>
        </Link>
        <Link href="/entrenador/agenda" className="flex flex-col items-center gap-2 bg-card/60 border border rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer">
          <Calendar className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground text-center">{t("trainer.agendaTitle")}</span>
        </Link>
        <Link href="/entrenador/perfil" className="flex flex-col items-center gap-2 bg-card/60 border border rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer">
          <UserCircle className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground text-center">{t("trainer.publicProfileLink")}</span>
        </Link>
      </div>
    </section>
  );
}

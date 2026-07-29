"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Users, Plus, ChevronRight, Mail, Clock, CreditCard } from "lucide-react";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { TrainerSubnav } from "@/app/components/TrainerSubnav";
import { Avatar } from "@/app/components/Avatar";
import { daysSince, type AdherenceStatus } from "@/lib/trainer/adherence";

interface TrainerClient {
  id: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  status: "invited" | "active" | "paused" | "archived";
  goal: string | null;
  createdAt: string;
  lastWorkoutAt: string | null;
  adherenceStatus: AdherenceStatus;
  paymentStatus: "current" | "due_soon" | "overdue" | "none";
  avatarUrl: string | null;
}

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function TrainerRosterPage() {
  const { t, lang } = useLanguage();
  const [clients, setClients] = useState<TrainerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trainer/clients")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        setClients(data.clients || []);
      })
      .catch(() => setError(t("trainer.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const statusLabel = (status: TrainerClient["status"]) => {
    switch (status) {
      case "invited": return t("trainer.statusInvited");
      case "active": return t("trainer.statusActive");
      case "paused": return t("trainer.statusPaused");
      case "archived": return t("trainer.statusArchived");
    }
  };

  const statusStyle = (status: TrainerClient["status"]) => {
    switch (status) {
      case "invited": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "active": return "bg-green-500/15 text-green-400 border-green-500/30";
      case "paused": return "bg-zinc-600/20 text-zinc-400 border-zinc-500/30";
      case "archived": return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  const adherenceDotColor = (status: AdherenceStatus) => {
    switch (status) {
      case "green": return "bg-green-500";
      case "amber": return "bg-amber-500";
      case "red": return "bg-red-500";
      case "unknown": return "bg-zinc-600";
    }
  };

  const adherenceText = (client: TrainerClient) => {
    if (!client.userId) return null;
    if (!client.lastWorkoutAt) return t("trainer.neverTrained");
    const days = daysSince(client.lastWorkoutAt);
    if (days <= 0) return t("trainer.trainedToday");
    if (days === 1) return t("trainer.trainedYesterday");
    return t("trainer.trainedDaysAgo").replace("{days}", String(days));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <TrainerSubnav />
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {t("trainer.rosterTitle")}
              </h1>
              <p className="text-icon text-sm">{t("trainer.rosterSubtitle")}</p>
            </div>
          </div>
          <Link
            href="/entrenador/clientes/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("trainer.addClient")}
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-card border border rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-icon mx-auto mb-3" />
            <p className="text-muted-foreground">{t("trainer.noClients")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/entrenador/clientes/${client.id}`}
                className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.1)] transition-all duration-200 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={client.avatarUrl}
                    fallback={client.displayName}
                    className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-bold"
                  />
                  {client.userId && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${adherenceDotColor(client.adherenceStatus)}`}
                      title={adherenceText(client) || undefined}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{client.displayName}</p>
                  <div className="flex items-center gap-2 text-xs text-icon">
                    {client.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {client.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {adherenceText(client) || `${t("trainer.clientSince")} ${formatDate(client.createdAt, lang)}`}
                    </span>
                  </div>
                </div>
                {(client.paymentStatus === "due_soon" || client.paymentStatus === "overdue") && (
                  <span
                    className={`p-1.5 rounded-full border shrink-0 ${
                      client.paymentStatus === "overdue"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                    title={client.paymentStatus === "overdue" ? t("trainer.paymentOverdue") : t("trainer.paymentDueSoon")}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${statusStyle(client.status)}`}>
                  {statusLabel(client.status)}
                </span>
                <ChevronRight className="w-4 h-4 text-icon group-hover:text-accent transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

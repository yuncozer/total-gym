"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Flame, Zap, Trophy, Dumbbell, ArrowLeft, Loader2, Mail, Phone, Target, Save, Check, Activity, Trash2 } from "lucide-react";
import Link from "next/link";
import { xpForLevel } from "@/lib/gamification";
import { TrainerInviteShare } from "@/app/components/TrainerInviteShare";
import { TrainerAssignRoutine } from "@/app/components/TrainerAssignRoutine";
import { TrainerRecentSessions } from "@/app/components/TrainerRecentSessions";
import { TrainerCheckinHistory } from "@/app/components/TrainerCheckinHistory";
import { TrainerProgressShare } from "@/app/components/TrainerProgressShare";
import { TrainerPaymentHistory } from "@/app/components/TrainerPaymentHistory";
import { Avatar } from "@/app/components/Avatar";
import { daysSince, type AdherenceStatus } from "@/lib/trainer/adherence";

interface TrainerClient {
  id: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  status: "invited" | "active" | "paused" | "archived";
  goal: string | null;
  level: string | null;
  notes: string | null;
  inviteToken: string | null;
  lastWorkoutAt: string | null;
  adherenceStatus: AdherenceStatus;
  paymentStatus: "current" | "due_soon" | "overdue" | "none";
  createdAt: string;
}

interface LinkedProfile {
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  weekWorkouts: number;
  totalVolume: number;
  avatarUrl: string | null;
}

function statusLabel(status: TrainerClient["status"], t: (key: string) => string): string {
  switch (status) {
    case "invited": return t("trainer.statusInvited");
    case "active": return t("trainer.statusActive");
    case "paused": return t("trainer.statusPaused");
    case "archived": return t("trainer.statusArchived");
  }
}

function adherenceStyle(status: AdherenceStatus): string {
  switch (status) {
    case "green": return "bg-green-500/15 text-green-400 border-green-500/30";
    case "amber": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "red": return "bg-red-500/15 text-red-400 border-red-500/30";
    case "unknown": return "bg-zinc-600/20 text-zinc-400 border-zinc-500/30";
  }
}

function adherenceLabel(status: AdherenceStatus, t: (key: string) => string): string {
  switch (status) {
    case "green": return t("trainer.adherenceGreen");
    case "amber": return t("trainer.adherenceAmber");
    case "red": return t("trainer.adherenceRed");
    case "unknown": return t("trainer.adherenceUnknown");
  }
}

function paymentStyle(status: TrainerClient["paymentStatus"]): string {
  switch (status) {
    case "current": return "bg-green-500/15 text-green-400 border-green-500/30";
    case "due_soon": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "overdue": return "bg-red-500/15 text-red-400 border-red-500/30";
    case "none": return "bg-zinc-600/20 text-zinc-400 border-zinc-500/30";
  }
}

function paymentLabel(status: TrainerClient["paymentStatus"], t: (key: string) => string): string {
  switch (status) {
    case "current": return t("trainer.paymentCurrent");
    case "due_soon": return t("trainer.paymentDueSoon");
    case "overdue": return t("trainer.paymentOverdue");
    case "none": return "";
  }
}

function adherenceActivityText(client: TrainerClient, t: (key: string) => string): string {
  if (!client.userId) return t("trainer.adherenceUnknown");
  if (!client.lastWorkoutAt) return t("trainer.neverTrained");
  const days = daysSince(client.lastWorkoutAt);
  if (days <= 0) return t("trainer.trainedToday");
  if (days === 1) return t("trainer.trainedYesterday");
  return t("trainer.trainedDaysAgo").replace("{days}", String(days));
}

function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Principiante", 2: "Aprendiz", 3: "Constante",
    4: "Dedicado", 5: "Forjado", 6: "Guerrero",
    7: "Titanio", 8: "Élite", 9: "Leyenda",
  };
  return titles[level] || "TOTAL GYM";
}

export default function TrainerClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [client, setClient] = useState<TrainerClient | null>(null);
  const [profile, setProfile] = useState<LinkedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/trainer/clients/${id}`);
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setClient(data.client);
        setNotes(data.client.notes || "");

        if (data.client.userId) {
          const profileRes = await fetch(`/api/users/${data.client.userId}/profile`);
          if (profileRes.ok) {
            setProfile(await profileRes.json());
          }
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await fetch(`/api/trainer/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm(t("trainer.confirmDeleteClient"))) return;
    setDeleting(true);
    try {
      await fetch(`/api/trainer/clients/${id}`, { method: "DELETE" });
      router.push("/entrenador");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-lg">Cliente no encontrado</p>
        <Link href="/entrenador" className="mt-4 text-accent text-sm hover:underline cursor-pointer">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const xpForCurrent = profile ? xpForLevel(profile.level) : 0;
  const xpForNext = profile ? xpForLevel(profile.level + 1) : 0;
  const progress = profile && xpForNext - xpForCurrent > 0
    ? Math.min((profile.xp - xpForCurrent) / (xpForNext - xpForCurrent), 1)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-24 pb-24">
        <div className="bg-gradient-to-b from-card to-[#0e0e10] border border rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatarUrl}
              fallback={client.displayName}
              className="w-16 h-16 rounded-full bg-[#0a0a0b] border-2 border-accent/70 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              textClassName="text-2xl font-black text-accent"
              expandable
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-oswald)" }}>
                {client.displayName}
              </h1>
              {profile ? (
                <>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nivel {profile.level} · {getLevelTitle(profile.level)}
                  </p>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2 max-w-[200px]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.round(progress * 100)}%`,
                        background: "linear-gradient(90deg, #eab308, #f97316)",
                        boxShadow: "0 0 8px rgba(234,179,8,0.4)",
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {statusLabel(client.status, t)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card/60 border border rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-icon shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {t("trainer.adherenceTitle")}
              </span>
              <span className="text-xs text-icon">
                {adherenceActivityText(client, t)}
              </span>
            </div>
          </div>
          <span className={`text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border shrink-0 ${adherenceStyle(client.adherenceStatus)}`}>
            {adherenceLabel(client.adherenceStatus, t)}
          </span>
        </div>

        {client.paymentStatus !== "none" && (
          <div className="flex items-center justify-end mb-4 -mt-2">
            <span className={`text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border ${paymentStyle(client.paymentStatus)}`}>
              {paymentLabel(client.paymentStatus, t)}
            </span>
          </div>
        )}

        {client.status === "invited" && client.inviteToken && (
          <TrainerInviteShare inviteToken={client.inviteToken} clientName={client.displayName} />
        )}

        <TrainerPaymentHistory clientId={client.id} />

        <TrainerAssignRoutine clientId={client.id} hasAccount={!!client.userId} />

        {client.userId && <TrainerRecentSessions clientId={client.id} />}
        {client.userId && <TrainerCheckinHistory clientId={client.id} />}
        {client.userId && <TrainerProgressShare clientId={client.id} />}

        {profile && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Racha</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {profile.currentStreak}
                <span className="text-xs font-normal text-icon ml-1">días</span>
              </p>
              <p className="text-[10px] text-icon mt-0.5">
                Mejor: {profile.longestStreak} días
              </p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">XP</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {profile.xp.toLocaleString()}
              </p>
              <p className="text-[10px] text-icon mt-0.5">
                Nvl {profile.level} → {profile.level + 1}: {xpForNext - profile.xp} XP
              </p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Dumbbell className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Semana</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {profile.weekWorkouts}
                <span className="text-xs font-normal text-icon ml-1">w/o</span>
              </p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Volumen</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {(profile.totalVolume / 1000).toFixed(1)}
                <span className="text-xs font-normal text-icon ml-1">k kg</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-card/60 border border rounded-xl p-4 mb-4 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del cliente</span>
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-white">
              <Mail className="w-3.5 h-3.5 text-icon shrink-0" />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-white">
              <Phone className="w-3.5 h-3.5 text-icon shrink-0" />
              {client.phone}
            </div>
          )}
          {client.goal && (
            <div className="flex items-center gap-2 text-sm text-white">
              <Target className="w-3.5 h-3.5 text-icon shrink-0" />
              {client.goal}
            </div>
          )}
          {!client.email && !client.phone && !client.goal && (
            <p className="text-xs text-icon">Sin datos adicionales cargados</p>
          )}
        </div>

        <div className="bg-card/60 border border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas privadas</span>
            {notesSaved && <Check className="w-3.5 h-3.5 text-green-400" />}
          </div>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            placeholder="Lesiones, contraindicaciones, historial..."
            rows={4}
            className="w-full bg-background border border rounded-xl text-white px-3 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors resize-none"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer text-sm"
          >
            {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar notas
          </button>
        </div>

        <Link
          href="/entrenador"
          className="group mt-6 w-full flex items-center justify-center gap-2.5 bg-card/80 border border rounded-xl py-3.5 cursor-pointer transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_16px_rgba(234,179,8,0.12)]"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground transition-all duration-300 group-hover:text-accent group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            VOLVER A CLIENTES
          </span>
        </Link>

        <button
          onClick={handleDeleteClient}
          disabled={deleting}
          className="mt-3 w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl py-3 cursor-pointer transition-colors text-sm font-semibold disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {t("trainer.deleteClient")}
        </button>
      </div>

    </div>
  );
}

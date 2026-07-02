"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Flame, Zap, Trophy, Calendar, Dumbbell, ArrowLeft, Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { xpForLevel } from "@/lib/gamification";

interface FriendProfile {
  id: string;
  email: string;
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  weekWorkouts: number;
  totalVolume: number;
}

function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Principiante", 2: "Aprendiz", 3: "Constante",
    4: "Dedicado", 5: "Forjado", 6: "Guerrero",
    7: "Titanio", 8: "Élite", 9: "Leyenda",
  };
  return titles[level] || "TOTAL GYM";
}

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sharedWorkouts, setSharedWorkouts] = useState<any[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${id}/profile`);
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setProfile(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
    fetchSharesFromFriend();
  }, [id]);

  const fetchSharesFromFriend = async () => {
    setSharesLoading(true);
    try {
      const res = await fetch(`/api/friends/shares?friendId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      setSharedWorkouts(data.shares || []);
    } catch {
    } finally {
      setSharesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-lg">Usuario no encontrado</p>
        <Link href="/amigos" className="mt-4 text-accent text-sm hover:underline cursor-pointer">
          Volver a amigos
        </Link>
      </div>
    );
  }

  const xpForCurrent = xpForLevel(profile.level);
  const xpForNext = xpForLevel(profile.level + 1);
  const progress = xpForNext - xpForCurrent > 0
    ? Math.min((profile.xp - xpForCurrent) / (xpForNext - xpForCurrent), 1)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <Link
          href="/amigos"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t("header.back")}</span>
        </Link>

        {/* Hero */}
        <div className="bg-gradient-to-b from-card to-[#0e0e10] border border rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0a0a0b] border-2 border-accent/70 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <span className="text-2xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                {profile.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-oswald)" }}>
                {profile.email}
              </h1>
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
            </div>
          </div>
        </div>

        {/* Stats grid */}
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

        {/* Rutinas compartidas */}
        <div className="bg-card/60 border border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rutinas compartidas</span>
            {sharesLoading && <Loader2 className="w-3 h-3 animate-spin text-icon" />}
          </div>
          {sharedWorkouts.length === 0 && !sharesLoading ? (
            <p className="text-xs text-icon text-center py-4">Este amigo no compartió rutinas con vos</p>
          ) : (
            <div className="space-y-2">
              {sharedWorkouts.map((share: any) => (
                <Link
                  key={share.id}
                  href={`/shared-friend/${share.workoutId}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{share.workoutName}</p>
                    <p className="text-[10px] text-icon">
                      {share.workoutDate ? new Date(share.workoutDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}
                    </p>
                  </div>
                  {share.viewedAt ? (
                    <EyeOff className="w-3.5 h-3.5 text-icon/40 shrink-0" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-accent shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* XP details */}
        <div className="bg-card/60 border border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progreso de nivel</span>
            <span className="text-[10px] text-icon tabular-nums">
              {profile.xp} / {xpForNext} XP
            </span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.round(progress * 100)}%`,
                background: "linear-gradient(90deg, #eab308, #f97316)",
                boxShadow: "0 0 10px rgba(234,179,8,0.5)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-icon mt-1.5">
            <span>{getLevelTitle(profile.level)}</span>
            <span>{getLevelTitle(profile.level + 1) || "TOTAL GYM"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

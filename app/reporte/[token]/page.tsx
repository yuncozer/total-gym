"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Flame, Zap, Trophy, Dumbbell, TrendingDown, TrendingUp,
  Loader2, AlertTriangle, Share2, Eye,
} from "lucide-react";
import { LEVEL_TITLES } from "@/lib/gamification";

interface ReportStats {
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  weekWorkouts: number;
  totalVolume: number;
}

interface ReportProgress {
  weightChange: number | null;
  waistChange: number | null;
  since: string;
}

interface Report {
  clientName: string;
  goal: string | null;
  memberSince: string;
  trainerName: string | null;
  trainerSpecialty: string | null;
  stats: ReportStats | null;
  progress: ReportProgress | null;
  viewCount: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProgressReportPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reporte/${token}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) { setError(body.error || "No se pudo cargar el informe"); return; }
        setData(body);
      })
      .catch(() => setError("No se pudo cargar el informe"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mi progreso en TOTAL GYM", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
        <p className="text-white font-medium mb-2">{error || "Informe no encontrado"}</p>
        <Link href="/" className="text-accent text-sm hover:underline">Ir a TOTAL GYM</Link>
      </div>
    );
  }

  const levelTitle = data.stats ? (LEVEL_TITLES[data.stats.level] ?? "TOTAL GYM") : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Salir</span>
          </Link>
          <span className="text-base font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-accent">GYM</span>
          </span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-16">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#0a0a0b] border-2 border-accent/70 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(234,179,8,0.25)]">
            <span className="text-2xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
              {data.clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
            {data.clientName}
          </h1>
          {data.trainerName && (
            <p className="text-sm text-muted-foreground">
              Entrenado por <span className="text-accent font-semibold">{data.trainerName}</span>
              {data.trainerSpecialty ? ` · ${data.trainerSpecialty}` : ""}
            </p>
          )}
          <p className="text-[10px] text-icon/60 mt-2">Miembro desde {formatDate(data.memberSince)}</p>
        </div>

        {data.progress && (data.progress.weightChange != null || data.progress.waistChange != null) && (
          <div className="bg-gradient-to-r from-accent/15 via-card to-card border border-accent/30 rounded-2xl p-5 mb-6 text-center">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">
              Progreso desde {formatDate(data.progress.since)}
            </p>
            <div className="flex items-center justify-center gap-6">
              {data.progress.weightChange != null && (
                <div>
                  <div className="flex items-center justify-center gap-1 text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                    {data.progress.weightChange < 0 ? <TrendingDown className="w-5 h-5 text-accent" /> : <TrendingUp className="w-5 h-5 text-accent" />}
                    {Math.abs(data.progress.weightChange)} kg
                  </div>
                  <p className="text-[10px] text-icon uppercase tracking-wider">Peso</p>
                </div>
              )}
              {data.progress.waistChange != null && (
                <div>
                  <div className="flex items-center justify-center gap-1 text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                    {data.progress.waistChange < 0 ? <TrendingDown className="w-5 h-5 text-accent" /> : <TrendingUp className="w-5 h-5 text-accent" />}
                    {Math.abs(data.progress.waistChange)} cm
                  </div>
                  <p className="text-[10px] text-icon uppercase tracking-wider">Cintura</p>
                </div>
              )}
            </div>
          </div>
        )}

        {data.stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nivel</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {data.stats.level}
              </p>
              <p className="text-[10px] text-icon mt-0.5">{levelTitle}</p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Racha</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {data.stats.currentStreak}<span className="text-xs font-normal text-icon ml-1">días</span>
              </p>
              <p className="text-[10px] text-icon mt-0.5">Mejor: {data.stats.longestStreak} días</p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">XP</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {data.stats.xp.toLocaleString()}
              </p>
            </div>

            <div className="bg-card/60 border border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Dumbbell className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Volumen</span>
              </div>
              <p className="text-xl font-black text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {(data.stats.totalVolume / 1000).toFixed(1)}<span className="text-xs font-normal text-icon ml-1">k kg</span>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-card border border-accent/30 text-accent font-semibold py-3 rounded-xl hover:bg-accent/10 transition-colors cursor-pointer mb-6"
        >
          <Share2 className="w-4 h-4" />
          Compartir este progreso
        </button>

        <div className="bg-card border border-accent/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Este progreso se logró entrenando con un plan personalizado en <span className="text-white font-semibold">TOTAL GYM</span>.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            CREA TU CUENTA GRATIS
          </Link>
        </div>

        <p className="flex items-center justify-center gap-1 text-[10px] text-icon/50 mt-6">
          <Eye className="w-3 h-3" />
          {data.viewCount} visita{data.viewCount !== 1 ? "s" : ""}
        </p>
      </main>
    </div>
  );
}

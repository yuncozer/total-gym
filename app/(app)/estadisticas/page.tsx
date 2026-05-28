"use client";

import { useAuth } from "@/lib/useAuth";
import { useEffect, useState, useRef } from "react";
import { Flame, Dumbbell, Clock, Target, Award, Activity, BarChart3 } from "lucide-react";
import type { UserStats } from "@/lib/workout/service";
import { ErrorBanner } from "@/app/components/ErrorBanner";
import { LoadingScreen } from "@/app/components/LoadingScreen";

function useCountUp(end: number, duration = 1200, start = true): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!start || hasAnimated.current) {
      if (!start) setValue(0);
      return;
    }
    hasAnimated.current = true;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, start]);

  return value;
}

function useOnScreen(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Sparkline({ data, trend }: { data: number[]; trend: "up" | "down" | "flat" }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 240;
  const h = 56;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h * 0.7) - h * 0.15;
      return `${x},${y}`;
    })
    .join(" ");

  const color = trend === "up" ? "#22c55e" : "#eab308";

  return (
    <svg width={w} height={h} className="w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {trend === "up" && (
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      )}
      {trend === "up" && (
        <polygon
          fill="url(#sparkGrad)"
          points={`${points.split(" ").map((p, i) => {
            const [x] = p.split(",");
            return i === data.length - 1 ? `${x},${h}` : p;
          }).join(" ")},${w},${h} 0,${h}`}
        />
      )}
    </svg>
  );
}

function CircularProgress({ value, size = 72 }: { value: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  let color: string;
  let label: string;
  if (value >= 80) { color = "#22c55e"; label = "¡Racha imparable!"; }
  else if (value >= 60) { color = "#eab308"; label = "¡Buen ritmo!"; }
  else if (value >= 40) { color = "#f97316"; label = "Vas mejorando"; }
  else { color = "#6b7280"; label = "¡Cada día cuenta!"; }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-white/10" />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${value}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-icon shrink-0">{value}/100</span>
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null || value === undefined || value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
        isPositive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
      }`}
    >
      {isPositive ? "▲" : "▼"} {isPositive ? value : Math.abs(value)}{suffix}
    </span>
  );
}

function HeroCard({
  icon,
  label,
  value,
  badge,
  gradient = false,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  badge?: React.ReactNode;
  gradient?: boolean;
  children?: React.ReactNode;
}) {
  const [ref, visible] = useOnScreen(0.3);
  const count = useCountUp(value, 1200, visible);

  return (
    <div
      ref={ref}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-accent">
          {icon}
        </div>
        {badge}
      </div>
      <p
        className={`text-3xl font-bold tabular-nums tracking-tight ${
          gradient ? "bg-gradient-to-br from-accent via-accent to-purple-500 bg-clip-text text-transparent" : ""
        }`}
      >
        {count}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {children}
    </div>
  );
}

export default function EstadisticasPage() {
  const { authenticated, loading: authLoading } = useAuth(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    setDataLoading(true);
    fetch("/api/user-stats")
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setDataLoading(false);
      })
      .catch(() => {
        setError("Error al cargar estadísticas");
        setDataLoading(false);
      });
  }, [authenticated]);

  if (authLoading || dataLoading) {
    return <LoadingScreen />;
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorBanner message={error || "Error al cargar"} />
      </div>
    );
  }

  const { weeklyVolume, volumeChange } = stats;
  const sparklineData = weeklyVolume.map(w => w.volume);
  const sparkTrend: "up" | "down" | "flat" = volumeChange !== null && volumeChange > 0 ? "up" : "flat";

  const streakFireCount = stats.streak >= 20 ? 4 : stats.streak >= 15 ? 3 : stats.streak >= 10 ? 2 : stats.streak >= 5 ? 1 : 0;

  const streakText = stats.streakMilestone
    ? `${stats.streakMilestone}`
    : stats.streak >= 5
    ? "🔥"
    : null;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
      `}</style>


      <main className="max-w-lg mx-auto px-4 pt-24 pb-8 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-bold">Estadísticas</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HeroCard
            icon={<Target className="w-4 h-4" />}
            label="Entrenos totales"
            value={stats.totalWorkouts}
            gradient
            badge={<TrendBadge value={stats.workoutsChangeWeek} suffix="" />}
          >
            {stats.workoutsChangeWeek !== null && stats.workoutsChangeWeek > 0 && (
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 animate-[progressFill_1s_ease-out]"
                  style={{
                    width: `${Math.min(100, (stats.workoutsThisWeek / Math.max(stats.workoutsLastWeek, 1)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </HeroCard>

          <HeroCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="Volumen (kg)"
            value={stats.totalVolume}
            gradient
            badge={<TrendBadge value={stats.volumeChangeWeek} suffix="%" />}
          >
            {stats.volumeChangeWeek !== null && stats.volumeChangeWeek > 0 && (
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 animate-[progressFill_1s_ease-out]"
                  style={{
                    width: `${Math.min(100, (stats.volumeThisWeek / Math.max(stats.volumeLastWeek, 1)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </HeroCard>

          <HeroCard
            icon={
              <div className="relative">
                <Flame className={`w-4 h-4 ${stats.streak >= 5 ? "text-orange-500" : ""}`} />
              </div>
            }
            label="Racha actual"
            value={stats.streak}
            gradient
            badge={streakText ? (
              <span className="text-xs font-bold text-orange-500">{streakText}</span>
            ) : undefined}
          >
            {stats.streak >= 5 && (
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: streakFireCount }).map((_, i) => (
                  <span key={i} className="text-sm" style={{ animationDelay: `${i * 150}ms` }}>🔥</span>
                ))}
              </div>
            )}
          </HeroCard>

          <HeroCard
            icon={<Clock className="w-4 h-4" />}
            label="Horas entrenadas"
            value={stats.totalHours}
            gradient
            badge={<TrendBadge value={stats.hoursChangeWeek} suffix="%" />}
          >
            {stats.hoursChangeWeek !== null && stats.hoursChangeWeek > 0 && (
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500 animate-[progressFill_1s_ease-out]"
                  style={{
                    width: `${Math.min(100, (stats.hoursThisWeek / Math.max(stats.hoursLastWeek, 1)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </HeroCard>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Volumen Semanal</h2>
            {volumeChange !== null && volumeChange > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-500/15 px-2 py-0.5 rounded-full">
                ▲ {volumeChange}%
              </span>
            )}
          </div>
          {sparklineData.length >= 2 ? (
            <div className="h-14">
              <Sparkline data={sparklineData} trend={sparkTrend} />
            </div>
          ) : (
            <div className="h-14 flex items-center justify-center">
              <p className="text-xs text-icon">Necesitas más datos para ver la tendencia</p>
            </div>
          )}
          {weeklyVolume.length > 0 && (
            <div className="flex justify-between mt-2">
              {weeklyVolume.map((w, i) => (
                <span key={w.week} className="text-[10px] text-icon">
                  {monthNames[new Date(w.week).getMonth()]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Consistencia</h2>
          <CircularProgress value={stats.consistency30d} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {stats.topExercise && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Ejercicio Favorito</p>
                  <p className="text-base font-bold truncate">{stats.topExercise.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-accent">{stats.topExercise.count}</p>
                  <p className="text-[10px] text-icon uppercase">entrenos</p>
                </div>
              </div>
            </div>
          )}

          {stats.bestRecord && stats.bestRecord.weight > 0 && (
            <div className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-5 ${
              stats.bestRecord.daysAgo <= 7
                ? "border-orange-500/40 animate-pulse-glow"
                : "border-white/10"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Mejor Marca</p>
                    {stats.bestRecord.daysAgo <= 7 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-500/15 px-1.5 py-0.5 rounded-full">
                        ¡NUEVA!
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold truncate">{stats.bestRecord.exerciseName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-orange-500">{stats.bestRecord.weight}kg</p>
                  <p className="text-[10px] text-icon uppercase">
                    {stats.bestRecord.daysAgo === 0 ? "hoy" : `hace ${stats.bestRecord.daysAgo}d`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

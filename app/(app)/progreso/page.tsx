"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n";
import { TrendingUp, Dumbbell, Loader2, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ExerciseOption {
  id: string;
  name: string;
}

interface ProgressPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  volume: number;
}

export default function ProgresoPage() {
  const { loading: authLoading, authenticated } = useAuth(true);
  const { t, lang } = useLanguage();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"maxWeight" | "maxReps" | "volume">("maxWeight");
  const [showGuide, setShowGuide] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) return;

    fetchExercises();
  }, [authLoading, authenticated]);

  const fetchExercises = async () => {
    try {
      const res = await fetch("/api/exercises/user-exercises");
      if (!res.ok) throw new Error("Failed to load exercises");
      const data = await res.json();
      setExercises(data);
      if (data.length > 0) {
        setSelectedExercise(data[0].id);
      }
    } catch (err) {
      setError(t("progreso.errorExercises"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedExercise) return;

    fetchProgress();
  }, [selectedExercise]);

  const fetchProgress = async () => {
    setLoadingProgress(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/progress?exercise_id=${encodeURIComponent(selectedExercise)}`);
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      setError(t("progreso.error"));
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const metricLabel = (m: typeof metric) => {
    switch (m) {
      case "maxWeight": return t("progreso.weightLabel");
      case "maxReps": return t("progreso.repsLabel");
      case "volume": return t("progreso.volumeLabel");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" });
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (guideRef.current && !guideRef.current.contains(e.target as Node)) {
        setShowGuide(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black">
            <main className="max-w-4xl mx-auto px-4 py-8 pt-24">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("progreso.title")}
            </h1>
            <p className="text-icon text-sm">{t("progreso.subtitle")}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-icon mb-2">{t("progreso.exerciseLabel")}</label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-muted text-white rounded-xl px-4 py-3 border border focus:border-accent outline-none cursor-pointer"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm text-icon mb-2">{t("progreso.metricLabel")}</label>
              <div className="flex gap-2 items-center">
                {(["maxWeight", "maxReps", "volume"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      metric === m
                        ? "bg-accent text-black"
                        : "bg-muted text-icon hover:text-white"
                    }`}
                  >
                    {m === "maxWeight" ? t("progreso.metricWeight") : m === "maxReps" ? t("progreso.metricReps") : t("progreso.metricVolume")}
                  </button>
                ))}
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-10 h-10 rounded-xl bg-muted text-icon hover:text-white hover:border-accent transition-all flex items-center justify-center cursor-pointer shrink-0"
                  title={t("progreso.metricTitle")}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {showGuide && (
                <div
                  ref={guideRef}
                  className="absolute right-0 top-full mt-2 w-72 z-10 bg-card border border rounded-2xl shadow-2xl p-5 space-y-4 animate-fade-in"
                >
                  <p className="text-white font-semibold text-sm">{t("progreso.metricTitle")}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-accent text-xs font-semibold uppercase tracking-wider">{t("progreso.metricMaxWeight")}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t("progreso.metricMaxWeightDesc")}
                      </p>
                    </div>
                    <div>
                      <p className="text-accent text-xs font-semibold uppercase tracking-wider">{t("progreso.metricMaxReps")}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t("progreso.metricMaxRepsDesc")}
                      </p>
                    </div>
                    <div>
                      <p className="text-accent text-xs font-semibold uppercase tracking-wider">{t("progreso.metricVolumeTotal")}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t("progreso.metricVolumeTotalDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border pt-3">
                    <p className="text-white font-semibold text-xs mb-1">{t("progreso.chartGuide")}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("progreso.chartGuideDesc")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 text-red-400 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl p-6">
          {loadingProgress ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : progress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-icon">
              <Dumbbell className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">{t("progreso.noData")}</p>
              <p className="text-sm mt-1">{t("progreso.noDataMsg")}</p>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#71717a"
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <YAxis stroke="#71717a" tick={{ fill: "#71717a", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    labelFormatter={(label) => formatDate(label)}
                    formatter={(value: any) => [Number(value).toLocaleString(), metricLabel(metric)] as any}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="#eab308"
                    strokeWidth={3}
                    dot={{ fill: "#eab308", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#eab308" }}
                    name={metricLabel(metric)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

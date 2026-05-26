"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Dumbbell, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";
import { useAuth } from "@/lib/useAuth";
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
  const router = useRouter();
  const { loading: authLoading, authenticated } = useAuth(true);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"maxWeight" | "maxReps" | "volume">("maxWeight");

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
      setError("Error al cargar ejercicios");
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
      setError("Error al cargar progreso");
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const metricLabel = (m: typeof metric) => {
    switch (m) {
      case "maxWeight": return "Peso máximo (kg)";
      case "maxReps": return "Reps máximas";
      case "volume": return "Volumen total (kg)";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <UserHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-icon hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
              Progreso de Ejercicios
            </h1>
            <p className="text-icon text-sm">Evolución de cargas y repeticiones</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-icon mb-2">Ejercicio</label>
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
            <div>
              <label className="block text-sm text-icon mb-2">Métrica</label>
              <div className="flex gap-2">
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
                    {m === "maxWeight" ? "Peso" : m === "maxReps" ? "Reps" : "Volumen"}
                  </button>
                ))}
              </div>
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
              <p className="text-lg font-medium">Sin datos de progreso</p>
              <p className="text-sm mt-1">Completa entrenamientos para ver tu evolución</p>
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

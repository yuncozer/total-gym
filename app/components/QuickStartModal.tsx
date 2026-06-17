"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Loader2, Dumbbell, RefreshCw, Heart } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { selectExercises } from "@/lib/workout/exercise-planner";

type SplitType = "fullbody" | "upper" | "lower";

const SPLITS: Record<SplitType, { label: string; muscles: string[]; icon: typeof Dumbbell; desc: string }> = {
  fullbody: {
    label: "Cuerpo Completo",
    muscles: ["pecho", "espalda", "hombros", "piernas", "biceps", "triceps", "abdomen"],
    icon: Dumbbell,
    desc: "Ideal para principiantes. 3 días por semana.",
  },
  upper: {
    label: "Solo Superior",
    muscles: ["pecho", "espalda", "hombros", "biceps", "triceps", "abdomen"],
    icon: RefreshCw,
    desc: "Enfocado en torso y brazos.",
  },
  lower: {
    label: "Solo Inferior",
    muscles: ["piernas", "gluteos", "pantorrillas", "abdomen"],
    icon: Heart,
    desc: "Enfocado en piernas y glúteos.",
  },
};

export function QuickStartModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<SplitType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedSplit) return;
    setLoading(true);
    setError(null);

    try {
      const split = SPLITS[selectedSplit];

      const newDefs = await selectExercises({
        goal: "general",
        muscles: split.muscles,
        totalExercises: split.muscles.length,
      });

      if (newDefs.length === 0) {
        setError("No se encontraron ejercicios. Probá de nuevo.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises: newDefs.map((d) => ({
            id: d.exerciseId,
            name: d.name,
            imageUrl: d.imageUrl || undefined,
            muscle_group: d.muscleGroup,
            sets: Array.from({ length: d.setsCount }, (_, i) => ({
              reps: 10,
              peso: 0,
            })),
          })),
        }),
      });
      const workout = await res.json();
      if (workout?.id) {
        router.push(`/workout/${workout.id}`);
      } else {
        setError("Error al crear el entrenamiento.");
        setLoading(false);
      }
    } catch (e) {
      console.error("QuickStart error:", e);
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-card border border rounded-2xl p-6 animate-[fade-in-up_0.3s_ease-out] mx-4 mb-4 sm:mb-0">
        <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto mb-4" />
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("home.quickstart.title") ?? "MI PRIMERA RUTINA"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Elegí un split y el motor inteligente selecciona los mejores ejercicios
          </p>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-medium mt-2">
            <Zap className="w-2.5 h-2.5" /> Motor inteligente
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {(Object.entries(SPLITS) as [SplitType, typeof SPLITS[SplitType]][]).map(([key, split]) => {
            const Icon = split.icon;
            const isSelected = selectedSplit === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedSplit(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left active:scale-[0.97] ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border hover:border-accent/50 bg-card"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-accent/20" : "bg-zinc-800"
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-accent" : "text-icon"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{split.label}</div>
                  <div className="text-[11px] text-muted-foreground">{split.desc}</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Zap className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedSplit || loading}
          className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold rounded-xl cursor-pointer transition-all"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> CREANDO RUTINA...</>
          ) : (
            <><Zap className="w-4 h-4" /> EMPEZAR</>
          )}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 text-xs text-muted-foreground hover:text-white cursor-pointer py-2"
        >
          Prefiero elegir yo mismo
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Dumbbell, Loader2, CheckCircle2 } from "lucide-react";
import { SessionComments } from "@/app/components/SessionComments";
import { useLanguage } from "@/lib/i18n";

interface SetRow {
  id: string;
  reps: number | null;
  weight_kg: number | null;
  is_cardio?: boolean;
  distance_km?: number | null;
  duration_minutes?: number | null;
  is_completed: boolean;
  target_reps?: number | null;
  target_weight_kg?: number | null;
}

interface ExerciseSummary {
  exerciseId: string;
  name: string;
  muscleGroup?: string;
  sets: SetRow[];
}

export default function TrainerSessionDetailPage() {
  const { id, workoutId } = useParams<{ id: string; workoutId: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [workoutName, setWorkoutName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/workouts/${workoutId}`)
      .then(async (res) => {
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setExercises(data.exercises || []);
        setWorkoutName(data.name || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [workoutId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-lg">Sesión no encontrada</p>
        <Link href={`/entrenador/clientes/${id}`} className="mt-4 text-accent text-sm hover:underline cursor-pointer">
          Volver al cliente
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8 pt-24">
        <button
          onClick={() => router.push(`/entrenador/clientes/${id}`)}
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("trainer.back")}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-white truncate" style={{ fontFamily: "var(--font-oswald)" }}>
            {workoutName || t("trainer.rosterTitle")}
          </h1>
        </div>

        <div className="space-y-3 mb-6">
          {exercises.map((ex) => (
            <div key={ex.exerciseId} className="bg-card/60 border border rounded-xl p-4">
              <p className="text-white font-medium text-sm mb-2">{ex.name}</p>
              <div className="space-y-1">
                {ex.sets.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between text-xs text-icon">
                    <span>Serie {i + 1}</span>
                    <span className="flex items-center gap-2">
                      {s.is_cardio
                        ? `${s.distance_km ?? 0} km · ${s.duration_minutes ?? 0} min`
                        : `${s.reps ?? 0} reps × ${s.weight_kg ?? 0} kg`}
                      {s.is_completed && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {exercises.length === 0 && (
            <p className="text-icon text-sm text-center py-6">Sin ejercicios registrados</p>
          )}
        </div>

        <SessionComments workoutId={workoutId} />
      </main>
    </div>
  );
}

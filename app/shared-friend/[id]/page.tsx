"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Clock, Calendar, Copy, Check, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { createTemplate } from "@/lib/workout/service";
import type { ExerciseInWorkout } from "@/lib/workout/types";

function formatWeight(kg: number | null): string {
  if (kg == null) return "-";
  return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(1)} kg`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ExerciseCard({ exercise }: { exercise: ExerciseInWorkout }) {
  const totalSets = exercise.sets.length;
  const completedSets = exercise.sets.filter(s => s.is_completed).length;
  const hasWeight = exercise.sets.some(s => s.weight_kg && s.weight_kg > 0);
  const isBodyweight = exercise.sets.some(s => s.is_bodyweight);

  return (
    <div className="bg-card/60 border border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{exercise.name}</p>
          <p className="text-[10px] text-icon">
            {totalSets} serie{totalSets !== 1 ? "s" : ""}
            {completedSets > 0 && ` · ${completedSets} completadas`}
          </p>
        </div>
        {exercise.muscleGroup && (
          <span className="text-[10px] text-icon bg-muted/50 px-2 py-0.5 rounded-full capitalize shrink-0">
            {exercise.muscleGroup}
          </span>
        )}
      </div>
      <div className="px-4 py-2 space-y-1">
        {exercise.sets.map((set) => (
          <div key={set.set_number} className="flex items-center gap-3 text-xs">
            <span className="w-6 text-icon shrink-0">#{set.set_number}</span>
            {set.is_cardio ? (
              <span className="text-muted-foreground">
                {set.duration_minutes ? `${set.duration_minutes} min` : ""}
                {set.distance_km ? ` · ${set.distance_km} km` : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {set.reps ? `${set.reps} rep${set.reps !== 1 ? "s" : ""}` : "-"}
                {set.is_bodyweight ? " · Peso corporal" : (set.weight_kg ? ` × ${formatWeight(set.weight_kg)}` : "")}
              </span>
            )}
            {set.is_completed && (
              <span className="ml-auto text-green-500 text-[10px]">✓</span>
            )}
          </div>
        ))}
      </div>
      {hasWeight && !isBodyweight && (
        <div className="px-4 py-1.5 bg-muted/30 border-t border">
          <p className="text-[10px] text-icon/60 italic">* Pesos de referencia del creador</p>
        </div>
      )}
      {isBodyweight && (
        <div className="px-4 py-1.5 bg-muted/30 border-t border">
          <p className="text-[10px] text-accent/80 italic">Este ejercicio usa peso corporal</p>
        </div>
      )}
    </div>
  );
}

export default function SharedFriendWorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;

  const [exercises, setExercises] = useState<ExerciseInWorkout[]>([]);
  const [workoutName, setWorkoutName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workouts/${workoutId}`);
        if (!res.ok) {
          setError("Rutina no encontrada");
          return;
        }
        const data = await res.json();
        setExercises(data.exercises);
        setWorkoutName(data.name || "");
        setSenderEmail(data.senderEmail || "");
        setPhotos(data.photos || []);
      } catch {
        setError("Error al cargar la rutina");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId]);

  const handleSaveAsTemplate = async () => {
    if (!exercises.length || saving) return;
    setSaving(true);
    try {
      const templateExercises = exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        equipment: "",
        sets: Math.max(...ex.sets.map(s => s.set_number)),
      }));
      const templateName = workoutName
        ? senderEmail
          ? `${workoutName} by ${senderEmail}`
          : workoutName
        : "Rutina compartida";
      await createTemplate(templateName, templateExercises);
      setSaved(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Dumbbell className="w-6 h-6 text-accent" />
          </div>
          <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto mb-2" />
          <div className="h-3 w-48 bg-muted rounded animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-icon" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
            RUTINA NO ENCONTRADA
          </h1>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent text-black font-bold px-6 py-3 rounded-xl hover:bg-accent-hover transition-colors"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            IR AL INICIO
          </Link>
        </div>
      </div>
    );
  }

  if (!exercises.length) return null;

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Salir</span>
          </Link>
          <div className="flex flex-col items-center leading-none">
            <span className="text-base font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
              TOTAL<span className="text-accent">GYM</span>
            </span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
            {workoutName || "Rutina compartida"}
          </h1>
          {workoutName && senderEmail && (
            <p className="text-xs text-icon mb-2">por {senderEmail}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-xs text-icon mt-2">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalSets} serie{totalSets !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {photos.map((photo) => (
              <div key={photo.id} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
          ))}
        </div>

        <div className="text-center mt-8">
          {!saved ? (
            <button
              onClick={handleSaveAsTemplate}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  GUARDAR COMO PLANTILLA
                </>
              )}
            </button>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium">✓ Plantilla guardada</p>
              <button
                onClick={() => router.push("/entrenamiento")}
                className="mt-2 text-accent text-sm font-semibold hover:underline"
              >
                Ir a entrenamiento
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-icon/40 text-center mt-4">
          Los pesos mostrados son del creador de la rutina y son solo de referencia.
        </p>
      </main>
    </div>
  );
}

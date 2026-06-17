"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Zap, Heart, Target, Loader2, Check, ArrowLeft, Sparkles, Timer } from "lucide-react";
import { selectExercises } from "@/lib/workout/exercise-planner";

const GOALS = [
  { id: "fuerza", label: "Fuerza", desc: "Pocas reps, peso alto, compuestos", icon: Target, color: "text-blue-500" },
  { id: "hipertrofia", label: "Hipertrofia", desc: "8-12 reps, volumen moderado", icon: Dumbbell, color: "text-accent" },
  { id: "resistencia", label: "Resistencia", desc: "Muchas reps, poco descanso", icon: Heart, color: "text-red-500" },
  { id: "general", label: "General", desc: "Balanceado para empezar", icon: Zap, color: "text-green-500" },
] as const;

const TIME_OPTIONS = [15, 30, 45, 60] as const;

const EXERCISES_PER_TIME: Record<string, Record<number, number>> = {
  fuerza: { 15: 1, 30: 2, 45: 3, 60: 4 },
  hipertrofia: { 15: 1, 30: 3, 45: 5, 60: 7 },
  resistencia: { 15: 2, 30: 5, 45: 8, 60: 10 },
  general: { 15: 1, 30: 3, 45: 5, 60: 7 },
};

const REPS_BY_GOAL: Record<string, number> = {
  fuerza: 6,
  hipertrofia: 10,
  resistencia: 15,
  general: 10,
};

const ALL_MUSCLES = [
  "pecho", "espalda", "hombros", "biceps", "triceps",
  "piernas", "gluteos", "cuadriceps", "femoral", "pantorrillas", "abdomen",
] as const;

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps",
  piernas: "Piernas", gluteos: "Glúteos", cuadriceps: "Cuádriceps",
  femoral: "Femoral", pantorrillas: "Pantorrillas", abdomen: "Abdomen",
};

const COMPLEMENTS: Record<string, string[]> = {
  pecho: ["espalda"],
  espalda: ["pecho"],
  hombros: ["espalda"],
  biceps: ["triceps"],
  triceps: ["biceps"],
  piernas: ["pecho"],
  gluteos: ["cuadriceps"],
  cuadriceps: ["gluteos", "femoral"],
  femoral: ["cuadriceps"],
  pantorrillas: ["piernas"],
  abdomen: [],
};

const ALL_MUSCLES_FALLBACK = ["pecho", "espalda", "piernas", "hombros", "biceps", "triceps"];

const POPULAR_GROUPS = ["pecho", "espalda", "piernas", "hombros", "abdomen"];

function getSuggestedMuscles(lastMuscles: string[]): string[] {
  if (lastMuscles.length === 0) return [...ALL_MUSCLES_FALLBACK];

  const suggested = new Set<string>();

  for (const m of lastMuscles) {
    const comps = COMPLEMENTS[m];
    if (comps) comps.forEach((c) => suggested.add(c));
  }

  lastMuscles.forEach((m) => {
    if (m === "abdomen" || m === "pantorrillas") suggested.add(m);
  });

  if (suggested.size < 3) {
    for (const p of POPULAR_GROUPS) {
      if (!lastMuscles.includes(p)) suggested.add(p);
      if (suggested.size >= 4) break;
    }
  }

  return Array.from(suggested);
}

export function QuestionOnboarding({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"goal" | "time" | "muscles" | "loading">("goal");
  const [goal, setGoal] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badgeKey, setBadgeKey] = useState(0);

  const isHipertrofia = goal === "hipertrofia";
  const totalSteps = isHipertrofia ? 3 : 2;
  const stepIndex = step === "goal" ? 0 : step === "time" ? 1 : 2;

  const handleGoalNext = () => {
    if (!goal) return;
    setStep("time");
  };

  const handleTimeNext = async () => {
    if (!goal || !time) return;
    if (goal === "hipertrofia") {
      setStep("muscles");
    } else {
      await createWorkout();
    }
  };

  const toggleMuscle = (m: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
    setSuggested(null);
  };

  const handleSuggest = async () => {
    setBadgeKey(k => k + 1);
    try {
      const res = await fetch("/api/dashboard-stats");
      const data = await res.json();
      const lastMuscles: string[] = data.lastWorkoutMuscles ?? [];
      const suggestedMuscles = getSuggestedMuscles(lastMuscles);
      setSuggested(suggestedMuscles);
      setSelectedMuscles(suggestedMuscles);
    } catch {
      setSelectedMuscles([...ALL_MUSCLES_FALLBACK]);
      setSuggested([...ALL_MUSCLES_FALLBACK]);
    }
  };

  const createWorkout = async (customMuscles?: string[]) => {
    if (!goal || !time) return;
    setStep("loading");
    setError(null);

    const totalExercises = EXERCISES_PER_TIME[goal][time] ?? EXERCISES_PER_TIME[goal][30];

    try {
      let musclesToUse: string[];

      if (goal === "hipertrofia" && customMuscles) {
        musclesToUse = customMuscles;
      } else {
        musclesToUse = ALL_MUSCLES_FALLBACK;
      }

      if (musclesToUse.length === 0) {
        musclesToUse = [...ALL_MUSCLES_FALLBACK];
      }

      const newDefs = await selectExercises({
        goal,
        muscles: musclesToUse,
        totalExercises,
      });

      if (newDefs.length === 0) {
        setError("No se encontraron ejercicios. Probá de nuevo.");
        setStep(goal === "hipertrofia" ? "muscles" : "time");
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
              reps: REPS_BY_GOAL[goal ?? "general"] ?? 10,
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
        setStep(goal === "hipertrofia" ? "muscles" : "time");
      }
    } catch (e) {
      console.error("Onboarding error:", e);
      setError("Error de conexión. Intentá de nuevo.");
      setStep(goal === "hipertrofia" ? "muscles" : "time");
    }
  };

  if (step === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-white font-medium">Analizando tu perfil y seleccionando ejercicios...</p>
          <p className="text-sm text-muted-foreground mt-1">Nuestro algoritmo elige los ejercicios óptimos para tu objetivo</p>
          <div className="inline-flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
            <Zap className="w-3 h-3" /> Motor inteligente activo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-card border border rounded-2xl p-6 animate-[fade-in-up_0.3s_ease-out] mx-4 mb-4 sm:mb-0">
        <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto mb-4" />

        {step === "goal" && (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-6 bg-accent" : "w-2 bg-zinc-600"
                }`} />
              ))}
            </div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                ¿Cuál es tu objetivo?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Así nuestro motor inteligente arma tu rutina ideal
              </p>
              <div key={badgeKey} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-medium mt-2 animate-badge-think">
                <span className="animate-zap-think"><Zap className="w-2.5 h-2.5" /></span> Motor inteligente
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {GOALS.map((g) => {
                const Icon = g.icon;
                const selected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setGoal(g.id); setBadgeKey(k => k + 1); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selected ? "bg-accent/20" : "bg-zinc-800"
                    }`}>
                      <Icon className={`w-5 h-5 ${selected ? g.color : "text-icon"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{g.label}</div>
                      <div className="text-[11px] text-muted-foreground">{g.desc}</div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleGoalNext}
              disabled={!goal}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold rounded-xl cursor-pointer transition-all"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              SIGUIENTE <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>

            <button
              onClick={onClose}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-white cursor-pointer py-2"
            >
              Prefiero elegir yo mismo
            </button>
          </>
        )}

        {step === "time" && (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-6 bg-accent" : "w-2 bg-zinc-600"
                }`} />
              ))}
            </div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                <Timer className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                ¿Cuánto tiempo tenés?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Según el tiempo, calculamos los ejercicios exactos para vos
              </p>
              <div key={badgeKey} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-medium mt-2 animate-badge-think">
                <span className="animate-zap-think"><Zap className="w-2.5 h-2.5" /></span> Motor inteligente
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TIME_OPTIONS.map((t) => {
                const selected = time === t;
                const est = goal ? EXERCISES_PER_TIME[goal]?.[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => { setTime(t); setBadgeKey(k => k + 1); }}
                    className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <span className={`text-3xl font-bold ${selected ? "text-accent" : "text-white"}`}
                      style={{ fontFamily: "var(--font-oswald)" }}>
                      {t}
                    </span>
                    <span className="text-xs text-muted-foreground">minutos</span>
                    {est != null && (
                      <span className="text-[10px] text-accent font-medium leading-tight">
                        ~{est} ejercicios
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleTimeNext}
              disabled={!time}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold rounded-xl cursor-pointer transition-all"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {goal === "hipertrofia" ? (
                <><ArrowLeft className="w-4 h-4 rotate-180" /> CONTINUAR</>
              ) : (
                <><Zap className="w-4 h-4" /> CREAR RUTINA</>
              )}
            </button>

            <button
              onClick={() => { setStep("goal"); setError(null); }}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-white cursor-pointer py-2"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Cambiar objetivo
            </button>
          </>
        )}

        {step === "muscles" && (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-6 bg-accent" : "w-2 bg-zinc-600"
                }`} />
              ))}
            </div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                ¿Qué músculos trabajar hoy?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                El motor inteligente elegirá los mejores ejercicios de cada grupo
              </p>
              <div key={badgeKey} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-medium mt-2 animate-badge-think">
                <span className="animate-zap-think"><Zap className="w-2.5 h-2.5" /></span> Motor inteligente
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {ALL_MUSCLES.map((m) => {
                const isSelected = selectedMuscles.includes(m);
                const isSuggested = suggested?.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => { toggleMuscle(m); setBadgeKey(k => k + 1); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? "border-accent bg-accent/15 text-accent"
                        : isSuggested
                        ? "border-accent/40 bg-accent/5 text-white"
                        : "border hover:border-accent/50 bg-card text-muted-foreground"
                    }`}
                  >
                    {MUSCLE_LABELS[m]}
                    {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => selectedMuscles.length > 0 && createWorkout(selectedMuscles)}
                disabled={selectedMuscles.length === 0}
                className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold rounded-xl cursor-pointer transition-all active:scale-[0.97]"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <Zap className="w-4 h-4" /> CREAR RUTINA
              </button>

              <button
                onClick={handleSuggest}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-accent/40 text-accent hover:bg-accent/10 rounded-xl cursor-pointer transition-all text-sm font-medium active:scale-[0.97]"
              >
                <Sparkles className="w-4 h-4" /> No sé, sugerime
              </button>
              {suggested && (
                <p className="text-[11px] text-icon text-center">Basado en tu último entrenamiento</p>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center mb-3">{error}</p>
            )}

            <button
              onClick={() => { setStep("time"); setError(null); }}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-white cursor-pointer py-2"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Cambiar tiempo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

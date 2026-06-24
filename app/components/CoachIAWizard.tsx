"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Zap, Heart, Target, Check, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { selectExercises } from "@/lib/workout/exercise-planner";
import { CoachAvatar } from "@/app/components/CoachAvatar";
import { TypewriterText } from "@/app/components/TypewriterText";
import { StreamLoader, LOADING_STREAMS } from "@/app/components/StreamLoader";

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
  fuerza: 6, hipertrofia: 10, resistencia: 15, general: 10,
};

const ACKNOWLEDGEMENTS: Record<string, string[]> = {
  fuerza: ["¡Fuerza bruta! 💪", "A cargar peso!", "Clásico y efectivo"],
  hipertrofia: ["A crecer! 💪", "Volumen total!", "Hipertrofia al máximo"],
  resistencia: ["Resistencia total!", "A sudar!", "Gasolina infinita"],
  general: ["Balance perfecto!", "A darle!", "Rutina completa"],
};

interface CoachIAWizardProps {
  selectedMuscles: string[];
  onClose: () => void;
}

export function CoachIAWizard({ selectedMuscles, onClose }: CoachIAWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"goal" | "time" | "ack" | "loading">("goal");
  const [goal, setGoal] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [coachPulse, setCoachPulse] = useState(false);
  const [ackText, setAckText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [loadingStalled, setLoadingStalled] = useState(false);
  const animationDoneRef = useRef(false);
  const pendingNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (step !== "loading") {
      setLoadingStalled(false);
      animationDoneRef.current = false;
      pendingNavigationRef.current = null;
      return;
    }
    const timer = setTimeout(() => setLoadingStalled(true), 12000);
    return () => clearTimeout(timer);
  }, [step]);

  const triggerCoachPulse = useCallback(() => {
    setCoachPulse(true);
    setTimeout(() => setCoachPulse(false), 1200);
  }, []);

  const acknowledge = useCallback(async (goalId: string, text: string) => {
    setThinking(true);
    triggerCoachPulse();
    await new Promise((r) => setTimeout(r, 500));
    setAckText(text);
    setStep("ack");
    await new Promise((r) => setTimeout(r, 900));
    setAckText("");
    setThinking(false);
  }, [triggerCoachPulse]);

  const transitionTo = useCallback((next: "goal" | "time" | "loading") => {
    setSlideKey((k) => k + 1);
    setTypewriterDone(false);
    setStep(next);
  }, []);

  const handleGoalSelect = async (g: typeof GOALS[number]) => {
    if (thinking) return;
    setGoal(g.id);
    const acks = ACKNOWLEDGEMENTS[g.id] ?? ["¡Perfecto!"];
    await acknowledge(g.id, acks[Math.floor(Math.random() * acks.length)]);
    transitionTo("time");
  };

  const handleTimeSelect = async (t: number) => {
    if (thinking) return;
    setTime(t);
    setThinking(true);
    triggerCoachPulse();
    await new Promise((r) => setTimeout(r, 600));
    setThinking(false);
    createWorkout(t);
  };

  const createWorkout = async (selectedTime: number) => {
    const effectiveGoal = goal;
    if (!effectiveGoal || !selectedTime) return;
    setStep("loading");
    setError(null);

    const totalExercises = EXERCISES_PER_TIME[effectiveGoal]?.[selectedTime] ?? EXERCISES_PER_TIME[effectiveGoal][30];

    try {
      const newDefs = await selectExercises({
        goal: effectiveGoal,
        muscles: selectedMuscles,
        totalExercises,
      });

      if (newDefs.length === 0) {
        setError("No se encontraron ejercicios. Prueba de nuevo.");
        setStep("goal");
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
              reps: d.recommendedReps ?? REPS_BY_GOAL[effectiveGoal] ?? 10,
              peso: 0,
            })),
          })),
        }),
      });
      const workout = await res.json();
      if (workout?.id) {
        if (animationDoneRef.current) {
          router.push(`/workout/${workout.id}`);
        } else {
          pendingNavigationRef.current = `/workout/${workout.id}`;
        }
      } else {
        setError("Error al crear el entrenamiento.");
        setStep("goal");
      }
    } catch (e) {
      console.error("CoachIA creation error:", e);
      setError("Error de conexión. Intenta de nuevo.");
      setStep("goal");
    }
  };

  if (step === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10 w-full max-w-sm mx-auto px-6">
          <CoachAvatar thinking={true} pulse={false} />
          <h2 className="text-center text-lg font-bold mb-6" style={{ fontFamily: "var(--font-oswald)" }}>
            Tu entrenador IA está trabajando
          </h2>
          <div className="bg-card border border-accent/20 rounded-xl p-5">
            <StreamLoader
              steps={LOADING_STREAMS[goal ?? "general"] ?? LOADING_STREAMS.general}
              onComplete={() => {
                animationDoneRef.current = true;
                const url = pendingNavigationRef.current;
                if (url) {
                  router.push(url);
                } else {
                  setTimeout(() => setLoadingStalled(true), 2000);
                }
              }}
            />
          </div>
          {loadingStalled && (
            <button
              onClick={() => { onClose(); }}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-white cursor-pointer py-2 text-center"
            >
              ¿Tarda mucho? Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "ack") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="text-center">
          <CoachAvatar thinking={false} pulse={true} />
          <p className="text-accent text-lg font-medium animate-fade-in">{ackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      <div
        key={slideKey}
        className="relative w-full max-w-sm bg-card border border-accent/10 rounded-2xl shadow-2xl shadow-accent/5 animate-step-slide-in mx-4 mb-4 sm:mb-0 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {[0, 1].map((i) => {
              const idx = step === "goal" ? 0 : 1;
              return (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                  i === idx ? "w-7 bg-accent" : i < idx ? "w-2 bg-accent/40" : "w-2 bg-zinc-700"
                }`} />
              );
            })}
          </div>

          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground">
              {selectedMuscles.length} grupo(s) muscular(es) seleccionado(s)
            </p>
          </div>

          <CoachAvatar thinking={thinking} pulse={coachPulse} />

          {step === "goal" && (
            <div className="animate-fade-in">
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                  <TypewriterText
                    text="¿Cuál es tu objetivo?"
                    speed={30}
                    onComplete={() => setTypewriterDone(true)}
                  />
                </p>
                <p className={`text-xs text-muted-foreground mt-1 transition-opacity duration-300 ${typewriterDone ? "opacity-100" : "opacity-0"}`}>
                  Así personalizo tu rutina al máximo
                </p>
              </div>

              <div className={`space-y-2 mb-4 transition-all duration-300 ${typewriterDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const selected = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleGoalSelect(g)}
                      disabled={thinking}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left active:scale-[0.98] ${
                        selected
                          ? "border-accent bg-accent/10"
                          : "border-zinc-800 hover:border-accent/50 bg-card"
                      } ${thinking ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selected ? "bg-accent/20" : "bg-zinc-800"
                      }`}>
                        <Icon className={`w-5 h-5 ${selected ? g.color : "text-icon"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{ fontFamily: "var(--font-oswald)" }}>{g.label}</div>
                        <div className="text-[11px] text-muted-foreground">{g.desc}</div>
                      </div>
                      {selected && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 animate-bounce-check">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "time" && (
            <div className="animate-fade-in">
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                  <TypewriterText
                    text="¿Cuánto tiempo tienes para entrenar?"
                    speed={30}
                    onComplete={() => setTypewriterDone(true)}
                  />
                </p>
                <p className={`text-xs text-muted-foreground mt-1 transition-opacity duration-300 ${typewriterDone ? "opacity-100" : "opacity-0"}`}>
                  Así calculo los ejercicios exactos
                </p>
              </div>

              <div className={`grid grid-cols-2 gap-3 mb-5 transition-all duration-300 ${typewriterDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                {TIME_OPTIONS.map((t) => {
                  const selected = time === t;
                  const est = goal ? EXERCISES_PER_TIME[goal]?.[t] : null;
                  return (
                    <button
                      key={t}
                      onClick={() => handleTimeSelect(t)}
                      disabled={thinking}
                      className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.96] ${
                        selected
                          ? "border-accent bg-accent/10"
                          : "border-zinc-800 hover:border-accent/50 bg-card"
                      } ${thinking ? "opacity-50 cursor-not-allowed" : ""}`}
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
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs text-center mt-3 mb-2">{error}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            {step === "time" && (
              <button
                onClick={() => { setStep("goal"); setTypewriterDone(false); setSlideKey(k => k + 1); setError(null); setAckText(""); }}
                className="text-xs text-muted-foreground hover:text-white cursor-pointer py-1 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Objetivo
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-white cursor-pointer py-1 ml-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

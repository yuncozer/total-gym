"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Zap, Heart, Target, Check, ArrowLeft, Sparkles, Loader2, Brain } from "lucide-react";
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
  fuerza: 6, hipertrofia: 10, resistencia: 15, general: 10,
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
  pecho: ["espalda"], espalda: ["pecho"], hombros: ["espalda"],
  biceps: ["triceps"], triceps: ["biceps"], piernas: ["pecho"],
  gluteos: ["cuadriceps"], cuadriceps: ["gluteos", "femoral"],
  femoral: ["cuadriceps"], pantorrillas: ["piernas"], abdomen: [],
};

const ALL_MUSCLES_FALLBACK = ["pecho", "espalda", "piernas", "hombros", "biceps", "triceps"];
const POPULAR_GROUPS = ["pecho", "espalda", "piernas", "hombros", "abdomen"];

const ACKNOWLEDGEMENTS: Record<string, string[]> = {
  fuerza: ["¡Fuerza bruta! 💪", "A cargar peso!", "Clásico y efectivo"],
  hipertrofia: ["A crecer! 💪", "Volumen total!", "Hipertrofia al máximo"],
  resistencia: ["Resistencia total!", "A sudar!", "Gasolina infinita"],
  general: ["Balance perfecto!", "A darle!", "Rutina completa"],
};

const LOADING_STREAMS: Record<string, string[]> = {
  fuerza: [
    "Analizando tu perfil de fuerza...",
    "Priorizando ejercicios compuestos...",
    "Seleccionando los pesos óptimos...",
    "Ajustando series de baja repetición...",
    "¡Rutina de fuerza lista!",
  ],
  hipertrofia: [
    "Analizando tu perfil...",
    "Balanceando compuestos y aislamientos...",
    "Calculando volumen por grupo muscular...",
    "Optimizando series y repeticiones...",
    "¡Rutina de hipertrofia lista!",
  ],
  resistencia: [
    "Analizando tu perfil de resistencia...",
    "Seleccionando ejercicios de alto volumen...",
    "Ajustando densidad del entrenamiento...",
    "Calculando tiempos de descanso óptimos...",
    "¡Rutina de resistencia lista!",
  ],
  general: [
    "Analizando tu perfil...",
    "Seleccionando los mejores ejercicios...",
    "Balanceando intensidad y volumen...",
    "Optimizando para tu tiempo disponible...",
    "¡Rutina lista!",
  ],
};

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

function CoachAvatar({ thinking, pulse }: { thinking: boolean; pulse: boolean }) {
  return (
    <div className="flex justify-center mb-5">
      <div className={`w-20 h-20 relative`}>
        <div className={`absolute inset-0 rounded-full border border-accent/20 ${thinking ? "animate-coach-think" : pulse ? "animate-coach-pulse" : "animate-coach-idle"}`} />
        <div className={`absolute inset-2 rounded-full border border-accent/10 ${thinking ? "animate-coach-think-delayed" : pulse ? "animate-coach-pulse-delayed" : ""}`} />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center backdrop-blur-sm">
          {thinking ? (
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          ) : (
            <Brain className="w-6 h-6 text-accent" />
          )}
        </div>
      </div>
    </div>
  );
}

function TypewriterText({ text, speed = 25, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const idxRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idxRef.current++;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}</span>;
}

function StreamLoader({ steps, onComplete }: { steps: string[]; onComplete: () => void }) {
  const [visible, setVisible] = useState<number[]>([]);
  const [activeDots, setActiveDots] = useState("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    const showNext = async (idx: number) => {
      if (cancelled) return;
      setVisible((prev) => [...prev, idx]);
      if (idx < steps.length - 1) {
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 400));
        showNext(idx + 1);
      } else {
        setTimeout(() => { if (!cancelled) onCompleteRef.current(); }, 600);
      }
    };
    showNext(0);

    const dotInterval = setInterval(() => {
      setActiveDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      cancelled = true;
      clearInterval(dotInterval);
    };
  }, [steps]);

  return (
    <div className="text-left space-y-2.5 min-h-[140px]">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 transition-all duration-500 ${
            visible.includes(i)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
            i === steps.length - 1 ? "bg-green-500" : "bg-accent"
          }`} />
          <p className={`text-sm ${
            i === steps.length - 1
              ? "text-green-400 font-medium"
              : i === visible[visible.length - 1]
              ? "text-accent"
              : "text-muted-foreground"
          }`}>
            {step}
            {i === visible[visible.length - 1] && i < steps.length - 1 && (
              <span className="inline-flex w-4 ml-0.5">{activeDots}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SmartCoach({
  onClose,
  userName,
}: {
  onClose: () => void;
  userName?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"goal" | "time" | "muscles" | "ack" | "loading">("goal");
  const [goal, setGoal] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [coachPulse, setCoachPulse] = useState(false);
  const [ackText, setAckText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [suggestLoading, setSuggestLoading] = useState(false);
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

  const transitionTo = useCallback((next: "goal" | "time" | "muscles" | "loading") => {
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
    transitionTo("muscles");
  };

  const toggleMuscle = (m: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
    setSuggested(null);
    triggerCoachPulse();
  };

  const handleSuggest = async () => {
    if (suggestLoading) return;
    setSuggestLoading(true);
    triggerCoachPulse();
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
    } finally {
      setSuggestLoading(false);
    }
  };

  const createWorkout = async (customMuscles?: string[]) => {
    const effectiveGoal = goal;
    const effectiveTime = time;
    if (!effectiveGoal || !effectiveTime) return;
    setStep("loading");
    setError(null);

    const totalExercises = EXERCISES_PER_TIME[effectiveGoal][effectiveTime] ?? EXERCISES_PER_TIME[effectiveGoal][30];

    try {
      const musclesToUse = (customMuscles && customMuscles.length > 0)
        ? customMuscles
        : [...ALL_MUSCLES_FALLBACK];

      const newDefs = await selectExercises({
        goal: effectiveGoal,
        muscles: musclesToUse,
        totalExercises,
      });

      if (newDefs.length === 0) {
        setError("No se encontraron ejercicios. Prueba de nuevo.");
        setStep("muscles");
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
        setStep("muscles");
      }
    } catch (e) {
      console.error("SmartCoach error:", e);
      setError("Error de conexión. Intenta de nuevo.");
      setStep("muscles");
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
              onClick={() => { setStep("muscles"); setError(null); }}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-white cursor-pointer py-2 text-center"
            >
              ¿Tarda mucho? Cancelar y volver
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
            {[0, 1, 2].map((i) => {
              const idx = step === "goal" ? 0 : step === "time" ? 1 : 2;
              return (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                  i === idx ? "w-7 bg-accent" : i < idx ? "w-2 bg-accent/40" : "w-2 bg-zinc-700"
                }`} />
              );
            })}
          </div>

          <CoachAvatar thinking={thinking} pulse={coachPulse} />

          {step === "goal" && (
            <div className="animate-fade-in">
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                  <TypewriterText
                    text={userName ? `${userName}, ¿cuál es tu objetivo?` : "¿Cuál es tu objetivo principal?"}
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

          {step === "muscles" && (
            <div className="animate-fade-in">
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                  <TypewriterText
                    text="¿Qué músculos quieres trabajar hoy?"
                    speed={30}
                    onComplete={() => setTypewriterDone(true)}
                  />
                </p>
                <p className={`text-xs text-muted-foreground mt-1 transition-opacity duration-300 ${typewriterDone ? "opacity-100" : "opacity-0"}`}>
                  Elige uno o varios grupos musculares
                </p>
              </div>

              <div className={`flex flex-wrap gap-2 mb-4 justify-center transition-all duration-300 ${typewriterDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                {ALL_MUSCLES.map((m) => {
                  const isSelected = selectedMuscles.includes(m);
                  const isSuggested = suggested?.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMuscle(m)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer active:scale-[0.96] ${
                        isSelected
                          ? "border-accent bg-accent/15 text-accent"
                          : isSuggested
                          ? "border-accent/40 bg-accent/5 text-white"
                          : "border-zinc-800 hover:border-accent/50 bg-card text-muted-foreground"
                      }`}
                    >
                      {MUSCLE_LABELS[m]}
                      {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => selectedMuscles.length > 0 && createWorkout(selectedMuscles)}
                  disabled={selectedMuscles.length === 0}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-zinc-600 font-bold rounded-xl cursor-pointer transition-all active:scale-[0.97]"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Zap className="w-4 h-4" /> CREAR RUTINA
                </button>

                <button
                  onClick={handleSuggest}
                  disabled={suggestLoading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-accent/30 text-accent hover:bg-accent/10 rounded-xl cursor-pointer transition-all text-sm font-medium active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {suggestLoading ? (
                    <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )} No sé, sugiéreme
                </button>
                {suggested && (
                  <p className="text-[11px] text-icon text-center">Basado en tu último entrenamiento</p>
                )}
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
            {step === "muscles" && (
              <button
                onClick={() => { setStep("time"); setTypewriterDone(false); setSlideKey(k => k + 1); setError(null); }}
                className="text-xs text-muted-foreground hover:text-white cursor-pointer py-1 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Tiempo
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

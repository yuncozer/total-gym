"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Zap, Target, ArrowRight, Check } from "lucide-react";

const STEPS = [
  {
    icon: Dumbbell,
    title: "Bienvenido a TOTAL GYM",
    subtitle: "Tu centro de entrenamiento personal",
    description:
      "Creá rutinas de gym, registrá cada serie y peso, seguí tu progreso y rompé tus récords. Todo desde tu celular.",
    accent: "text-accent",
    bg: "from-accent/20 to-accent/5",
  },
  {
    icon: Zap,
    title: "Entrená en 3 pasos",
    subtitle: "Rápido y sin complicaciones",
    description:
      "1. Elegí el músculo a trabajar — 2. Seleccioná tus ejercicios — 3. ¡Empezá a entrenar!",
    accent: "text-accent-secondary",
    bg: "from-accent-secondary/20 to-accent-secondary/5",
  },
  {
    icon: Target,
    title: "¿Primera vez?",
    subtitle: "Empezá con el pie derecho",
    description:
      "Usá RUTINA SMART y nuestro motor inteligente elige los mejores ejercicios para vos según tu objetivo y tiempo disponible.",
    accent: "text-green-500",
    bg: "from-green-500/20 to-green-500/5",
  },
];

const COACH_KEY = "totalgym_coach_seen";

export function CoachMarks({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      localStorage.setItem(COACH_KEY, "true");
      setTimeout(onDone, 300);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    localStorage.setItem(COACH_KEY, "true");
    setTimeout(onDone, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative w-full max-w-sm mx-4 animate-[fade-in-up_0.4s_ease-out]">
        <div className={`rounded-2xl p-8 bg-gradient-to-b ${current.bg} border border relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card/80 border border flex items-center justify-center mx-auto mb-4">
              <Icon className={`w-8 h-8 ${current.accent}`} />
            </div>

            <h2
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {current.title}
            </h2>
            <p className={`text-sm font-medium mb-4 ${current.accent}`}>
              {current.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-8 bg-accent" : "w-2 bg-zinc-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl cursor-pointer transition-all active:scale-95"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {isLast ? (
            <><Check className="w-4 h-4" /> ¡A ENTRENAR!</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> SIGUIENTE</>
          )}
        </button>

        {!isLast && (
          <button
            onClick={handleSkip}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-white cursor-pointer py-2"
          >
            Saltar tutorial
          </button>
        )}
      </div>
    </div>
  );
}

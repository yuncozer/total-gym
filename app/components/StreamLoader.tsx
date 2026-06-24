"use client";

import { useEffect, useRef, useState } from "react";

export const LOADING_STREAMS: Record<string, string[]> = {
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

export function StreamLoader({ steps, onComplete }: { steps: string[]; onComplete: () => void }) {
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

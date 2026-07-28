"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, Share2, X } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";

interface PRCelebrationProps {
  exerciseName: string;
  weight: number;
  reps: number;
  onClose: () => void;
  onShare?: () => void;
}

export function PRCelebration({ exerciseName, weight, reps, onClose, onShare }: PRCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const handleClose = useCallback(() => {
    setVisible(false);
    setShowConfetti(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (onShare) onShare();
    try {
      const text = `🔥 NUEVO RÉCORD PERSONAL en TOTAL GYM\n\n${exerciseName}: ${weight}kg x ${reps} reps\n\n¡Bajá la app y rompe tus límites! 🔥\nhttps://totalgym.life`;
      if (navigator.share) {
        await navigator.share({ title: "Nuevo Récord Personal 🔥", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
    }
  }, [exerciseName, weight, reps, onShare]);

  return (
    <>
      {showConfetti && <ConfettiCanvas />}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative bg-card border border-accent/40 rounded-2xl p-8 mx-4 max-w-sm w-full text-center animate-[fade-in-up_0.4s_ease-out]">
          <button onClick={handleClose} className="absolute top-3 right-3 text-icon hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>

          <div className="inline-block bg-accent/10 border border-accent/30 rounded-full px-4 py-1 mb-3">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest" style={{ fontFamily: "var(--font-oswald)" }}>
              Nuevo Récord Personal
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
            {exerciseName}
          </h2>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                {weight}
              </div>
              <div className="text-[10px] text-icon uppercase tracking-wider">KG</div>
            </div>
            <div className="text-2xl text-muted-foreground">×</div>
            <div className="text-center">
              <div className="text-3xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                {reps}
              </div>
              <div className="text-[10px] text-icon uppercase tracking-wider">REPS</div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl cursor-pointer transition-all active:scale-95"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <Share2 className="w-4 h-4" />
            COMPARTIR RÉCORD
          </button>

          <button
            onClick={handleClose}
            className="mt-3 text-xs text-muted-foreground hover:text-white cursor-pointer"
          >
            Seguir entrenando
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, Share2, X } from "lucide-react";

interface PRCelebrationProps {
  exerciseName: string;
  weight: number;
  reps: number;
  onClose: () => void;
  onShare?: () => void;
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    const colors = ["#eab308", "#f97316", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 200);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (frame < 200) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  );
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

"use client";

import { X, Dumbbell, Zap, Flame, Trophy, Target, Shield, Star, Crown, Swords } from "lucide-react";
import { useEffect, useRef } from "react";
import type { GamificationState } from "@/lib/gamification";
import { LEVEL_TITLES, xpForLevel } from "@/lib/gamification";

const LEVEL_ICONS: Record<number, typeof Dumbbell> = {
  1: Dumbbell,
  2: Zap,
  3: Flame,
  4: Target,
  5: Shield,
  6: Swords,
  7: Trophy,
  8: Star,
  9: Crown,
};

interface LevelModalProps {
  gamification: GamificationState;
  onClose: () => void;
}



export function LevelModal({ gamification, onClose }: LevelModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const currentLevel = gamification.level;
  const visibleLevels = [
    Math.max(1, currentLevel - 2),
    Math.max(1, currentLevel - 1),
    currentLevel,
    currentLevel + 1,
    currentLevel + 2,
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        ref={ref}
        className="relative w-full max-w-sm bg-card border border rounded-2xl p-6 animate-[fade-in-up_0.3s_ease-out] mx-4 mb-4 sm:mb-0"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-icon hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
              {gamification.level}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {LEVEL_TITLES[currentLevel] ?? "TOTAL GYM"}
          </h2>
          <p className="text-icon text-sm mt-1">
            {gamification.xp} XP total &middot; Nivel {currentLevel}
          </p>
        </div>

        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.round(gamification.progress * 100)}%`,
              background: "linear-gradient(90deg, #eab308, #f97316)",
            }}
          />
        </div>
        <p className="text-[11px] text-icon text-center mb-6">
          {gamification.xpForNextLevel - gamification.xp} XP para el siguiente nivel
        </p>

        <div className="space-y-1">
          {visibleLevels.map((lvl) => {
            const isCurrent = lvl === currentLevel;
            const isUnlocked = lvl <= currentLevel;
            const xpNeeded = xpForLevel(lvl);
            const Icon = LEVEL_ICONS[lvl] ?? Trophy;

            return (
              <div
                key={lvl}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  isCurrent ? "bg-accent/10 border border-accent/30" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isUnlocked ? "bg-accent/20" : "bg-zinc-800"
                }`}>
                  <Icon className={`w-4 h-4 ${isUnlocked ? "text-accent" : "text-zinc-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${
                    isUnlocked ? "text-white" : "text-zinc-600"
                  }`}>
                    {LEVEL_TITLES[lvl] ?? "TOTAL GYM"}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-medium ${
                    isCurrent ? "text-accent" : isUnlocked ? "text-green-500" : "text-zinc-600"
                  }`}>
                    {isCurrent ? "ACTUAL" : isUnlocked ? "✔" : `${xpNeeded} XP`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { getGamificationState } from "@/lib/gamification";
import { LevelModal } from "./LevelModal";

export function XPBar() {
  const [gamification, setGamification] = useState(() => getGamificationState(0));
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const fetchGamification = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification");
      if (!res.ok) return;
      const data = await res.json();
      const state = getGamificationState(data.xp ?? 0);
      if (state.level > prevLevel && prevLevel > 1) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      setPrevLevel(state.level);
      setGamification(state);
      setLoaded(true);
    } catch {
    }
  }, [prevLevel]);

  useEffect(() => {
    fetchGamification();
    const interval = setInterval(fetchGamification, 30000);
    return () => clearInterval(interval);
  }, [fetchGamification]);

  const width = `${Math.round(gamification.progress * 100)}%`;

  return (
    <>
      <button
        onClick={() => setShowLevelModal(true)}
        className="fixed bottom-16 left-4 right-4 z-40 mx-auto max-w-md"
      >
        <div className="relative bg-card/95 border border rounded-xl px-4 py-3 backdrop-blur-sm active:scale-[0.98] transition-transform cursor-pointer shadow-lg">
          {showLevelUp && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-fade-in-up">
              <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/30 whitespace-nowrap">
                ¡SUBISTE DE NIVEL!
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                {gamification.level}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {gamification.title}
                </span>
                <span className="text-[10px] text-icon tabular-nums ml-2 shrink-0">
                  {gamification.xp} / {gamification.xpForNextLevel} XP
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width,
                    background: "linear-gradient(90deg, #eab308, #f97316)",
                    boxShadow: "0 0 8px rgba(234,179,8,0.4)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
      {showLevelModal && (
        <LevelModal
          gamification={gamification}
          onClose={() => setShowLevelModal(false)}
        />
      )}
    </>
  );
}

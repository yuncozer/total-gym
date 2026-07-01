"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getGamificationState } from "@/lib/gamification";
import { useLanguage } from "@/lib/i18n";
import { LevelModal } from "./LevelModal";

const R = 32;
const C = 2 * Math.PI * R;

export function LevelFAB() {
  const { t } = useLanguage();
  const [gamification, setGamification] = useState(() => getGamificationState(0));
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const loadedRef = useRef(false);
  const prevLevelRef = useRef(1);

  const fetchGamification = useCallback(async () => {
    try {
      const res = await fetch("/api/gamification");
      if (!res.ok) return;
      const data = await res.json();
      const state = getGamificationState(data.xp ?? 0);
      if (loadedRef.current && state.level > prevLevelRef.current) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      loadedRef.current = true;
      prevLevelRef.current = state.level;
      setGamification(state);
    } catch {}
  }, []);

  useEffect(() => {
    fetchGamification();
    const interval = setInterval(fetchGamification, 30000);
    return () => clearInterval(interval);
  }, [fetchGamification]);

  const handleClick = () => {
    if (spinning || showLevelModal) return;
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setShowLevelModal(true);
    }, 1000);
  };

  const offset = C * (1 - gamification.progress);
  const width = `${Math.round(gamification.progress * 100)}%`;

  return (
    <>
      {showLevelUp && (
        <div className="fixed bottom-28 left-4 right-4 z-[9999] mx-auto max-w-sm animate-fade-in-up">
          <div className="bg-card/95 border border-accent/30 rounded-2xl p-5 backdrop-blur-sm shadow-2xl shadow-accent/20">
            <div className="text-center mb-3">
              <span className="inline-block text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/30">
                ¡SUBISTE DE NIVEL!
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                  {gamification.level}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {gamification.title}
                </p>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width,
                      background: "linear-gradient(90deg, #eab308, #f97316)",
                      boxShadow: "0 0 8px rgba(234,179,8,0.4)",
                    }}
                  />
                </div>
                <p className="text-[10px] text-icon mt-1 tabular-nums">
                  {gamification.xp} / {gamification.xpForNextLevel} XP
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        className={`fixed bottom-6 right-6 z-[9999] w-[72px] h-[72px] rounded-full
          transition-[opacity,transform] duration-300
          ${showLevelUp ? "opacity-0 scale-0 pointer-events-none" : "opacity-100 scale-100"}
          ${spinning ? "pointer-events-none" : ""}
          cursor-pointer`}
        style={spinning ? { animation: "level-spin 1s ease-in-out" } : undefined}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 72 72">
          <circle
            cx="36" cy="36" r={R}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <circle
            cx="36" cy="36" r={R}
            fill="none" stroke="#eab308"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-zinc-900 to-zinc-950 drop-shadow-2xl flex flex-col items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/15 to-transparent opacity-60" />
          <span className="relative z-10 text-[9px] font-semibold text-accent tracking-widest leading-none">
            {t("levelFAB.level")}
          </span>
          <span
            className="relative z-10 text-2xl font-black text-white -mt-0.5"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {gamification.level}
          </span>
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

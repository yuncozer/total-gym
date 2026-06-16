export interface GamificationState {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
  title: string;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Principiante",
  2: "Aprendiz",
  3: "Constante",
  4: "Dedicado",
  5: "Forjado",
  6: "Guerrero",
  7: "Titanio",
  8: "Élite",
  9: "Leyenda",
};

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getGamificationState(xp: number): GamificationState {
  const level = levelFromXp(xp);
  const xpForCurrent = xpForLevel(level);
  const xpForNext = xpForLevel(level + 1);
  const progress = xpForNext - xpForCurrent > 0
    ? Math.min((xp - xpForCurrent) / (xpForNext - xpForCurrent), 1)
    : 0;
  return {
    xp,
    level,
    xpForCurrentLevel: xpForCurrent,
    xpForNextLevel: xpForNext,
    progress,
    title: LEVEL_TITLES[level] ?? "TOTAL GYM",
  };
}

export const XP_PER_SET = 10;
export const XP_PER_WORKOUT = 25;

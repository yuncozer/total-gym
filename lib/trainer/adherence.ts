export type AdherenceStatus = "green" | "amber" | "red" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS);
}

export function getAdherenceStatus(lastWorkoutAt: string | null): AdherenceStatus {
  if (!lastWorkoutAt) return "unknown";
  const days = daysSince(lastWorkoutAt);
  if (days <= 3) return "green";
  if (days <= 7) return "amber";
  return "red";
}

const SEVERITY: Record<AdherenceStatus, number> = {
  red: 0,
  amber: 1,
  unknown: 2,
  green: 3,
};

export function adherenceSeverity(status: AdherenceStatus): number {
  return SEVERITY[status];
}

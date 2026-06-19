import type { NewExerciseDef } from "./service";
import { classifyExercise, type ExerciseRole } from "./exercise-classifier";

const EQUIPMENT_PRIORITY: Record<string, string[]> = {
  pecho: ["barbell", "dumbbell", "machine", "cable", "body weight"],
  espalda: ["barbell", "dumbbell", "machine", "cable", "body weight"],
  hombros: ["dumbbell", "barbell", "machine", "cable", "body weight"],
  piernas: ["barbell", "machine", "dumbbell", "body weight"],
  biceps: ["dumbbell", "barbell", "cable", "machine"],
  triceps: ["dumbbell", "cable", "barbell", "machine", "body weight"],
  gluteos: ["barbell", "dumbbell", "machine", "body weight"],
  abdomen: ["body weight", "machine", "cable"],
  cuadriceps: ["barbell", "machine", "body weight"],
  femoral: ["machine", "barbell", "body weight"],
  pantorrillas: ["machine", "body weight"],
};

export interface PlannerContext {
  goal: string;
  muscles: string[];
  totalExercises: number;
}

interface RawExercise {
  id: string;
  uuid?: string;
  name: string;
  equipmentCategory?: string;
  imageUrl?: string | null;
  variationGroup?: string | null;
  muscleGroup?: string;
}

interface PatternTarget {
  pattern: string;
  role: ExerciseRole;
  weight: number;
}

const GOAL_CONFIG: Record<string, { sets: Record<string, number>; reps: Record<string, number> }> = {
  fuerza: {
    sets: { compound: 4, isolation: 2, stabilization: 2 },
    reps: { compound: 6, isolation: 10, stabilization: 12 },
  },
  hipertrofia: {
    sets: { compound: 4, isolation: 3, stabilization: 3 },
    reps: { compound: 10, isolation: 14, stabilization: 12 },
  },
  resistencia: {
    sets: { compound: 3, isolation: 3, stabilization: 3 },
    reps: { compound: 14, isolation: 18, stabilization: 15 },
  },
  general: {
    sets: { compound: 3, isolation: 3, stabilization: 3 },
    reps: { compound: 10, isolation: 12, stabilization: 12 },
  },
};

const MUSCLE_PATTERNS: Record<string, PatternTarget[]> = {
  pecho: [
    { pattern: "press", role: "compound", weight: 0.50 },
    { pattern: "fly", role: "isolation", weight: 0.25 },
    { pattern: "dip", role: "compound", weight: 0.15 },
    { pattern: "pullover", role: "compound", weight: 0.10 },
  ],
  espalda: [
    { pattern: "vertical_pull", role: "compound", weight: 0.40 },
    { pattern: "horizontal_pull", role: "compound", weight: 0.35 },
    { pattern: "deadlift", role: "compound", weight: 0.15 },
    { pattern: "extension", role: "compound", weight: 0.10 },
  ],
  hombros: [
    { pattern: "overhead_press", role: "compound", weight: 0.35 },
    { pattern: "lateral_raise", role: "isolation", weight: 0.25 },
    { pattern: "rear_delt", role: "isolation", weight: 0.20 },
    { pattern: "front_raise", role: "isolation", weight: 0.10 },
    { pattern: "shrug", role: "isolation", weight: 0.10 },
  ],
  biceps: [
    { pattern: "curl", role: "isolation", weight: 0.60 },
    { pattern: "hammer_curl", role: "isolation", weight: 0.40 },
  ],
  triceps: [
    { pattern: "extension", role: "isolation", weight: 0.50 },
    { pattern: "dip", role: "compound", weight: 0.25 },
    { pattern: "close_grip_press", role: "compound", weight: 0.25 },
  ],
  piernas: [
    { pattern: "squat", role: "compound", weight: 0.30 },
    { pattern: "hinge", role: "compound", weight: 0.25 },
    { pattern: "lunge", role: "compound", weight: 0.15 },
    { pattern: "extension", role: "isolation", weight: 0.15 },
    { pattern: "curl", role: "isolation", weight: 0.15 },
  ],
  cuadriceps: [
    { pattern: "extension", role: "isolation", weight: 1.0 },
  ],
  femoral: [
    { pattern: "curl", role: "isolation", weight: 1.0 },
  ],
  gluteos: [
    { pattern: "hip_thrust", role: "compound", weight: 0.50 },
    { pattern: "abduction", role: "isolation", weight: 0.30 },
    { pattern: "kickback", role: "isolation", weight: 0.20 },
  ],
  pantorrillas: [
    { pattern: "calf_raise", role: "isolation", weight: 1.0 },
  ],
  abdomen: [
    { pattern: "crunch", role: "isolation", weight: 0.30 },
    { pattern: "plank", role: "stabilization", weight: 0.25 },
    { pattern: "leg_raise", role: "compound", weight: 0.25 },
    { pattern: "rotation", role: "isolation", weight: 0.20 },
  ],
};

function scoreByEquipment(cat: string, muscleGroup: string): number {
  const priority = EQUIPMENT_PRIORITY[muscleGroup];
  if (!priority) return 0;
  const idx = priority.indexOf(cat);
  return idx >= 0 ? (priority.length - idx) * 2 : 0;
}

function splitByPattern(total: number, targets: PatternTarget[]): (PatternTarget & { count: number })[] {
  if (total <= 0 || targets.length === 0) return [];
  if (targets.length === 1) return [{ ...targets[0], count: total }];

  const sorted = [...targets].sort((a, b) => b.weight - a.weight);
  const result = sorted.map((t) => ({ ...t, count: 0 }));

  for (let i = 0; i < total; i++) {
    let bestIdx = 0;
    let bestDeficit = -Infinity;
    for (let j = 0; j < result.length; j++) {
      const expected = (i + 1) * result[j].weight;
      const deficit = expected - result[j].count;
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestIdx = j;
      }
    }
    result[bestIdx].count++;
  }

  return result.filter((r) => r.count > 0);
}

function pickForPattern(
  exercises: RawExercise[],
  pattern: string,
  count: number,
  muscleGroup: string
): RawExercise[] {
  if (exercises.length === 0 || count === 0) return [];

  const classified = exercises.map((ex) => ({
    ex,
    profile: classifyExercise(ex.name, muscleGroup),
  }));

  let pool = classified.filter((c) => c.profile.pattern === pattern);

  if (pool.length < count) {
    const sameRole = classified.filter(
      (c) => c.profile.role === (pool[0]?.profile.role ?? "compound") && c.profile.pattern !== pattern
    );
    pool = [...pool, ...sameRole];
  }

  if (pool.length < count) {
    pool = classified;
  }

  const grouped = new Map<string, typeof pool>();
  for (const item of pool) {
    const key = item.ex.variationGroup || `unique-${item.ex.id}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const scored: { vg: string; best: RawExercise; score: number; equipCat: string }[] = [];
  for (const [vg, items] of grouped) {
    let best = items[0].ex;
    let bestScore = -Infinity;
    for (const item of items) {
      const equipCat = item.ex.equipmentCategory || "body weight";
      let score = scoreByEquipment(equipCat, muscleGroup);
      if (item.ex.imageUrl) score += 3;
      if (item.profile.pattern === pattern) score += 5;
      if (score > bestScore) {
        bestScore = score;
        best = item.ex;
      }
    }
    scored.push({ vg, best, score: bestScore, equipCat: best.equipmentCategory || "body weight" });
  }

  scored.sort((a, b) => b.score - a.score);

  const selected: typeof scored = [];
  const usedEquipment = new Set<string>();

  for (const item of scored) {
    if (selected.length >= count) break;
    if (!usedEquipment.has(item.equipCat)) {
      selected.push(item);
      usedEquipment.add(item.equipCat);
    }
  }

  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) selected.push(item);
    }
  }

  return selected.map((s) => s.best);
}

function distributeExercises(total: number, muscles: string[]): string[] {
  if (muscles.length === 0 || total === 0) return [];
  const result: string[] = [];
  const perMuscle = Math.max(1, Math.floor(total / muscles.length));
  let remaining = total;

  for (const m of muscles) {
    const take = Math.min(perMuscle, remaining);
    for (let i = 0; i < take; i++) result.push(m);
    remaining -= take;
  }

  let idx = 0;
  while (remaining > 0) {
    result.push(muscles[idx % muscles.length]);
    remaining--;
    idx++;
  }

  return result.slice(0, total);
}

function interleaveByMuscle(defs: NewExerciseDef[], distribution: string[]): NewExerciseDef[] {
  const byMuscle = new Map<string, NewExerciseDef[]>();
  for (const d of defs) {
    const mg = d.muscleGroup || "";
    if (!byMuscle.has(mg)) byMuscle.set(mg, []);
    byMuscle.get(mg)!.push(d);
  }

  const result: NewExerciseDef[] = [];
  const counters = new Map<string, number>();
  for (const m of distribution) {
    const list = byMuscle.get(m) || [];
    const idx = counters.get(m) || 0;
    if (idx < list.length) {
      result.push(list[idx]);
      counters.set(m, idx + 1);
    }
  }

  return result;
}

export async function selectExercises(ctx: PlannerContext): Promise<NewExerciseDef[]> {
  const config = GOAL_CONFIG[ctx.goal] ?? GOAL_CONFIG.general;
  const distribution = distributeExercises(ctx.totalExercises, ctx.muscles);
  const muscleCounts = new Map<string, number>();
  for (const m of distribution) {
    muscleCounts.set(m, (muscleCounts.get(m) || 0) + 1);
  }

  const allDefs: NewExerciseDef[] = [];

  for (const [muscleId, count] of muscleCounts) {
    const res = await fetch(`/api/exercises?muscleGroup=${muscleId}&limit=20&smart=true`);
    const json = await res.json();
    const exercises: RawExercise[] = json.data ?? [];

    const patterns = MUSCLE_PATTERNS[muscleId];
    if (!patterns || patterns.length === 0) {
      const withImage = exercises.filter((e) => e.imageUrl);
      const chosen = pickForPattern([...withImage, ...exercises], "", count, muscleId);
      for (const ex of chosen) {
        allDefs.push({
          exerciseId: ex.id?.toString() ?? ex.uuid ?? `custom-${muscleId}-${Date.now()}`,
          name: ex.name,
          setsCount: config.sets.isolation ?? 3,
          muscleGroup: muscleId,
          equipment: ex.equipmentCategory || "",
          imageUrl: ex.imageUrl || undefined,
          role: "compound",
          recommendedReps: config.reps.compound ?? 10,
        });
      }
      continue;
    }

    const split = splitByPattern(count, patterns);

    for (const target of split) {
      const chosen = pickForPattern(exercises, target.pattern, target.count, muscleId);
      const setsCount = config.sets[target.role] ?? 3;
      const reps = config.reps[target.role] ?? 10;

      for (const ex of chosen) {
        allDefs.push({
          exerciseId: ex.id?.toString() ?? ex.uuid ?? `custom-${muscleId}-${Date.now()}`,
          name: ex.name,
          setsCount,
          muscleGroup: muscleId,
          equipment: ex.equipmentCategory || "",
          imageUrl: ex.imageUrl || undefined,
          role: target.role,
          recommendedReps: reps,
        });
      }
    }
  }

  return orderExercises(allDefs, distribution);
}

function orderExercises(defs: NewExerciseDef[], distribution: string[]): NewExerciseDef[] {
  const roleOrder: Record<string, number> = { compound: 0, isolation: 1, stabilization: 2 };
  const compounds = defs.filter((d) => roleOrder[d.role ?? "isolation"] === 0);
  const nonCompounds = defs.filter((d) => roleOrder[d.role ?? "isolation"] > 0);

  return [
    ...interleaveByMuscle(compounds, distribution),
    ...interleaveByMuscle(nonCompounds, distribution),
  ];
}

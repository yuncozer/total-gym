import type { NewExerciseDef } from "./service";

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

function scoreByEquipment(cat: string, muscleGroup: string): number {
  const priority = EQUIPMENT_PRIORITY[muscleGroup];
  if (!priority) return 0;
  const idx = priority.indexOf(cat);
  return idx >= 0 ? (priority.length - idx) * 2 : 0;
}

function pickBestExercises(
  exercises: RawExercise[],
  count: number,
  muscleGroup: string
): RawExercise[] {
  if (exercises.length === 0 || count === 0) return [];

  const grouped = new Map<string, RawExercise[]>();
  for (const ex of exercises) {
    const key = ex.variationGroup || `unique-${ex.id}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ex);
  }

  const scoredPerGroup: { vg: string; best: RawExercise; score: number; equipCat: string }[] = [];
  for (const [vg, exs] of grouped) {
    let best = exs[0];
    let bestScore = -Infinity;
    for (const ex of exs) {
      const equipCat = ex.equipmentCategory || "body weight";
      let score = scoreByEquipment(equipCat, muscleGroup);
      if (ex.imageUrl) score += 3;
      if (score > bestScore) {
        bestScore = score;
        best = ex;
      }
    }
    scoredPerGroup.push({ vg, best, score: bestScore, equipCat: best.equipmentCategory || "body weight" });
  }

  scoredPerGroup.sort((a, b) => b.score - a.score);

  const selected: typeof scoredPerGroup = [];
  const usedEquipment = new Set<string>();

  for (const item of scoredPerGroup) {
    if (selected.length >= count) break;
    if (!usedEquipment.has(item.equipCat)) {
      selected.push(item);
      usedEquipment.add(item.equipCat);
    }
  }

  if (selected.length < count) {
    for (const item of scoredPerGroup) {
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

export async function selectExercises(ctx: PlannerContext): Promise<NewExerciseDef[]> {
  const distribution = distributeExercises(ctx.totalExercises, ctx.muscles);
  const muscleCounts = new Map<string, number>();
  for (const m of distribution) {
    muscleCounts.set(m, (muscleCounts.get(m) || 0) + 1);
  }

  const newDefs: NewExerciseDef[] = [];

  for (const [muscleId, count] of muscleCounts) {
    const res = await fetch(`/api/exercises?muscleGroup=${muscleId}&limit=15&smart=true`);
    const json = await res.json();
    const exercises: RawExercise[] = json.data ?? [];

    const withImage = exercises.filter((e) => e.imageUrl);
    const withoutImage = exercises.filter((e) => !e.imageUrl);

    const chosen = pickBestExercises([...withImage, ...withoutImage], count, muscleId);

    for (const ex of chosen) {
      newDefs.push({
        exerciseId: ex.id?.toString() ?? ex.uuid ?? `custom-${muscleId}-${Date.now()}`,
        name: ex.name,
        setsCount: 3,
        muscleGroup: muscleId,
        equipment: ex.equipmentCategory || "",
        imageUrl: ex.imageUrl || undefined,
      });
    }
  }

  return shuffleByMuscleOrder(newDefs, distribution);
}

function shuffleByMuscleOrder(
  defs: NewExerciseDef[],
  distribution: string[]
): NewExerciseDef[] {
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

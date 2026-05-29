export enum CardioGroup {
  A = "desplazamiento",
  B = "saltos",
  C = "implementos",
  D = "hiit",
  E = "excluir",
}

export type CardioExerciseEntry = {
  id: number;
  group: CardioGroup;
};

export const ALL_CARDIO_EXERCISE_IDS: CardioExerciseEntry[] = [
  // Group A - Desplazamiento (distance_km + duration_minutes)
  { id: 908, group: CardioGroup.A },   // Carrera en Zona 2 / Zone 2 Running
  { id: 177, group: CardioGroup.A },   // Ciclismo / Cycling
  { id: 319, group: CardioGroup.A },   // Jogging
  { id: 527, group: CardioGroup.A },   // Run
  { id: 529, group: CardioGroup.A },   // Run - Interval Training
  { id: 530, group: CardioGroup.A },   // Correr en cinta / Run - Treadmill
  { id: 624, group: CardioGroup.A },   // Stationary Bike
  { id: 1093, group: CardioGroup.A },  // Rowing Machine
  { id: 1104, group: CardioGroup.A },  // Walking
  { id: 1204, group: CardioGroup.A },  // Cycling cardio session
  { id: 1376, group: CardioGroup.A },  // Recumbent Bike
  { id: 1449, group: CardioGroup.A },  // Escaladora / ClimbMill
  { id: 1523, group: CardioGroup.A },  // Sled Push
  { id: 1548, group: CardioGroup.A },  // Stair Master
  { id: 1526, group: CardioGroup.A },  // Ski Machine
  { id: 1574, group: CardioGroup.A },  // Schwimmen
  { id: 1579, group: CardioGroup.A },  // Bronco
  { id: 1615, group: CardioGroup.A },  // Cardio en cinta / Treadmill Cardio
  { id: 1618, group: CardioGroup.A },  // Cardio en bicicleta estática
  { id: 961, group: CardioGroup.A },   // Piques de 50m en Natación / Swimming 50m sprints
  { id: 962, group: CardioGroup.A },   // La Elíptica / Elliptical

  // Group B - Saltos / Pliométricos (duration_minutes)
  { id: 1962, group: CardioGroup.B },  // Step Jack
  { id: 983, group: CardioGroup.B },   // Rodillas elevadas / High knees
  { id: 993, group: CardioGroup.B },   // Saltar la cuerda / Jump rope
  { id: 1314, group: CardioGroup.B },  // Jumping Jack HD
  { id: 1318, group: CardioGroup.B },  // Saltos Altos De Rodilla HD / High Knee Skips HD
  { id: 1373, group: CardioGroup.B },  // box jumps
  { id: 285, group: CardioGroup.B },   // Saltos al Pecho / High Knee Jumps
  { id: 595, group: CardioGroup.B },   // Skipping - Standard
  { id: 1584, group: CardioGroup.B },  // Marcha o trote en el lugar
  { id: 1285, group: CardioGroup.B },  // Talons fesses

  // Group C - Implementos (duration_minutes)
  { id: 1524, group: CardioGroup.C },  // Battle Ropes
  { id: 1525, group: CardioGroup.C },  // Ball Slams
  { id: 1092, group: CardioGroup.C },  // Bag training

  // Group D - HIIT / Mixto (duration_minutes + optional weight)
  { id: 1630, group: CardioGroup.D },  // Blaze
  { id: 1115, group: CardioGroup.D },  // 3D lunge warmup

  // Group E - Excluir (no son cardio real)
  { id: 927, group: CardioGroup.E },   // flexiones en TRX / Suspended crossess
  { id: 1592, group: CardioGroup.E },  // Meditación guiada o libre
  { id: 1940, group: CardioGroup.E },  // Diaphragmatic Breathing
];

const groupMap = new Map<number, CardioGroup>(
  ALL_CARDIO_EXERCISE_IDS.map(e => [e.id, e.group])
);

export function getCardioGroup(exerciseId: string): CardioGroup | null {
  return groupMap.get(Number(exerciseId)) ?? null;
}

export function isCardioExercise(exerciseId: string): boolean {
  const group = getCardioGroup(exerciseId);
  return group !== null && group !== CardioGroup.E;
}

export function isExcludedCardio(exerciseId: string): boolean {
  return getCardioGroup(exerciseId) === CardioGroup.E;
}

export function getDefaultCardioSets(exerciseId: string): number {
  const group = getCardioGroup(exerciseId);
  if (!group || group === CardioGroup.E) return 3;
  return 1;
}

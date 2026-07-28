export interface RoutineExercise {
  exerciseId: string;
  name: string;
  equipment: string;
  imageUrl?: string;
  muscleGroup?: string;
  isCardio?: boolean;
  setsCount: number;
  targetReps?: number;
  targetWeightKg?: number;
  targetRpe?: number;
  restSeconds?: number;
  note?: string;
}

export interface TrainerRoutine {
  id: string;
  trainerId: string;
  name: string;
  description: string | null;
  goal: string | null;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkoutSet {
  id?: string;
  workout_id?: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  is_bodyweight?: boolean;
  is_cardio?: boolean;
  distance_km?: number | null;
  duration_minutes?: number | null;
  description?: string;
  image_url?: string;
  is_completed: boolean;
  exercise_order?: number;
  muscle_group?: string;
  target_reps?: number | null;
  target_weight_kg?: number | null;
  target_rpe?: number | null;
  rest_seconds?: number | null;
  trainer_note?: string | null;
}

export interface ExerciseInWorkout {
  exerciseId: string;
  name: string;
  description?: string;
  equipment: string;
  imageUrl?: string;
  muscleGroup?: string;
  sets: WorkoutSet[];
}

export interface WorkoutProgress {
  completed: number;
  total: number;
}

export interface WorkoutSummary {
  id: string;
  date: string;
  name?: string | null;
  status: "pendiente" | "completed" | "cancelled";
  started_at: string | null;
  completed_at: string | null;
  exercises: ExerciseInWorkout[];
  photos?: WorkoutPhoto[];
}

export interface WorkoutPhoto {
  id: string;
  url: string;
  createdAt: string;
}

export interface TimerState {
  segundos: number;
  activo: boolean;
  descansando: boolean;
  timestampInicio?: number;
}

export interface TemplateExercise {
  exerciseId: string;
  name: string;
  equipment: string;
  sets: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
  updated_at: string;
}

export interface CustomExercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  image_url: string | null;
  created_at: string;
}
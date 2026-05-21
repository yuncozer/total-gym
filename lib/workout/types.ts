import type { SupabaseClient } from "@supabase/supabase-js";

export interface WorkoutSet {
  id?: string;
  workout_id?: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  is_completed: boolean;
}

export interface ExerciseInWorkout {
  exerciseId: string;
  name: string;
  equipment: string;
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
}

export interface TimerState {
  segundos: number;
  activo: boolean;
  descansando: boolean;
  timestampInicio?: number;
}
import type { ExerciseInWorkout, WorkoutSummary } from "./types";

async function fetchAPI(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  
  return response.json();
}

export async function createWorkout(
  userId: string,
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{ reps: number; peso: number }>;
  }>
): Promise<{ id: string }> {
  return fetchAPI("/api/workouts", {
    method: "POST",
    body: JSON.stringify({ userId, exercises }),
  });
}

export async function loadWorkout(workoutId: string): Promise<ExerciseInWorkout[]> {
  return fetchAPI(`/api/workouts/${workoutId}`);
}

export async function saveSets(workoutId: string, exercises: ExerciseInWorkout[]): Promise<void> {
  await fetchAPI(`/api/workouts/${workoutId}/sets`, {
    method: "PUT",
    body: JSON.stringify({ exercises }),
  });
}

export async function completeWorkout(workoutId: string): Promise<void> {
  await fetchAPI(`/api/workouts/${workoutId}/complete`, {
    method: "POST",
  });
}

export async function loadWorkoutHistory(): Promise<WorkoutSummary[]> {
  return fetchAPI("/api/workouts");
}

export async function loadWorkoutStats(): Promise<{
  weekWorkouts: number;
  monthWorkouts: number;
  totalVolume: number;
}> {
  return fetchAPI("/api/profile/stats");
}
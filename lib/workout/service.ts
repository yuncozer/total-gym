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
    imageUrl?: string;
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
    body: JSON.stringify({ completed_at: new Date().toISOString() }),
  });
}

export async function renameWorkout(workoutId: string, name: string): Promise<void> {
  await fetchAPI(`/api/workouts/${workoutId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  await fetchAPI(`/api/workouts/${workoutId}`, {
    method: "DELETE",
  });
}

export async function cancelWorkout(workoutId: string): Promise<void> {
  await fetchAPI(`/api/workouts/${workoutId}/cancel`, {
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

export interface DashboardStats {
  todayWorkout: boolean;
  streak: number;
  totalWorkouts: number;
  totalSets: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
    return { todayWorkout: false, streak: 0, totalWorkouts: 0, totalSets: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const completedWorkouts = await supabaseFetch(
    `${supabaseUrl}/rest/v1/workouts?user_id=eq.${userId}&status=eq.completed&select=id,date,completed_at`,
    supabaseKey
  );

  if (!completedWorkouts || completedWorkouts.length === 0) {
    return { todayWorkout: false, streak: 0, totalWorkouts: 0, totalSets: 0 };
  }

  const workoutDates = completedWorkouts
    .map((w: { date: string | null; completed_at: string | null }) => {
      if (w.date) return w.date;
      if (w.completed_at) {
        const d = new Date(w.completed_at);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      }
      return null;
    })
    .filter(Boolean) as string[];

  const todayWorkout = workoutDates.includes(todayStr);

  const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const checkDate = new Date(today);

  if (todayWorkout) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (uniqueDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  let totalSets = 0;
  const workoutIds: string[] = completedWorkouts.map((w: { id: string }) => w.id);

  if (workoutIds.length > 0) {
    const setsQuery = workoutIds.map(id => `workout_id=eq.${id}`).join(',');
    const allSets = await supabaseFetch(
      `${supabaseUrl}/rest/v1/workout_sets?or=(${setsQuery})&is_completed=eq.true&select=id`,
      supabaseKey
    );
    totalSets = allSets?.length || 0;
  }

  return { todayWorkout, streak, totalWorkouts: completedWorkouts.length, totalSets };
}

async function supabaseFetch(url: string, key: string) {
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function loadTemplates(): Promise<import("./types").WorkoutTemplate[]> {
  return fetchAPI("/api/templates");
}

export async function createTemplate(name: string, exercises: import("./types").TemplateExercise[]) {
  return fetchAPI("/api/templates", {
    method: "POST",
    body: JSON.stringify({ name, exercises }),
  });
}

export async function deleteTemplate(id: string) {
  await fetchAPI(`/api/templates/${id}`, { method: "DELETE" });
}

export async function loadCustomExercises(): Promise<import("./types").CustomExercise[]> {
  return fetchAPI("/api/custom-exercises");
}

export async function createCustomExercise(data: { name: string; muscle_group: string; equipment: string; image_url?: string }) {
  return fetchAPI("/api/custom-exercises", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomExercise(id: string) {
  await fetchAPI(`/api/custom-exercises/${id}`, { method: "DELETE" });
}

export async function loadExerciseProgress(exerciseId: string): Promise<{ date: string; maxWeight: number; maxReps: number; volume: number }[]> {
  return fetchAPI(`/api/exercises/progress?exercise_id=${encodeURIComponent(exerciseId)}`);
}

import type { ExerciseInWorkout, WorkoutProgress } from "./types";

export function getProgress(exercises: ExerciseInWorkout[]): WorkoutProgress {
  const completed = exercises.reduce(
    (acc, e) => acc + e.sets.filter(s => s.is_completed).length,
    0
  );
  const total = exercises.reduce((acc, e) => acc + e.sets.length, 0);
  return { completed, total };
}

export function getSetsCompletados(exercise: ExerciseInWorkout): number {
  return exercise.sets.filter(s => s.is_completed).length;
}

export function getTotalSets(exercise: ExerciseInWorkout): number {
  return exercise.sets.length;
}

export function isExerciseComplete(exercise: ExerciseInWorkout): boolean {
  return getSetsCompletados(exercise) === getTotalSets(exercise);
}

export function isWorkoutComplete(exercises: ExerciseInWorkout[]): boolean {
  const progress = getProgress(exercises);
  return progress.total > 0 && progress.completed === progress.total;
}

export function findFirstIncompleteSet(exercise: ExerciseInWorkout): number {
  const idx = exercise.sets.findIndex(s => !s.is_completed);
  return idx >= 0 ? idx : 0;
}

export function canAddExtraSet(exercise: ExerciseInWorkout, setIndex: number): boolean {
  const set = exercise.sets[setIndex];
  const isLastSet = setIndex === exercise.sets.length - 1;
  return isLastSet && set && set.reps > 0 && set.weight_kg > 0 && !set.is_completed;
}
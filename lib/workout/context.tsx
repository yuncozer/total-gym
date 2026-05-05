"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ExerciseInWorkout, WorkoutSet, TimerState } from "./types";
import * as progressFn from "./progress";
import * as service from "./service";

interface WorkoutContextValue {
  loading: boolean;
  saving: boolean;
  exercises: ExerciseInWorkout[];
  selectedExercise: ExerciseInWorkout | null;
  currentSetIndex: number;
  setCurrentSetIndex: React.Dispatch<React.SetStateAction<number>>;
  isWorkoutComplete: boolean;
  isExerciseComplete: boolean;
  isLastSet: boolean;
  showExtraSetButton: boolean;
  timer: TimerState;
  setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
  canCompleteSet: boolean;
  progress: { completed: number; total: number };
  progressPercentage: number;
  
  selectExercise: (exercise: ExerciseInWorkout) => void;
  deselectExercise: () => void;
  goToSet: (index: number) => void;
  updateSet: (field: "reps" | "weight_kg", value: number) => void;
  completeSet: () => Promise<void>;
  addExtraSet: () => Promise<void>;
  setAsLastSet: (value: boolean) => void;
  
  getSetsCompletados: (exercise: ExerciseInWorkout) => number;
  getTotalSets: (exercise: ExerciseInWorkout) => number;
  isExerciseCompleted: (exercise: ExerciseInWorkout) => boolean;
  
  playNotificationSound: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}

interface WorkoutProviderProps {
  children: React.ReactNode;
  workoutId: string;
}

export function WorkoutProvider({ children, workoutId }: WorkoutProviderProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState<ExerciseInWorkout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInWorkout | null>(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [isExerciseComplete, setIsExerciseComplete] = useState(false);
  const [isLastSet, setIsLastSet] = useState(false);
  const [showExtraSetButton, setShowExtraSetButton] = useState(false);
  
  const [timer, setTimer] = useState<TimerState>({
    segundos: 0,
    activo: false,
    descansando: false
  });

  useEffect(() => {
    async function load() {
      try {
        const loaded = await service.loadWorkout(workoutId);
        setExercises(loaded);
        
        const prog = progressFn.getProgress(loaded);
        if (prog.total > 0 && prog.completed === prog.total) {
          setIsWorkoutComplete(true);
          await service.completeWorkout(workoutId);
        }
      } catch (err) {
        console.error("Error loading workout:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId]);

  useEffect(() => {
    if (!selectedExercise || isExerciseComplete) {
      setShowExtraSetButton(false);
      return;
    }
    
    const canShow = progressFn.canAddExtraSet(selectedExercise, currentSetIndex);
    setShowExtraSetButton(canShow);
  }, [currentSetIndex, selectedExercise, isExerciseComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.activo && !timer.descansando) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev.segundos + 1;
          if (newTime > 0 && newTime % 30 === 0) {
            if (navigator.vibrate) navigator.vibrate(200);
          }
          return { ...prev, segundos: newTime };
        });
      }, 1000);
    } else if (timer.descansando) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, segundos: prev.segundos + 1 }));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [timer.activo, timer.descansando]);

  const saveSets = useCallback(async (exercisesToSave?: ExerciseInWorkout[]) => {
    const ejs = exercisesToSave || exercises;
    setSaving(true);
    try {
      await service.saveSets(workoutId, ejs);
    } catch (err) {
      console.error("Error saving sets:", err);
    } finally {
      setSaving(false);
    }
  }, [workoutId, exercises]);

  const selectExercise = useCallback((exercise: ExerciseInWorkout) => {
    setIsExerciseComplete(false);
    setTimer({ segundos: 0, activo: false, descansando: false });
    
    const idx = progressFn.findFirstIncompleteSet(exercise);
    setCurrentSetIndex(idx);
    setSelectedExercise(exercise);
    
    const set = exercise.sets[idx];
    setShowExtraSetButton(set && set.reps > 0 && set.weight_kg > 0 && !set.is_completed);
  }, []);

  const deselectExercise = useCallback(() => {
    const prog = progressFn.getProgress(exercises);
    if (prog.completed === prog.total && prog.total > 0) {
      setIsWorkoutComplete(true);
      service.completeWorkout(workoutId);
    }
    setSelectedExercise(null);
    setTimer({ segundos: 0, activo: false, descansando: false });
  }, [exercises, workoutId]);

  const goToSet = useCallback((index: number) => {
    setCurrentSetIndex(index);
  }, []);

  const updateSet = useCallback((field: "reps" | "weight_kg", value: number) => {
    if (!selectedExercise) return;
    
    setExercises(prev => prev.map(ej => {
      if (ej.exerciseId === selectedExercise.exerciseId) {
        const newSets = ej.sets.map((s, i) => 
          i === currentSetIndex ? { ...s, [field]: value } : s
        );
        return { ...ej, sets: newSets };
      }
      return ej;
    }));

    setSelectedExercise(prev => prev ? {
      ...prev,
      sets: prev.sets.map((s, i) => i === currentSetIndex ? { ...s, [field]: value } : s)
    } : null);
  }, [selectedExercise, currentSetIndex]);

  const completeSet = useCallback(async () => {
    if (!selectedExercise) return;
    
    const exerciseComplete = isLastSet || currentSetIndex === selectedExercise.sets.length - 1;
    
    const updatedExercises = [...exercises];
    const exerciseIdx = updatedExercises.findIndex(e => e.exerciseId === selectedExercise.exerciseId);
    
    if (exerciseIdx >= 0) {
      if (exerciseComplete) {
        const setsToKeep = updatedExercises[exerciseIdx].sets.slice(0, currentSetIndex + 1)
          .map(s => ({ ...s, is_completed: true }));
        updatedExercises[exerciseIdx] = { ...updatedExercises[exerciseIdx], sets: setsToKeep };
        setExercises(updatedExercises);
        setSelectedExercise(updatedExercises[exerciseIdx]);
        setIsExerciseComplete(true);
        setIsLastSet(false);
        await saveSets(updatedExercises);
        return;
      }

      updatedExercises[exerciseIdx] = {
        ...updatedExercises[exerciseIdx],
        sets: updatedExercises[exerciseIdx].sets.map((s, i) => 
          i === currentSetIndex ? { ...s, is_completed: true } : s
        )
      };
    }
    
    setExercises(updatedExercises);
    setSelectedExercise(updatedExercises[exerciseIdx]);
    setIsLastSet(false);
    await saveSets();
    
    const prog = progressFn.getProgress(updatedExercises);
    if (prog.completed === prog.total) {
      setIsWorkoutComplete(true);
      await service.completeWorkout(workoutId);
    } else {
      setTimer({ segundos: 0, activo: false, descansando: true });
    }
  }, [selectedExercise, currentSetIndex, isLastSet, exercises, saveSets, workoutId]);

  const addExtraSet = useCallback(async () => {
    if (!selectedExercise) return;
    const currentSet = selectedExercise.sets[currentSetIndex];
    if (currentSet.reps === 0 || currentSet.weight_kg === 0) return;

    const totalOriginal = selectedExercise.sets.length;
    const updatedExercises = [...exercises];
    const exerciseIdx = updatedExercises.findIndex(e => e.exerciseId === selectedExercise.exerciseId);
    
    if (exerciseIdx >= 0) {
      updatedExercises[exerciseIdx] = {
        ...updatedExercises[exerciseIdx],
        sets: [
          ...updatedExercises[exerciseIdx].sets.map((s, i) => 
            i === currentSetIndex ? { ...s, is_completed: true } : s
          ),
          {
            exercise_id: selectedExercise.exerciseId,
            exercise_name: selectedExercise.name,
            set_number: totalOriginal + 1,
            reps: 0,
            weight_kg: 0,
            is_completed: false
          } as WorkoutSet
        ]
      };
    }
    
    setExercises(updatedExercises);
    setSelectedExercise(updatedExercises[exerciseIdx]);
    setCurrentSetIndex(currentSetIndex + 1);
    setShowExtraSetButton(false);
    await saveSets(updatedExercises);
  }, [selectedExercise, currentSetIndex, exercises, saveSets]);

  const setAsLastSet = useCallback((value: boolean) => {
    setIsLastSet(value);
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  const value: WorkoutContextValue = {
    loading,
    saving,
    exercises,
    selectedExercise,
    currentSetIndex,
    setCurrentSetIndex,
    isWorkoutComplete,
    isExerciseComplete,
    isLastSet,
    showExtraSetButton,
    timer,
    setTimer,
    canCompleteSet: selectedExercise ? 
      selectedExercise.sets[currentSetIndex]?.reps > 0 && 
      selectedExercise.sets[currentSetIndex]?.weight_kg > 0 : false,
    progress: progressFn.getProgress(exercises),
    progressPercentage: exercises.length > 0 
      ? (progressFn.getProgress(exercises).completed / progressFn.getProgress(exercises).total) * 100 
      : 0,
    
    selectExercise,
    deselectExercise,
    goToSet,
    updateSet,
    completeSet,
    addExtraSet,
    setAsLastSet,
    
    getSetsCompletados: progressFn.getSetsCompletados,
    getTotalSets: progressFn.getTotalSets,
    isExerciseCompleted: progressFn.isExerciseComplete,
    
    playNotificationSound
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export { progressFn, service };
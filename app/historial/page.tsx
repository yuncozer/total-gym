"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Target, Loader2, Dumbbell, ChevronDown, ChevronUp, Scale, Filter, X } from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";
import { loadWorkoutHistory, type WorkoutSummary, type WorkoutSet, type ExerciseInWorkout } from "@/lib/workout";

type DateFilter = "all" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year";

export default function HistorialPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<DateFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const DATE_FILTERS: { id: DateFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "this_week", label: "Esta semana" },
    { id: "last_week", label: "Semana pasada" },
    { id: "this_month", label: "Este mes" },
    { id: "last_month", label: "Mes pasado" },
    { id: "this_year", label: "Este año" },
  ];

  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "all":
        return null;
      case "this_week": {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        return { start: startOfWeek, end: today };
      }
      case "last_week": {
        const dayOfWeek = today.getDay();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      case "this_month":
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: today
        };
      case "last_month":
        return {
          start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
          end: new Date(today.getFullYear(), today.getMonth(), 0)
        };
      case "this_year":
        return {
          start: new Date(today.getFullYear(), 0, 1),
          end: today
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const history = await loadWorkoutHistory();
        setWorkouts(history);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWorkouts();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    return dateStr;
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        });
      }
    } catch (e) {
      console.error("Error formatting short date:", e);
    }
    return dateStr;
  };

  const toggleWorkout = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const toggleExercise = (exerciseKey: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseKey)) {
      newExpanded.delete(exerciseKey);
    } else {
      newExpanded.add(exerciseKey);
    }
    setExpandedExercises(newExpanded);
  };

  const getGroupedSets = (exercises: ExerciseInWorkout[]) => {
    const groups: Record<string, WorkoutSet[]> = {};
    exercises.forEach((exercise) => {
      const key = exercise.name;
      if (!groups[key]) groups[key] = [];
      (exercise.sets || []).forEach((set) => {
        groups[key].push(set);
      });
    });
    return groups;
  };

  const groupWorkoutsByMonth = (workouts: WorkoutSummary[]) => {
    const groups: Record<string, WorkoutSummary[]> = {};
    workouts.forEach((workout) => {
      try {
        const date = new Date(workout.date);
        if (isNaN(date.getTime())) return;
        const key = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
        if (!groups[key]) groups[key] = [];
        groups[key].push(workout);
      } catch (e) {
        console.error("Error grouping workout:", e);
      }
    });
    return groups;
  };

  const getWorkoutStats = (workout: WorkoutSummary) => {
    const total = workout.exercises?.reduce((acc, e) => acc + (e.sets?.length || 0), 0) || 0;
    const completed = workout.exercises?.reduce((acc, e) => acc + (e.sets?.filter(s => s.is_completed).length || 0), 0) || 0;
    const uniqueExercises = workout.exercises?.length || 0;
    return { total, completed, uniqueExercises };
  };

  const isCompleted = (workout: WorkoutSummary) => workout.status === "completed";

  const filterWorkoutsByDate = (workouts: WorkoutSummary[]) => {
    const range = getDateRange(activeFilter);
    if (!range) return workouts;
    
    return workouts.filter((workout) => {
      try {
        const workoutDate = new Date(workout.date);
        if (isNaN(workoutDate.getTime())) return true;
        
        const endOfDay = new Date(range.end);
        endOfDay.setHours(23, 59, 59, 999);
        
        return workoutDate >= range.start && workoutDate <= endOfDay;
      } catch (e) {
        return true;
      }
    });
  };

  const clearFilters = () => {
    setActiveFilter("all");
  };

  const hasActiveFilters = activeFilter !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#eab308]" />
        </main>
      </div>
    );
  }

  const filteredWorkouts = filterWorkoutsByDate(workouts);
  const filteredGroupedWorkouts = groupWorkoutsByMonth(filteredWorkouts);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader showBack backHref="/" />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              MI <span className="text-[#eab308]">HISTORIAL</span>
            </h1>
            <p className="text-[#a1a1aa]">
              Tus workouts anteriores
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 w-full mb-4 py-3 rounded-xl border transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? "bg-[#eab308] border-[#eab308] text-black"
                : "bg-[#18181b] border-[#3f3f46] text-[#a1a1aa] hover:border-[#eab308]"
            }`}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters ? `Filtro: ${DATE_FILTERS.find(f => f.id === activeFilter)?.label}` : "Filtrar por fecha"}
          </button>

          {showFilters && (
            <div className="mb-6 p-4 bg-[#18181b] rounded-xl border border-[#3f3f46]">
              <div className="grid grid-cols-2 gap-2">
                {DATE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setShowFilters(false);
                    }}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      activeFilter === filter.id
                        ? "bg-[#eab308] text-black"
                        : "bg-[#0a0a0a] text-[#a1a1aa] hover:bg-[#27272a]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 w-full mt-4 py-3 border border-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtro
                </button>
              )}
            </div>
          )}

          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-[#71717a]" />
              </div>
              {hasActiveFilters ? (
                <>
                  <p className="text-[#a1a1aa] mb-4">No hay workouts en este período</p>
                  <button
                    onClick={clearFilters}
                    className="text-[#eab308] hover:text-[#ca9a04] font-bold cursor-pointer"
                  >
                    Ver todos
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[#a1a1aa] mb-4">No tienes workouts guardados</p>
                  <button
                    onClick={() => router.push("/entrenamiento")}
                    className="text-[#eab308] hover:text-[#ca9a04] font-bold cursor-pointer"
                  >
                    Crear tu primer entrenamiento
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredGroupedWorkouts).map(([month, monthWorkouts]) => (
                <div key={month}>
                  <h2 className="text-sm font-bold text-[#71717a] uppercase mb-3">
                    {month}
                  </h2>
                  <div className="space-y-3">
                    {monthWorkouts.map((workout) => {
                      const stats = getWorkoutStats(workout);
                      const completed = isCompleted(workout);
                      const isExpanded = expandedWorkouts.has(workout.id);
                      const groupedSets = getGroupedSets(workout.exercises || []);

                      return (
                        <div
                          key={workout.id}
                          className="w-full rounded-xl bg-[#18181b] border border-[#3f3f46] overflow-hidden"
                        >
                          <button
                            onClick={() => toggleWorkout(workout.id)}
                            className="w-full p-4 text-left hover:border-[#eab308] transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold">
                                {formatDate(workout.date)}
                              </span>
                              {completed ? (
                                <span className="flex items-center gap-1 text-sm text-[#22c55e]">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Completado
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-sm text-[#eab308]">
                                  <Clock className="w-4 h-4" />
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {stats.completed}/{stats.total} series
                              </span>
                              <span className="flex items-center gap-1">
                                <Dumbbell className="w-4 h-4" />
                                {stats.uniqueExercises} ejercicios
                              </span>
                              <span className="ml-auto">
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-[#71717a]" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-[#71717a]" />
                                )}
                              </span>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="border-t border-[#3f3f46] p-4 space-y-3">
                              {Object.entries(groupedSets).map(([exerciseName, sets]) => {
                                const exerciseKey = `${workout.id}-${exerciseName}`;
                                const exerciseExpanded = expandedExercises.has(exerciseKey);
                                const exerciseCompleted = sets.filter(s => s.is_completed).length;
                                
                                return (
                                  <div key={exerciseName} className="bg-[#0a0a0a] rounded-lg overflow-hidden">
                                    <button
                                      onClick={() => toggleExercise(exerciseKey)}
                                      className="w-full p-3 flex items-center justify-between text-left hover:bg-[#18181b] transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4 text-[#eab308]" />
                                        <span className="font-medium">{exerciseName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-[#71717a]">
                                          {exerciseCompleted}/{sets.length} series
                                        </span>
                                        {exerciseExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-[#71717a]" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-[#71717a]" />
                                        )}
                                      </div>
                                    </button>
                                    
                                    {exerciseExpanded && (
                                      <div className="border-t border-[#3f3f46] p-3 space-y-2">
                                        {sets.map((set) => (
                                          <div
                                            key={set.id}
                                            className={`flex items-center justify-between p-2 rounded ${
                                              set.is_completed ? "bg-[#22c55e]/10" : "bg-[#18181b]"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              {set.is_completed ? (
                                                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                                              ) : (
                                                <Clock className="w-4 h-4 text-[#71717a]" />
                                              )}
                                              <span className="text-sm text-[#a1a1aa]">
                                                Serie {set.set_number}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="text-sm font-medium">
                                                {set.reps} reps
                                              </span>
                                              <span className="flex items-center gap-1 text-sm text-[#eab308]">
                                                <Scale className="w-3 h-3" />
                                                {set.weight_kg} kg
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              
                              {workout.exercises?.length === 0 && (
                                <p className="text-center text-[#71717a] py-4">
                                  Sin ejercicios registrados
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Target, Loader2, Dumbbell, ChevronDown, ChevronUp, Scale, Filter, X, Flame, Calendar, Share2 } from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";
import { loadWorkoutHistory, type WorkoutSummary, type WorkoutSet, type ExerciseInWorkout } from "@/lib/workout";
import { useAuth } from "@/lib/useAuth";
import { WorkoutPhotoOverlay } from "@/app/components/WorkoutPhotoOverlay";
import { LoadingScreen } from "@/app/components/LoadingScreen";

type DateFilter = "all" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "specific_day";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const getCurrentWeekRange = (): { start: Date; end: Date } => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const calculateWeekActivity = (workouts: WorkoutSummary[]) => {
  const activity: number[] = new Array(7).fill(0);
  const { start } = getCurrentWeekRange();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    
    const count = workouts.filter(w => w.date === dateStr && w.status === "completed").length;
    activity[i] = count;
  }
  
  return activity;
};

const getTodayIndex = (): number => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const hasWorkoutsThisWeek = (workouts: WorkoutSummary[]): boolean => {
  const { start, end } = getCurrentWeekRange();
  return workouts.some(w => {
    try {
      const [year, month, day] = w.date.split("-").map(Number);
      const workoutDate = new Date(year, month - 1, day);
      return workoutDate >= start && workoutDate <= end && w.status === "completed";
    } catch {
      return false;
    }
  });
};

const getHeatmapColor = (count: number, max: number) => {
  if (count === 0) return "bg-[#18181b]";
  const intensity = max > 0 ? (count / max) : 0;
  if (intensity <= 0.25) return "bg-[#eab308]/30";
  if (intensity <= 0.5) return "bg-[#eab308]/50";
  if (intensity <= 0.75) return "bg-[#eab308]/70";
  return "bg-[#eab308]";
};

const formatDateShort = (date: Date) => {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

const WeekActivityChart = ({
  workouts,
  weeklyCount,
  selectedDay,
  onDayClick,
}: {
  workouts: WorkoutSummary[];
  weeklyCount: number;
  selectedDay: number | null;
  onDayClick: (dayIndex: number | null) => void;
}) => {
  const activity = calculateWeekActivity(workouts);
  const maxActivity = Math.max(...activity, 1);
  const { start } = getCurrentWeekRange();
  const todayIndex = getTodayIndex();

  const getDayWorkouts = (dayIndex: number): WorkoutSummary[] => {
    const date = new Date(start);
    date.setDate(start.getDate() + dayIndex);
    const dateStr = date.toISOString().split("T")[0];
    return workouts.filter(w => w.date === dateStr);
  };

  return (
    <div className="mb-6 p-4 bg-[#18181b] rounded-xl border border-[#3f3f46]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#a1a1aa]">Actividad semanal</span>
        <div className="flex items-center gap-3">
          {selectedDay !== null && (
            <button
              onClick={() => onDayClick(null)}
              className="flex items-center gap-1 text-xs text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          <span className="flex items-center gap-1 text-sm text-[#eab308]">
            <Flame className="w-4 h-4" />
            {activity.reduce((a, b) => a + b, 0)} workouts
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {activity.map((count, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const isToday = i === todayIndex;
          const isSelected = selectedDay === i;
          const dayWorkouts = getDayWorkouts(i);
          const hasWorkouts = dayWorkouts.length > 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <button
                onClick={() => onDayClick(hasWorkouts ? i : null)}
                className={`w-full aspect-square rounded-md ${getHeatmapColor(count, maxActivity)} ${isToday ? "ring-2 ring-[#eab308] ring-offset-2 ring-offset-[#18181b]" : ""} ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-[#18181b]" : ""} transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                {count > 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">{count}</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[#3f3f46] text-[10px]">-</span>
                  </div>
                )}
              </button>
              <span className={`text-xs ${isToday ? "text-[#eab308] font-bold" : "text-[#71717a]"}`}>
                {DAY_LABELS[i]}
              </span>
              <span className="text-[10px] text-[#52525b]">
                {formatDateShort(date).replace(".", "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function HistorialPage() {
  const router = useRouter();
  const { loading: authLoading, authenticated } = useAuth(true);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<DateFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [sharingWorkout, setSharingWorkout] = useState<WorkoutSummary | null>(null);

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
        return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
      case "last_month":
        return { start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) };
      case "this_year":
        return { start: new Date(today.getFullYear(), 0, 1), end: today };
      case "specific_day":
        if (selectedDayIndex !== null) {
          const { start } = getCurrentWeekRange();
          const dayDate = new Date(start);
          dayDate.setDate(start.getDate() + selectedDayIndex);
          dayDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dayDate);
          endDate.setHours(23, 59, 59, 999);
          return { start: dayDate, end: endDate };
        }
        return null;
      default:
        return null;
    }
  };

  useEffect(() => {
    async function loadWorkouts() {
      if (!authenticated) return;
      try {
        const history = await loadWorkoutHistory();
        setWorkouts(history);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      loadWorkouts();
    }
  }, [authenticated, authLoading]);

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
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
      const name = exercise.name || "Ejercicio sin nombre";
      if (!groups[name]) groups[name] = [];
      if (exercise.sets) {
        groups[name].push(...exercise.sets);
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
    const range = getDateRange(selectedDayIndex !== null ? "specific_day" : activeFilter);
    
    if (!range) return workouts;
    
    return workouts.filter((workout) => {
      try {
        const [year, month, day] = workout.date.split("-").map(Number);
        const workoutDate = new Date(year, month - 1, day);
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
    setSelectedDayIndex(null);
  };

  const hasActiveFilters = activeFilter !== "all" || selectedDayIndex !== null;
  const hasWeeklyWorkouts = hasWorkoutsThisWeek(workouts);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#eab308] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredWorkouts = filterWorkoutsByDate(workouts);
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    try {
      const [year, month] = workout.date.split("-");
      const monthKey = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("es-ES", { year: "numeric", month: "long" });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(workout);
    } catch (e) {
      console.error("Error grouping workout:", e);
    }
    return acc;
  }, {} as Record<string, WorkoutSummary[]>);

  const activity = calculateWeekActivity(workouts);
  const weeklyCount = activity.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader showBack backHref="/" />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              MI <span className="text-[#eab308]">HISTORIAL</span>
            </h1>
            <p className="text-[#a1a1aa]">Tus entrenamientos registrados</p>
          </div>

          {!loading && workouts.length > 0 && weeklyCount > 0 && (
            <WeekActivityChart
              workouts={workouts}
              weeklyCount={weeklyCount}
              selectedDay={selectedDayIndex}
              onDayClick={(dayIndex) => {
                setSelectedDayIndex(dayIndex);
                if (dayIndex !== null) setShowHistory(true);
              }}
            />
          )}

          {workouts.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#18181b] border border-[#3f3f46] rounded-xl text-[#a1a1aa] hover:text-white hover:border-[#eab308]/50 transition-all cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtrar por fecha</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {showFilters && (
                <div className="mt-3 p-4 bg-[#18181b] border border-[#3f3f46] rounded-xl">
                  <div className="flex flex-wrap gap-2">
                    {DATE_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setActiveFilter(filter.id);
                          if (filter.id !== "all") setShowHistory(true);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          activeFilter === filter.id
                            ? "bg-[#eab308] text-black"
                            : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-sm text-[#ef4444] hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                      Limpiar filtro
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && workouts.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-20 h-20 bg-[#18181b] rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-[#eab308]/30">
                  <Dumbbell className="w-10 h-10 text-[#eab308]/50" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sin entrenamientos aún</h3>
              <p className="text-[#71717a] mb-6">Comienza tu primer workout para ver tu progreso</p>
              <button
                onClick={() => router.push("/entrenamiento")}
                className="px-6 py-3 bg-[#eab308] text-black font-bold rounded-xl hover:bg-[#ca9a04] transition-colors cursor-pointer"
              >
                Ir a entrenar
              </button>
            </div>
          )}

          {showHistory && Object.keys(groupedWorkouts).length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white text-sm mb-4 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
                Volver al resumen
              </button>
              <div className="space-y-8">
                {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
                  <div key={month}>
                    <h2 className="text-sm font-bold text-[#71717a] uppercase mb-3">{month}</h2>
                    <div className="space-y-3">
                      {monthWorkouts.map((workout) => {
                        const stats = getWorkoutStats(workout);
                        const completed = isCompleted(workout);
                        const isExpanded = expandedWorkouts.has(workout.id);
                        const groupedSets = getGroupedSets(workout.exercises || []);

                        return (
                          <div key={workout.id} className="w-full rounded-xl bg-[#18181b] border border-[#3f3f46] overflow-hidden hover:border-[#eab308]/50 transition-all duration-200">
                            <button onClick={() => toggleWorkout(workout.id)} className="w-full p-4 text-left cursor-pointer">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-bold">{workout.name || formatDate(workout.date)}</span>
                                  {workout.name && <p className="text-xs text-[#71717a] mt-0.5">{formatDate(workout.date)}</p>}
                                </div>
                                {completed ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSharingWorkout(workout);
                                      }}
                                      className="p-1.5 text-[#71717a] hover:text-[#eab308] transition-colors cursor-pointer"
                                      title="Compartir entrenamiento"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </div>
                                    <span className="flex items-center gap-1 text-sm text-[#22c55e]">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Completado
                                    </span>
                                  </div>
                                ) : (
                                  <span className="flex items-center gap-1 text-sm text-[#eab308]">
                                    <Clock className="w-4 h-4" />
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              {stats.total > 0 && (
                                <div className="w-full h-1 bg-[#0a0a0a] rounded-full mb-2 overflow-hidden">
                                  <div className="h-full bg-[#eab308] rounded-full transition-all duration-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                                </div>
                              )}
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
                                  {isExpanded ? <ChevronUp className="w-5 h-5 text-[#71717a]" /> : <ChevronDown className="w-5 h-5 text-[#71717a]" />}
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
                                      <button onClick={() => toggleExercise(exerciseKey)} className="w-full p-3 flex items-center justify-between text-left hover:bg-[#27272a] transition-colors duration-200 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <Dumbbell className="w-4 h-4 text-[#eab308]" />
                                          <span className="font-medium">{exerciseName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-[#71717a]">{exerciseCompleted}/{sets.length} series</span>
                                          {exerciseExpanded ? <ChevronUp className="w-4 h-4 text-[#71717a]" /> : <ChevronDown className="w-4 h-4 text-[#71717a]" />}
                                        </div>
                                      </button>
                                      
                                      {exerciseExpanded && (
                                        <div className="border-t border-[#3f3f46] p-3 space-y-2">
                                          {sets.map((set) => (
                                            <div key={set.id} className={`flex items-center justify-between p-2 rounded ${set.is_completed ? "bg-[#22c55e]/10" : "bg-[#18181b]"}`}>
                                              <div className="flex items-center gap-2">
                                                {set.is_completed ? <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> : <Clock className="w-4 h-4 text-[#71717a]" />}
                                                <span className="text-sm text-[#a1a1aa]">Serie {set.set_number}</span>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium">{set.reps} reps</span>
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
                                {workout.exercises?.length === 0 && <p className="text-center text-[#71717a] py-4">Sin ejercicios registrados</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && weeklyCount === 0 && workouts.length > 0 && !showHistory && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-[#18181b] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-[#eab308]/30">
                  <Target className="w-10 h-10 text-[#eab308]/50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">¡Esta semana aún no has entrenado!</h3>
                <p className="text-[#71717a] mb-6 max-w-[280px] mx-auto">
                  Completa al menos un workout para ver tu progreso aquí
                </p>
                <button
                  onClick={() => router.push("/entrenamiento")}
                  className="px-6 py-3 bg-[#eab308] text-black font-bold rounded-xl hover:bg-[#ca9a04] transition-colors cursor-pointer"
                >
                  Ir a entrenar
                </button>
              </div>
              <button
                onClick={() => setShowHistory(true)}
                className="text-[#a1a1aa] hover:text-white text-sm underline cursor-pointer"
              >
                Ver historial de entrenamientos anteriores
              </button>
            </div>
          )}
        </div>
      </main>

      {sharingWorkout && (
        <WorkoutPhotoOverlay
          exercises={sharingWorkout.exercises}
          workoutName={sharingWorkout.name || undefined}
          completedAt={sharingWorkout.completed_at}
          workoutDate={sharingWorkout.date}
          onClose={() => setSharingWorkout(null)}
        />
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Target, Dumbbell, ChevronDown, ChevronUp, Scale, Filter, X, Flame, Calendar, Share2 } from "lucide-react";
import { loadWorkoutHistory, type WorkoutSummary, type WorkoutSet, type ExerciseInWorkout } from "@/lib/workout";
import { useAuth } from "@/lib/useAuth";
import { WorkoutPhotoOverlay } from "@/app/components/WorkoutPhotoOverlay";
import { LoadingScreen } from "@/app/components/LoadingScreen";

type DateFilter = "all" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "specific_day";

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
  if (count === 0) return "bg-card";
  const intensity = max > 0 ? (count / max) : 0;
  if (intensity <= 0.25) return "bg-accent/30";
  if (intensity <= 0.5) return "bg-accent/50";
  if (intensity <= 0.75) return "bg-accent/70";
  return "bg-accent";
};

const formatDateShort = (date: Date, locale?: string) => {
  return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" });
};

const WeekActivityChart = ({
  workouts,
  weeklyCount,
  selectedDay,
  onDayClick,
  t,
  lang,
}: {
  workouts: WorkoutSummary[];
  weeklyCount: number;
  selectedDay: number | null;
  onDayClick: (dayIndex: number | null) => void;
  t: (key: string) => string;
  lang: string;
}) => {
  const DAY_LABELS = lang === "en" ? ["M","T","W","T","F","S","S"] : ["L","M","X","J","V","S","D"];
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
    <div className="mb-6 p-4 bg-card rounded-xl border border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{t("historial.weekActivity")}</span>
        <div className="flex items-center gap-3">
          {selectedDay !== null && (
            <button
              onClick={() => onDayClick(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              {t("historial.clear")}
            </button>
          )}
          <span className="flex items-center gap-1 text-sm text-accent">
            <Flame className="w-4 h-4" />
            {activity.reduce((a, b) => a + b, 0)} {t("historial.workouts")}
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
                className={`w-full aspect-square rounded-md ${getHeatmapColor(count, maxActivity)} ${isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""} ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-card" : ""} transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                {count > 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">{count}</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-zinc-700 text-[10px]">-</span>
                  </div>
                )}
              </button>
              <span className={`text-xs ${isToday ? "text-accent font-bold" : "text-icon"}`}>
                {DAY_LABELS[i]}
              </span>
              <span className="text-[10px] text-zinc-600">
                {formatDateShort(date, lang).replace(".", "")}
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
  const { t, lang } = useLanguage();
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
    { id: "all", label: t("historial.filterAll") },
    { id: "this_week", label: t("historial.filterThisWeek") },
    { id: "last_week", label: t("historial.filterLastWeek") },
    { id: "this_month", label: t("historial.filterThisMonth") },
    { id: "last_month", label: t("historial.filterLastMonth") },
    { id: "this_year", label: t("historial.filterThisYear") },
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

  const formatDate = (dateStr: string, locale?: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { weekday: "long", day: "numeric", month: "long" });
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

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const filteredWorkouts = filterWorkoutsByDate(workouts);
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    try {
      const [year, month] = workout.date.split("-");
      const monthKey = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { year: "numeric", month: "long" });
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
    <div className="min-h-screen bg-background text-white">
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("historial.title").split(" ")[0]} <span className="text-accent">{t("historial.title").split(" ")[1]}</span>
            </h1>
            <p className="text-muted-foreground">{t("historial.subtitle")}</p>
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
              t={t}
              lang={lang}
            />
          )}

          {workouts.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-card border border rounded-xl text-muted-foreground hover:text-white hover:border-accent/50 transition-all cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">{t("historial.filterByDate")}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {showFilters && (
                <div className="mt-3 p-4 bg-card border border rounded-xl">
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
                            ? "bg-accent text-black"
                            : "bg-muted text-muted-foreground hover:bg-zinc-700"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-sm text-red-500 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                      {t("historial.clearFilter")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && workouts.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-accent/30">
                  <Dumbbell className="w-10 h-10 text-accent/50" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{t("historial.noWorkouts")}</h3>
              <p className="text-icon mb-6">{t("historial.noWorkoutsMsg")}</p>
              <button
                onClick={() => router.push("/entrenamiento")}
                className="px-6 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
              >
                {t("historial.goTrain")}
              </button>
            </div>
          )}

          {showHistory && Object.keys(groupedWorkouts).length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-4 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
                {t("historial.backToSummary")}
              </button>
              <div className="space-y-8">
                {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
                  <div key={month}>
                      <h2 className="text-sm font-bold text-icon uppercase mb-3">{month}</h2>
                    <div className="space-y-3">
                      {monthWorkouts.map((workout) => {
                        const stats = getWorkoutStats(workout);
                        const completed = isCompleted(workout);
                        const isExpanded = expandedWorkouts.has(workout.id);
                        const groupedSets = getGroupedSets(workout.exercises || []);

                        return (
                          <div key={workout.id} className="w-full rounded-xl bg-card border border overflow-hidden hover:border-accent/50 transition-all duration-200">
                            <button onClick={() => toggleWorkout(workout.id)} className="w-full p-4 text-left cursor-pointer">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-bold">{workout.name || formatDate(workout.date, lang)}</span>
                                  {workout.name && <p className="text-xs text-icon mt-0.5">{formatDate(workout.date, lang)}</p>}
                                </div>
                                {completed ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSharingWorkout(workout);
                                      }}
                                      className="p-1.5 text-icon hover:text-accent transition-colors cursor-pointer"
                                      title={t("historial.shareTitle")}
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </div>
                                    <span className="flex items-center gap-1 text-sm text-green-500">
                                      <CheckCircle2 className="w-4 h-4" />
                                      {t("historial.completed")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="flex items-center gap-1 text-sm text-accent">
                                    <Clock className="w-4 h-4" />
                                    {t("historial.pending")}
                                  </span>
                                )}
                              </div>
                              {stats.total > 0 && (
                                <div className="w-full h-1 bg-background rounded-full mb-2 overflow-hidden">
                                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  {stats.completed}/{stats.total} {t("historial.series")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Dumbbell className="w-4 h-4" />
                                  {stats.uniqueExercises} {t("historial.exercises")}
                                </span>
                                <span className="ml-auto">
                                  {isExpanded ? <ChevronUp className="w-5 h-5 text-icon" /> : <ChevronDown className="w-5 h-5 text-icon" />}
                                </span>
                              </div>
                            </button>
                            
                            {isExpanded && (
                              <div className="border-t border p-4 space-y-3">
                                {Object.entries(groupedSets).map(([exerciseName, sets]) => {
                                  const exerciseKey = `${workout.id}-${exerciseName}`;
                                  const exerciseExpanded = expandedExercises.has(exerciseKey);
                                  const exerciseCompleted = sets.filter(s => s.is_completed).length;

                                  return (
                                    <div key={exerciseName} className="bg-background rounded-lg overflow-hidden">
                                      <button onClick={() => toggleExercise(exerciseKey)} className="w-full p-3 flex items-center justify-between text-left hover:bg-muted transition-colors duration-200 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <Dumbbell className="w-4 h-4 text-accent" />
                                          <span className="font-medium">{exerciseName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-icon">
                                            {sets[0]?.is_cardio
                                              ? t("historial.cardio")
                                              : `${exerciseCompleted}/${sets.length} ${t("historial.series")}`}
                                          </span>
                                          {exerciseExpanded ? <ChevronUp className="w-4 h-4 text-icon" /> : <ChevronDown className="w-4 h-4 text-icon" />}
                                        </div>
                                      </button>
                                      
                                      {exerciseExpanded && (
                                        <div className="border-t border p-3 space-y-2">
                                          {sets.map((set) => (
                                            <div key={set.id} className={`flex items-center justify-between p-2 rounded ${set.is_completed ? "bg-green-500/10" : "bg-card"}`}>
                                              <div className="flex items-center gap-2">
                                                {set.is_completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-icon" />}
                                                {set.is_cardio ? (
                                                  <span className="text-sm text-muted-foreground">{t("historial.cardio")}</span>
                                                ) : (
                                                  <span className="text-sm text-muted-foreground">{t("historial.set")} {set.set_number}</span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-4">
                                                {set.is_cardio ? (
                                                  <>
                                                    {(set.distance_km ?? 0) > 0 && (
                                                      <span className="text-sm font-medium">{set.distance_km} km</span>
                                                    )}
                                                    {(set.duration_minutes ?? 0) > 0 && (
                                                      <span className="flex items-center gap-1 text-sm text-accent">
                                                        <Clock className="w-3 h-3" />
                                                        {set.duration_minutes} min
                                                      </span>
                                                    )}
                                                  </>
                                                ) : (
                                                  <>
                                                    <span className="text-sm font-medium">{set.reps ?? 0} reps</span>
                                                    <span className="flex items-center gap-1 text-sm text-accent">
                                                      <Scale className="w-3 h-3" />
                                                      {set.weight_kg ?? 0} kg
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {workout.exercises?.length === 0 && <p className="text-center text-icon py-4">{t("historial.noExercises")}</p>}
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
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-accent/30">
                  <Target className="w-10 h-10 text-accent/50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t("historial.weeklyEmptyTitle")}</h3>
                <p className="text-icon mb-6 max-w-[280px] mx-auto">
                  {t("historial.weeklyEmptyMsg")}
                </p>
                <button
                  onClick={() => router.push("/entrenamiento")}
                className="px-6 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
                >
                {t("historial.goTrain")}
              </button>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="text-muted-foreground hover:text-white text-sm underline cursor-pointer"
            >
              {t("historial.viewOlder")}
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
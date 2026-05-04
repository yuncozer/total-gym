"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Clock, Target, Loader2, ArrowLeft, Dumbbell, ChevronDown, ChevronUp, Scale, Search, X } from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";

interface Workout {
  id: string;
  date: string;
  status: string;
  completed_at: string | null;
  workout_sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  is_completed: boolean;
}

export default function HistorialPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function initSupabase() {
      const { createBrowserClient } = await import("@supabase/ssr");
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );
      setSupabase(client);

      const { data: { session } } = await client.auth.getSession();
      console.log("Session:", session?.user?.id);
      
      if (session?.user) {
        const { data: workoutsData, error } = await client
          .from("workouts")
          .select("id, date, started_at, status")
          .eq("user_id", session.user.id)
          .order("started_at", { ascending: false });

        console.log("Workouts data:", workoutsData, "error:", error);
        
        if (workoutsData && workoutsData.length > 0) {
          const workoutsWithSets = await Promise.all(
            workoutsData.map(async (workout) => {
              const { data: sets } = await client
                .from("workout_sets")
                .select("id, exercise_id, exercise_name, set_number, reps, weight_kg, is_completed")
                .eq("workout_id", workout.id);
              return { ...workout, workout_sets: sets || [] };
            })
          );
          
          console.log("Workouts with sets:", workoutsWithSets);
          setWorkouts(workoutsWithSets as unknown as Workout[]);
        }
      }
      setLoading(false);
    }
    initSupabase();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = 2000 + parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
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
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = 2000 + parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        });
      }
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

  const getGroupedSets = (sets: WorkoutSet[]) => {
    const groups: Record<string, WorkoutSet[]> = {};
    sets.forEach((set) => {
      const key = set.exercise_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(set);
    });
    return groups;
  };

  const groupWorkoutsByMonth = (workouts: Workout[]) => {
    const groups: Record<string, Workout[]> = {};
    workouts.forEach((workout) => {
      try {
        const parts = workout.date.split("-");
        let date: Date;
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = 2000 + parseInt(parts[2], 10);
          date = new Date(year, month, day);
        } else {
          date = new Date(workout.date);
        }
        const key = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
        if (!groups[key]) groups[key] = [];
        groups[key].push(workout);
      } catch (e) {
        console.error("Error grouping workout:", e);
      }
    });
    return groups;
  };

  const getWorkoutStats = (workout: Workout) => {
    const total = workout.workout_sets?.length || 0;
    const completed = workout.workout_sets?.filter((s) => s.is_completed).length || 0;
    const uniqueExercises = new Set(workout.workout_sets?.map((s) => s.exercise_name)).size;
    return { total, completed, uniqueExercises };
  };

  const isCompleted = (workout: Workout) => workout.status === "completed";

  const filterWorkoutsByDate = (workouts: Workout[]) => {
    return workouts.filter((workout) => {
      try {
        const parts = workout.date.split("-");
        let workoutDate: Date;
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = 2000 + parseInt(parts[2], 10);
          workoutDate = new Date(year, month, day);
        } else {
          workoutDate = new Date(workout.date);
        }

        if (fechaInicio && fechaFin) {
          const start = new Date(fechaInicio);
          const end = new Date(fechaFin);
          end.setHours(23, 59, 59, 999);
          return workoutDate >= start && workoutDate <= end;
        }

        if (fechaInicio) {
          const start = new Date(fechaInicio);
          return workoutDate >= start;
        }

        if (fechaFin) {
          const end = new Date(fechaFin);
          end.setHours(23, 59, 59, 999);
          return workoutDate <= end;
        }

        return true;
      } catch (e) {
        return true;
      }
    });
  };

  const clearFilters = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  const hasActiveFilters = fechaInicio || fechaFin;

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
            <Search className="w-4 h-4" />
            {hasActiveFilters ? "Filtrar activo" : "Filtrar por fecha"}
          </button>

          {showFilters && (
            <div className="mb-6 p-4 bg-[#18181b] rounded-xl border border-[#3f3f46]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">Desde fecha</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">Hasta fecha</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white cursor-pointer"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-[#71717a]" />
              </div>
              {hasActiveFilters ? (
                <>
                  <p className="text-[#a1a1aa] mb-4">No se encontraron workouts en ese rango de fechas</p>
                  <button
                    onClick={clearFilters}
                    className="text-[#eab308] hover:text-[#ca9a04] font-bold cursor-pointer"
                  >
                    Limpiar filtros
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
                      const groupedSets = getGroupedSets(workout.workout_sets || []);

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
                              
                              {workout.workout_sets?.length === 0 && (
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
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Dumbbell, 
  Check,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Plus,
  Trash2,
  Play,
  Loader2,
  AlertCircle
} from "lucide-react";
import { ExerciseCard } from "@/app/components/EjercicioCard";
import { UserHeader } from "@/app/components/UserHeader";
import { exercisesDatabase, muscleGroupsData, Exercise } from "@/app/data/ejercicios";
import type { Session } from "@supabase/supabase-js";

const muscleGroups = muscleGroupsData;
const DEFAULT_SETS = 3;

interface ResumenEjercicio {
  id: string;
  nombre: string;
  description: string;
  equipment: string;
  sets: { reps: number; peso: number }[];
}

export default function EntrenamientoPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<"muscles" | "exercises" | "summary" | "saving">("muscles");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  
  const [resumen, setResumen] = useState<ResumenEjercicio[]>([]);

  useEffect(() => {
    async function initSupabase() {
      const { createBrowserClient } = await import("@supabase/ssr");
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );
      setSupabase(client);
    }
    initSupabase();
  }, []);

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const toggleExercise = (muscleId: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const current = prev[muscleId] || [];
      const updated = current.includes(exerciseId)
        ? current.filter(e => e !== exerciseId)
        : [...current, exerciseId];
      return { ...prev, [muscleId]: updated };
    });
  };

  const findExerciseById = (exerciseId: string): Exercise | undefined => {
    for (const exercises of Object.values(exercisesDatabase)) {
      const found = exercises.find(e => e.id === exerciseId);
      if (found) return found;
    }
    return undefined;
  };

  const getSelectedExercisesList = (): ResumenEjercicio[] => {
    const exercises: ResumenEjercicio[] = [];
    Object.entries(selectedExercises).forEach(([muscleId, exerciseIds]) => {
      exerciseIds.forEach(exerciseId => {
        const exerciseData = findExerciseById(exerciseId);
        if (exerciseData) {
          const defaultSets = Array.from({ length: DEFAULT_SETS }, (_, i) => ({
            reps: 0,
            peso: 0
          }));
          exercises.push({
            id: exerciseId,
            nombre: exerciseData.name,
            description: exerciseData.description,
            equipment: exerciseData.equipment,
            sets: defaultSets
          });
        }
      });
    });
    return exercises;
  };

  const agregarSet = (ejercicioId: string) => {
    setResumen(prev => prev.map(ej => {
      if (ej.id === ejercicioId) {
        return { ...ej, sets: [...ej.sets, { reps: 0, peso: 0 }] };
      }
      return ej;
    }));
  };

  const eliminarSet = (ejercicioId: string, setIndex: number) => {
    setResumen(prev => prev.map(ej => {
      if (ej.id === ejercicioId && ej.sets.length > 1) {
        return { ...ej, sets: ej.sets.filter((_, i) => i !== setIndex) };
      }
      return ej;
    }));
  };

  const actualizarSet = (ejercicioId: string, setIndex: number, field: 'reps' | 'peso', value: number) => {
    setResumen(prev => prev.map(ej => {
      if (ej.id === ejercicioId) {
        const newSets = [...ej.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ej, sets: newSets };
      }
      return ej;
    }));
  };

  const handleConfirmar = async () => {
    const exList = getSelectedExercisesList();
    setResumen(exList);
    setStep("summary");
  };

  const handleGuardarYEjecutar = async () => {
    if (!supabase) return;
    
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Debes iniciar sesión para guardar el entrenamiento");
        setSaving(false);
        return;
      }

const fecha = new Date().toISOString().split('T')[0];
        
        const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: session.user.id,
          date: fecha,
          status: "pendiente"
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const setsToInsert = resumen.flatMap(ej => 
        ej.sets.map((_, index) => ({
          workout_id: workout.id,
          exercise_id: ej.id,
          exercise_name: ej.nombre,
          set_number: index + 1,
          reps: 0,
          weight_kg: 0,
          is_completed: false
        }))
      );

      const { error: setsError } = await supabase
        .from("workout_sets")
        .insert(setsToInsert);

      if (setsError) throw setsError;

      setWorkoutId(workout.id);
      router.push(`/workout/${workout.id}`);
    } catch (err: any) {
      setError(err.message || "Error al guardar el entrenamiento");
      setSaving(false);
    }
  };

  const getEquipmentLabel = (equipment: string) => {
    const barraKeywords = ['barbell', 'máquina', 'prensa', 'smith'];
    const isBarra = barraKeywords.some(k => equipment.toLowerCase().includes(k));
    return isBarra ? "Peso (kg)" : "Peso por lado (kg)";
  };

  if (step === "summary") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />

        <main className="pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                RESUMEN DE <span className="text-[#eab308]">ENTRENAMIENTO</span>
              </h1>
              <p className="text-[#a1a1aa]">
                Configura el número de series por ejercicio
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl text-[#ef4444]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {resumen.map((ej) => (
                <div key={ej.id} className="bg-[#18181b] rounded-xl p-4 border border-[#3f3f46]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{ej.nombre}</h3>
                      <p className="text-sm text-[#71717a] mt-1 line-clamp-2">{ej.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => eliminarSet(ej.id, ej.sets.length - 1)}
                        disabled={ej.sets.length <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0a0a0a] border border-[#3f3f46] text-[#71717a] hover:text-[#ef4444] hover:border-[#ef4444] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span className="block font-bold text-lg">{ej.sets.length}</span>
                        <span className="text-xs text-[#71717a]">series</span>
                      </div>
                      <button
                        onClick={() => agregarSet(ej.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0a0a0a] border border-[#3f3f46] text-[#71717a] hover:text-[#eab308] hover:border-[#eab308] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGuardarYEjecutar}
                disabled={saving}
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] disabled:bg-[#3f3f46] disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    GUARDANDO...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    INICIAR ENTRENAMIENTO
                  </>
                )}
              </button>
              
              <button
                onClick={() => setStep("exercises")}
                className="flex items-center justify-center gap-2 w-full py-3 border border-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a ejercicios
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader showBack backHref="/" />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {step === "muscles" ? (
                <>¿QUE VAS A <span className="text-[#eab308]">ENTRENAR</span> HOY?</>
              ) : (
                <>ELIGE TUS <span className="text-[#eab308]">EJERCICIOS</span></>
              )}
            </h1>
            <p className="text-[#a1a1aa]">
              {step === "muscles" 
                ? "Selecciona los grupos musculares que vas a trabajar" 
                : "Selecciona los ejercicios para cada grupo"}
            </p>
          </div>

          {step === "muscles" ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                {muscleGroups.map((muscle) => (
                  <button
                    key={muscle.id}
                    onClick={() => toggleMuscle(muscle.id)}
                    className={`
                      relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                      ${selectedMuscles.includes(muscle.id) 
                        ? "bg-[#eab308] border-[#eab308] text-black scale-105" 
                        : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]/50 hover:bg-[#27272a]"
                      }
                    `}
                  >
                    {selectedMuscles.includes(muscle.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#eab308]" />
                      </div>
                    )}
                    <div className="text-4xl mb-3">{muscle.icon}</div>
                    <h3 
                      className="font-bold text-lg"
                      style={{ fontFamily: "var(--font-oswald)" }}
                    >
                      {muscle.name}
                    </h3>
                    <p className={`text-xs mt-2 ${selectedMuscles.includes(muscle.id) ? "text-black/70" : "text-[#a1a1aa]"}`}>
                      {muscle.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="text-center">
<button
                    onClick={() => setStep("exercises")}
                    disabled={selectedMuscles.length === 0}
                    className={`
                      group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all cursor-pointer
                      ${selectedMuscles.length > 0 
                        ? "bg-[#eab308] hover:bg-[#ca9a04] text-black hover:scale-105" 
                        : "bg-[#3f3f46] text-[#71717a] cursor-not-allowed"
                      }
                    `}
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                  <Dumbbell className="w-5 h-5" />
                  ELEGIR EJERCICIOS
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {selectedMuscles.length === 0 && (
                  <p className="text-[#71717a] mt-4 text-sm">
                    Selecciona al menos un grupo muscular para continuar
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-8 mb-10">
                {selectedMuscles.map(muscleId => {
                  const muscle = muscleGroups.find(m => m.id === muscleId);
                  const exercises = exercisesDatabase[muscleId] || [];
                  const selected = selectedExercises[muscleId] || [];
                  
                  return (
                    <div key={muscleId} className="bg-[#18181b] rounded-2xl p-6 border border-[#3f3f46]">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{muscle?.icon}</span>
                        <h3 className="font-bold text-xl text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                          {muscle?.name}
                        </h3>
                        <span className="text-sm text-[#71717a] ml-auto">
                          {selected.length}/{exercises.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {exercises.map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            selected={selected.includes(exercise.id)}
                            onSelect={() => toggleExercise(muscleId, exercise.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <div className="mb-4 text-[#a1a1aa]">
                  {Object.values(selectedExercises).flat().length} ejercicios seleccionados
                </div>
                <button
                  onClick={handleConfirmar}
                  disabled={Object.values(selectedExercises).flat().length === 0}
                  className={`
                    group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all cursor-pointer
                    ${Object.values(selectedExercises).flat().length > 0 
                      ? "bg-[#eab308] hover:bg-[#ca9a04] text-black hover:scale-105" 
                      : "bg-[#3f3f46] text-[#71717a] cursor-not-allowed"
                    }
                  `}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <UserCheck className="w-5 h-5" />
                  CONFIRMAR ENTRENAMIENTO
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Dumbbell, 
  Check,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Play,
  Loader2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { ExerciseCard, ImageModal, type WgerExercise } from "@/app/components/EjercicioCard";
import { UserHeader } from "@/app/components/UserHeader";
import { muscleGroupsData, MuscleGroup } from "@/lib/data/ejercicios";

const DEFAULT_SETS = 3;

const EQUIPMENT_TABS = [
  { id: "all", label: "Todos" },
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Mancuernas" },
  { id: "body weight", label: "Peso corporal" },
  { id: "other", label: "Otros" },
];

interface ResumenEjercicio {
  id: string;
  uuid: string;
  nombre: string;
  description: string;
  equipment: string;
  sets: { reps: number; peso: number }[];
}

export default function EntrenamientoPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [muscleGroups] = useState<MuscleGroup[]>(muscleGroupsData);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Record<string, WgerExercise[]>>({});
  const [selectedExercises, setSelectedExercises] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<"muscles" | "exercises" | "summary" | "saving">("muscles");
  const [currentMuscleIndex, setCurrentMuscleIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingExercises, setLoadingExercises] = useState<Record<string, boolean>>({});
  const [resumen, setResumen] = useState<ResumenEjercicio[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, string>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

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

  const fetchExercises = async (muscleGroup: MuscleGroup) => {
    if (exercises[muscleGroup.id]) return;

    setLoadingExercises(prev => ({ ...prev, [muscleGroup.id]: true }));

    try {
      const params = new URLSearchParams();
      params.append("muscleGroup", muscleGroup.id);
      params.append("limit", "50");

      const response = await fetch(`/api/exercises?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExercises(prev => ({
          ...prev,
          [muscleGroup.id]: data.data
        }));
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
    } finally {
      setLoadingExercises(prev => ({ ...prev, [muscleGroup.id]: false }));
    }
  };

  const toggleMuscle = async (id: string) => {
    const newSelected = selectedMuscles.includes(id)
      ? selectedMuscles.filter(m => m !== id)
      : [...selectedMuscles, id];
    
    setSelectedMuscles(newSelected);
    
    if (!selectedMuscles.includes(id) && !exercises[id]) {
      const muscle = muscleGroups.find(m => m.id === id);
      if (muscle) {
        await fetchExercises(muscle);
      }
    }

    if (!selectedMuscles.includes(id)) {
      setSelectedEquipment(prev => ({ ...prev, [id]: "all" }));
    }
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

const getFilteredExercises = (muscleId: string): WgerExercise[] => {
    const muscleExercises = exercises[muscleId] || [];
    const equipment = selectedEquipment[muscleId] || "all";
    const search = searchQueries[muscleId] || "";
    
    let filtered = equipment === "all" 
      ? muscleExercises 
      : muscleExercises.filter(ex => ex.equipmentCategory === equipment);
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    return [...filtered].sort((a, b) => {
      if (a.imageUrl && !b.imageUrl) return -1;
      if (!a.imageUrl && b.imageUrl) return 1;
      return 0;
    });
  };

  const handleSearchChange = (muscleId: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [muscleId]: value }));
  };

  const handleImageClick = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const isExerciseSelected = (muscleId: string, exerciseId: string): boolean => {
    return (selectedExercises[muscleId] || []).includes(exerciseId);
  };

  const getSelectedExercisesList = (): ResumenEjercicio[] => {
    const exerciseList: ResumenEjercicio[] = [];
    Object.entries(selectedExercises).forEach(([muscleId, exerciseIds]) => {
      exerciseIds.forEach(exerciseId => {
        const muscleExercises = exercises[muscleId] || [];
        const exerciseData = muscleExercises.find(e => e.id === exerciseId);
        if (exerciseData) {
          const defaultSets = Array.from({ length: DEFAULT_SETS }, () => ({
            reps: 0,
            peso: 0
          }));
          exerciseList.push({
            id: exerciseData.id,
            uuid: exerciseData.uuid,
            nombre: exerciseData.name,
            description: exerciseData.description,
            equipment: exerciseData.equipment,
            sets: defaultSets
          });
        }
      });
    });
    return exerciseList;
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

      router.push(`/workout/${workout.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el entrenamiento";
      setError(errorMessage);
      setSaving(false);
    }
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
                : "Selecciona los ejercicios para cada grupo"
              }
            </p>
            {step === "exercises" && (
              <button
                onClick={() => setStep("muscles")}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar grupos musculares ({selectedMuscles.length})
              </button>
            )}
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
                    <div className="relative w-24 h-24 mb-3 mx-auto rounded-xl overflow-hidden">
                      <Image
                        src={muscle.image}
                        alt={muscle.name}
                        fill
                        className="object-contain"
                      />
                    </div>
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
                  onClick={() => {
                    setStep("exercises");
                    setCurrentMuscleIndex(0);
                  }}
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
                {selectedMuscles.slice(currentMuscleIndex, currentMuscleIndex + 1).map(muscleId => {
                  const muscle = muscleGroups.find(m => m.id === muscleId);
                  const filteredExercises = getFilteredExercises(muscleId);
                  const selected = selectedExercises[muscleId] || [];
                  const isLoading = loadingExercises[muscleId];
                  const currentEquipment = selectedEquipment[muscleId] || "all";
                  
                  return (
                    <div key={muscleId} className="bg-[#18181b] rounded-2xl p-6 border border-[#3f3f46] flex flex-col max-h-[calc(100vh-280px)]">
                      <div className="flex-none">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                            {muscle?.image && (
                              <Image
                                src={muscle.image}
                                alt={muscle?.name || ""}
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                          <h3 className="font-bold text-xl text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                            {muscle?.name}
                          </h3>
                          <span className="text-sm text-[#71717a] ml-auto">
                            {selected.length}/{filteredExercises.length}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {EQUIPMENT_TABS.map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setSelectedEquipment(prev => ({ ...prev, [muscleId]: tab.id }))}
                              className={`
                                px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer
                                ${currentEquipment === tab.id
                                  ? "bg-[#eab308] text-black"
                                  : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]"
                                }
                              `}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                          <input
                            type="text"
                            placeholder="Buscar ejercicio..."
                            value={searchQueries[muscleId] || ""}
                            onChange={(e) => handleSearchChange(muscleId, e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#eab308]/50 transition-colors"
                          />
                          {searchQueries[muscleId] && (
                            <button
                              onClick={() => handleSearchChange(muscleId, "")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a] hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-[#3f3f46] scrollbar-track-transparent hover:scrollbar-thumb-[#52525b]">
                        <div className="space-y-3">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-[#eab308]" />
                              <span className="ml-2 text-[#71717a]">Cargando ejercicios...</span>
                            </div>
                          ) : filteredExercises.length > 0 ? (
                            filteredExercises.map((exercise) => (
                              <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                selected={isExerciseSelected(muscleId, exercise.id)}
                                onSelect={() => toggleExercise(muscleId, exercise.id)}
                                onImageClick={handleImageClick}
                              />
                            ))
) : (
                            <div className="text-center py-8 text-[#71717a]">
                              {searchQueries[muscleId] 
                                ? `No se encontraron ejercicios para "${searchQueries[muscleId]}"`
                                : "No hay ejercicios con este equipo"
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4 mb-6">
                <button
                  onClick={() => setCurrentMuscleIndex(Math.max(0, currentMuscleIndex - 1))}
                  disabled={currentMuscleIndex === 0}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer
                    ${currentMuscleIndex === 0
                      ? "bg-[#27272a] text-[#52525b] cursor-not-allowed"
                      : "bg-[#27272a] hover:bg-[#3f3f46] text-white"
                    }
                  `}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {selectedMuscles.map((muscleId, index) => {
                    const muscle = muscleGroups.find(m => m.id === muscleId);
                    const isActive = index === currentMuscleIndex;
                    const hasSelected = (selectedExercises[muscleId] || []).length > 0;
                    
                    return (
                      <button
                        key={muscleId}
                        onClick={() => setCurrentMuscleIndex(index)}
                        className={`
                          w-3 h-3 rounded-full transition-all cursor-pointer
                          ${isActive 
                            ? "bg-[#eab308] scale-125" 
                            : hasSelected 
                              ? "bg-[#eab308]/50 hover:bg-[#eab308]"
                              : "bg-[#3f3f46] hover:bg-[#52525b]"
                          }
                        `}
                        title={muscle?.name || ""}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentMuscleIndex(Math.min(selectedMuscles.length - 1, currentMuscleIndex + 1))}
                  disabled={currentMuscleIndex === selectedMuscles.length - 1}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer
                    ${currentMuscleIndex === selectedMuscles.length - 1
                      ? "bg-[#27272a] text-[#52525b] cursor-not-allowed"
                      : "bg-[#eab308] hover:bg-[#ca9a04] text-black"
                    }
                  `}
                >
                  {selectedMuscles[currentMuscleIndex + 1] ? (
                    <>
                      {muscleGroups.find(m => m.id === selectedMuscles[currentMuscleIndex + 1])?.name || "Siguiente"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {modalImage && (
                <ImageModal 
                  imageUrl={modalImage} 
                  onClose={() => setModalImage(null)} 
                />
              )}

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
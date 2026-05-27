"use client";

import { useState, useEffect, Fragment as ReactFragment } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
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
  Bookmark,
  Plus,
  Trash2,
} from "lucide-react";
import { ExerciseCard, ImageModal, type WgerExercise } from "@/app/components/EjercicioCard";
import { UserHeader } from "@/app/components/UserHeader";
import { RegisterModal } from "@/app/components/RegisterModal";
import { TemplateSelector } from "@/app/components/TemplateSelector";
import { CreateCustomExerciseModal } from "@/app/components/CreateCustomExerciseModal";
import * as service from "@/lib/workout/service";
import { muscleGroupsData, MuscleGroup } from "@/lib/data/ejercicios";
import type { WorkoutTemplate } from "@/lib/workout/types";

const DEFAULT_SETS = 3;

const EQUIPMENT_TABS = [
  { id: "all", label: "Todos" },
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Mancuernas" },
  { id: "body weight", label: "Peso corporal" },
  { id: "personalizados", label: "Personalizados" },
  { id: "other", label: "Otros" },
];

interface ResumenEjercicio {
  id: string;
  uuid: string;
  nombre: string;
  description: string;
  equipment: string;
  imageUrl?: string;
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
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerModalKey, setRegisterModalKey] = useState(0);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCreateCustomExercise, setShowCreateCustomExercise] = useState(false);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<Record<string, WgerExercise[]>>({});
  const [recentExercises, setRecentExercises] = useState<Record<string, (WgerExercise & { lastWeight: number })[]>>({});

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setRegisterModalKey(prev => prev + 1);
  };

  console.log("[Entrenamiento] showRegisterModal state:", showRegisterModal);
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

  useEffect(() => {
    if (!supabase) return;
    loadCustomExercises();
  }, [supabase]);

  const loadCustomExercises = async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const response = await fetch("/api/custom-exercises");
      if (!response.ok) return;
      const exercises = await response.json();
      if (!Array.isArray(exercises)) return;
      const grouped: Record<string, WgerExercise[]> = {};
      for (const ex of exercises) {
        const groupId = ex.muscle_group || "other";
        if (!grouped[groupId]) grouped[groupId] = [];
        grouped[groupId].push({
          id: `custom_${ex.id}`,
          uuid: `custom_${ex.id}`,
          name: ex.name,
          description: "",
          category: "",
          categoryId: 0,
          muscles: [],
          muscleIds: [],
          secondaryMuscles: [],
          secondaryMuscleIds: [],
          equipment: String(ex.equipment || 0),
          equipmentIds: [],
          equipmentCategory: "",
          imageUrl: null,
          images: [],
          variationGroup: null,
        } as WgerExercise);
      }
      setCustomExercises(grouped);
    } catch (err) {
      console.error("Error loading custom exercises:", err);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (event === "SIGNED_IN" && session?.user) {
        const pendingData = sessionStorage.getItem("pending_workout_summary");
        if (pendingData) {
          sessionStorage.removeItem("pending_workout_summary");
          const pendingWorkout: ResumenEjercicio[] = JSON.parse(pendingData);

          if (pendingWorkout.length > 0 && supabase) {
            setResumen(pendingWorkout);
            setStep("summary");
            setShowRegisterModal(false);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchExercises = async (muscleGroup: MuscleGroup, onComplete?: (exercises: WgerExercise[]) => void) => {
    const cachedExercises = exercises[muscleGroup.id];
    if (cachedExercises) {
      if (onComplete) onComplete(cachedExercises);
      return;
    }

    setLoadingExercises(prev => ({ ...prev, [muscleGroup.id]: true }));

    try {
      const params = new URLSearchParams();
      params.append("muscleGroup", muscleGroup.id);
      params.append("limit", "50");

      const response = await fetch(`/api/exercises?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const fetchedData = data.data as WgerExercise[];
        setExercises(prev => ({
          ...prev,
          [muscleGroup.id]: fetchedData
        }));
        if (onComplete) onComplete(fetchedData);
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
      if (onComplete) onComplete([]);
    } finally {
      setLoadingExercises(prev => ({ ...prev, [muscleGroup.id]: false }));
    }
  };

  const fetchRecentExercises = async (muscleGroupId: string, userId: string, muscleExercises: WgerExercise[]) => {
    if (!supabase) return;

    if (recentExercises[muscleGroupId]?.length > 0) return;

    try {
      const { data: workouts, error: workoutsError } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userId);

      if (workoutsError) throw workoutsError;

      if (!workouts || workouts.length === 0) {
        console.log("No workouts found for user");
        return;
      }

      const workoutIds = workouts.map((w: { id: string }) => w.id);

      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_id, exercise_name, completed_at, weight_kg")
        .in("workout_id", workoutIds)
        .order("completed_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      console.log("Workout sets fetched:", data?.length);

      if (!data || data.length === 0) {
        console.log("No workout sets found");
        return;
      }

      const exerciseCounts: Record<string, { count: number; lastUsed: string; name: string; lastWeight: number }> = {};
      data?.forEach((set: { exercise_id: string; exercise_name: string; completed_at?: string; weight_kg?: number }) => {
        if (!exerciseCounts[set.exercise_id]) {
          exerciseCounts[set.exercise_id] = { count: 0, lastUsed: "", name: set.exercise_name, lastWeight: 0 };
        }
        exerciseCounts[set.exercise_id].count += 1;
        const currentLastUsed = exerciseCounts[set.exercise_id].lastUsed;
        const completedAt = set.completed_at || "";
        if (!currentLastUsed || (completedAt && completedAt > currentLastUsed)) {
          exerciseCounts[set.exercise_id].lastUsed = completedAt;
          exerciseCounts[set.exercise_id].lastWeight = set.weight_kg || 0;
        }
      });

      const sorted = Object.entries(exerciseCounts)
        .sort((a, b) => {
          if (b[1].count !== a[1].count) return b[1].count - a[1].count;
          return new Date(b[1].lastUsed).getTime() - new Date(a[1].lastUsed).getTime();
        })
        .slice(0, 5)
        .map(([id, info]) => ({ id, name: info.name, lastWeight: info.lastWeight }));

      console.log("Top exercises:", sorted);
      console.log("Muscle exercises passed:", muscleExercises.length);

      const recentMatches = sorted
        .map(s => {
          const exercise = muscleExercises.find(e => e.id === s.id || e.uuid === s.id);
          if (exercise) {
            return { ...exercise, lastWeight: s.lastWeight };
          }
          return null;
        })
        .filter(Boolean) as (WgerExercise & { lastWeight: number })[];

      console.log("Matched recent exercises:", recentMatches.length);

      setRecentExercises(prev => ({ ...prev, [muscleGroupId]: recentMatches }));
    } catch (err) {
      console.error("Error fetching recent exercises:", err);
    }
  };

  const toggleMuscle = async (id: string) => {
    const newSelected = selectedMuscles.includes(id)
      ? selectedMuscles.filter(m => m !== id)
      : [...selectedMuscles, id];

    setSelectedMuscles(newSelected);

    if (!selectedMuscles.includes(id)) {
      setSelectedEquipment(prev => ({ ...prev, [id]: "all" }));

      const muscle = muscleGroups.find(m => m.id === id);
      if (muscle) {
        await fetchExercises(muscle, (fetchedExercises) => {
          if (supabase && fetchedExercises) {
            supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string } } | null } }) => {
              if (data.session?.user) {
                fetchRecentExercises(id, data.session.user.id, fetchedExercises);
              }
            });
          }
        });
      }
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
    const customGroup = customExercises[muscleId] || [];
    const allExercises = [...muscleExercises, ...customGroup];
    const equipment = selectedEquipment[muscleId] || "all";
    const search = searchQueries[muscleId] || "";
    const recent = recentExercises[muscleId] || [];

    let filtered = equipment === "all"
      ? allExercises
      : equipment === "personalizados"
        ? allExercises.filter(ex => ex.id.startsWith("custom_"))
        : allExercises.filter(ex =>
            ex.equipmentCategory === equipment ||
            (ex.id.startsWith("custom_") && ex.equipment === equipment)
          );

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(lowerSearch)
      );
    }

    const recentIds = new Set(recent.map(r => r.id));
    const filteredWithoutRecent = filtered.filter(ex => !recentIds.has(ex.id));

    const sortedRecent = recent.filter(ex => {
      return filtered.some(f => f.id === ex.id);
    });

    return [...sortedRecent, ...filteredWithoutRecent].sort((a, b) => {
      const aIsRecent = recentIds.has(a.id);
      const bIsRecent = recentIds.has(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
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
        const customGroup = customExercises[muscleId] || [];
        const exerciseData = muscleExercises.find(e => e.id === exerciseId) || customGroup.find(e => e.id === exerciseId);
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
            imageUrl: exerciseData.imageUrl || undefined,
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

  const handleSelectTemplate = async (template: WorkoutTemplate) => {
    const exerciseList: ResumenEjercicio[] = template.exercises.map(ex => ({
      id: ex.exerciseId,
      uuid: "",
      nombre: ex.name,
      description: "",
      equipment: ex.equipment,
      sets: Array.from({ length: Math.max(ex.sets, 1) }, () => ({ reps: 0, peso: 0 })),
    }));
    setResumen(exerciseList);
    setShowTemplateSelector(false);
    setStep("summary");

    const allExercises: Record<string, WgerExercise[]> = {};
    const loadPromises = muscleGroups.map(mg =>
      new Promise<void>((resolve) => {
        fetchExercises(mg, (fetched) => {
          allExercises[mg.id] = fetched;
          resolve();
        });
      })
    );
    await Promise.all(loadPromises);

    const muscleIds = new Set<string>();
    const selectedExByMuscle: Record<string, string[]> = {};

    for (const ex of template.exercises) {
      let found = false;
      for (const [muscleId, muscleExs] of Object.entries(allExercises)) {
        if (muscleExs.some(e => e.id === ex.exerciseId || e.uuid === ex.exerciseId)) {
          muscleIds.add(muscleId);
          if (!selectedExByMuscle[muscleId]) selectedExByMuscle[muscleId] = [];
          selectedExByMuscle[muscleId].push(ex.exerciseId);
          found = true;
          break;
        }
      }
      if (!found) {
        for (const [muscleId, customExs] of Object.entries(customExercises)) {
          if (customExs.some(e => e.id === ex.exerciseId)) {
            muscleIds.add(muscleId);
            if (!selectedExByMuscle[muscleId]) selectedExByMuscle[muscleId] = [];
            selectedExByMuscle[muscleId].push(ex.exerciseId);
            break;
          }
        }
      }
    }

    if (muscleIds.size > 0) {
      setSelectedMuscles(Array.from(muscleIds));
      setSelectedExercises(selectedExByMuscle);
    }
  };

  const handleDeleteCustomExercise = async (exerciseId: string) => {
    if (deletingCustomId) return;
    setDeletingCustomId(exerciseId);
    const uuid = exerciseId.replace("custom_", "");
    try {
      await service.deleteCustomExercise(uuid);
      await loadCustomExercises();
    } catch {
    } finally {
      setDeletingCustomId(null);
    }
  };

  const handleGuardarYEjecutar = async () => {
    if (!supabase) return;

    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    console.log("[handleGuardarYEjecutar] session:", session?.user?.id);
    if (!session?.user) {
      console.log("[handleGuardarYEjecutar] no session, showing modal");
      setError("Debes iniciar sesión para guardar el entrenamiento");
      sessionStorage.setItem("pending_workout_summary", JSON.stringify(resumen));
      setSaving(false);
      openRegisterModal();
      return;
    }

    try {

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
          is_completed: false,
          image_url: ej.imageUrl || null,
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
      <div className="min-h-screen bg-background text-white">
        <UserHeader showBack backHref="/" />

        <main className="pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                RESUMEN DE <span className="text-accent">ENTRENAMIENTO</span>
              </h1>
              <p className="text-muted-foreground">
                Configura el número de series por ejercicio
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {resumen.map((ej) => (
                <div key={ej.id} className="bg-card rounded-xl p-4 border border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{ej.nombre}</h3>
                      <p className="text-sm text-icon mt-1 line-clamp-2">{ej.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => eliminarSet(ej.id, ej.sets.length - 1)}
                        disabled={ej.sets.length <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border text-icon hover:text-red-500 hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span className="block font-bold text-lg">{ej.sets.length}</span>
                        <span className="text-xs text-icon">series</span>
                      </div>
                      <button
                        onClick={() => agregarSet(ej.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border border text-icon hover:text-accent hover:border-accent cursor-pointer"
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
                className="flex items-center justify-center gap-3 w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
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
                className="flex items-center justify-center gap-2 w-full py-3 border border text-muted-foreground hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a ejercicios
              </button>
            </div>
          </div>
        </main>
        <RegisterModal
          key={`register-modal-${registerModalKey}`}
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onLoginSuccess={() => {
            setError(null);
            handleGuardarYEjecutar();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <UserHeader showBack backHref="/" />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {step === "muscles" ? (
                <>¿QUE VAS A <span className="text-accent">ENTRENAR</span> HOY?</>
              ) : (
                <>ELIGE TUS <span className="text-accent">EJERCICIOS</span></>
              )}
            </h1>
            <p className="text-muted-foreground">
              {step === "muscles"
                ? "Selecciona los grupos musculares que vas a trabajar"
                : "Selecciona los ejercicios para cada grupo"
              }
            </p>
            {step === "exercises" && (
              <button
                onClick={() => setStep("muscles")}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-muted hover:bg-zinc-700 text-muted-foreground hover:text-white rounded-lg transition-colors cursor-pointer"
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
                        ? "bg-accent border-accent text-black scale-105"
                        : "bg-card border hover:border-accent/50 hover:bg-muted"
                      }
                    `}
                  >
                    {selectedMuscles.includes(muscle.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-accent" />
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
                    <p className={`text-xs mt-2 ${selectedMuscles.includes(muscle.id) ? "text-black/70" : "text-muted-foreground"}`}>
                      {muscle.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="group flex items-center justify-center gap-2 font-bold px-6 py-3 mb-4 border border hover:border-accent text-muted-foreground hover:text-white rounded-xl transition-all cursor-pointer mx-auto"
                >
                  <Bookmark className="w-4 h-4" />
                  CARGAR RUTINA GUARDADA
                </button>

                <button
                  onClick={() => {
                    setStep("exercises");
                    setCurrentMuscleIndex(0);
                  }}
                  disabled={selectedMuscles.length === 0}
                  className={`
                    group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all cursor-pointer
                    ${selectedMuscles.length > 0
                      ? "bg-accent hover:bg-accent-hover text-black hover:scale-105"
                      : "bg-zinc-700 text-icon cursor-not-allowed"
                    }
                  `}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Dumbbell className="w-5 h-5" />
                  ELEGIR EJERCICIOS
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {selectedMuscles.length === 0 && (
                  <p className="text-icon mt-4 text-sm">
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
                  const recent = recentExercises[muscleId] || [];

                  return (
                    <div key={muscleId} className="bg-card rounded-2xl p-6 border border flex flex-col max-h-[calc(100vh-280px)]">
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
                          <h3 className="font-bold text-xl text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                            {muscle?.name}
                          </h3>
                          <span className="text-sm text-icon ml-auto">
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
                                  ? "bg-accent text-black"
                                  : "bg-muted text-muted-foreground hover:bg-zinc-700"
                                }
                              `}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => { setShowCreateCustomExercise(true); }}
                          className="flex items-center gap-2 text-sm text-icon hover:text-accent transition-colors mb-4 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Nuevo ejercicio
                        </button>

                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                          <input
                            type="text"
                            placeholder="Buscar ejercicio..."
                            value={searchQueries[muscleId] || ""}
                            onChange={(e) => handleSearchChange(muscleId, e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-background border border rounded-xl text-sm text-white placeholder:text-icon focus:outline-none focus:border-accent/50 transition-colors"
                          />
                          {searchQueries[muscleId] && (
                            <button
                              onClick={() => handleSearchChange(muscleId, "")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-icon hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600">
                        <div className="space-y-3">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-accent" />
                              <span className="ml-2 text-icon">Cargando ejercicios...</span>
                            </div>
                          ) : filteredExercises.length > 0 ? (
                            (() => {
                              const customExs = filteredExercises.filter(e => e.id.startsWith("custom_"));
                              const wgerExs = filteredExercises.filter(e => !e.id.startsWith("custom_"));
                              const showRecent = recent.length > 0 && !searchQueries[muscleId];

                              return showRecent ? (
                                <>
                                  <div className="sticky -top-2 z-10 pt-2">
                                    <div className="text-xs text-accent font-bold mb-2 uppercase tracking-wider bg-card py-2">
                                      Recientes
                                    </div>
                                  </div>
                                  {recent.map((recentEx) => {
                                    const fullExercise = wgerExs.find(e => e.id === recentEx.id);
                                    if (!fullExercise) return null;
                                    return (
                                      <ExerciseCard
                                        key={`recent-${fullExercise.id}`}
                                        exercise={fullExercise}
                                        selected={isExerciseSelected(muscleId, fullExercise.id)}
                                        onSelect={() => toggleExercise(muscleId, fullExercise.id)}
                                        onImageClick={handleImageClick}
                                        lastWeight={recentEx.lastWeight}
                                      />
                                    );
                                  })}

                                  {customExs.length > 0 && (
                                    <>
                                      <div className="sticky top-0 z-10 pt-2">
                                        <div className="text-xs text-accent font-bold mb-2 uppercase tracking-wider bg-card py-2">
                                          Personalizados
                                        </div>
                                      </div>
                                      {customExs.map((exercise) => {
                                        const isDeletingCustom = deletingCustomId === exercise.id;
                                        return (
                                          <div key={`custom-${exercise.id}`} className="relative group">
                                            <ExerciseCard
                                              exercise={exercise}
                                              selected={isExerciseSelected(muscleId, exercise.id)}
                                              onSelect={() => { if (!deletingCustomId) toggleExercise(muscleId, exercise.id); }}
                                              onImageClick={handleImageClick}
                                            />
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleDeleteCustomExercise(exercise.id); }}
                                              disabled={!!deletingCustomId}
                                              className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-500 rounded-lg opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                              title="Eliminar ejercicio"
                                            >
                                              {isDeletingCustom ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </>
                                  )}

                                  {wgerExs.length > recent.length && (
                                    <>
                                      <div className="sticky top-0 z-10 pt-2">
                                        <div className="text-xs text-icon font-medium mb-2 uppercase tracking-wider bg-card py-2">
                                          Todos los ejercicios
                                        </div>
                                      </div>
                                      {wgerExs.slice(recent.length).map((exercise) => (
                                        <ExerciseCard
                                          key={`normal-${exercise.id}`}
                                          exercise={exercise}
                                          selected={isExerciseSelected(muscleId, exercise.id)}
                                          onSelect={() => toggleExercise(muscleId, exercise.id)}
                                          onImageClick={handleImageClick}
                                        />
                                      ))}
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-icon font-medium mb-2 uppercase tracking-wider">
                                    {searchQueries[muscleId] ? "Resultados" : "Ejercicios"}
                                  </div>
                                  {filteredExercises.map((exercise) => (
                                    <ExerciseCard
                                      key={exercise.id}
                                      exercise={exercise}
                                      selected={isExerciseSelected(muscleId, exercise.id)}
                                      onSelect={() => toggleExercise(muscleId, exercise.id)}
                                      onImageClick={handleImageClick}
                                    />
                                  ))}
                                </>
                              );
                            })()
                          ) : (
                            <div className="text-center py-8 text-icon">
                              {searchQueries[muscleId]
                                ? `No se encontraron ejercicios para "${searchQueries[muscleId]}"`
                                : currentEquipment === "personalizados"
                                  ? "No has creado ejercicios personalizados"
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
                      ? "bg-muted text-zinc-600 cursor-not-allowed"
                      : "bg-muted hover:bg-zinc-700 text-white"
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
                            ? "bg-accent scale-125"
                            : hasSelected
                              ? "bg-accent/50 hover:bg-accent"
                              : "bg-zinc-700 hover:bg-zinc-600"
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
                      ? "bg-muted text-zinc-600 cursor-not-allowed"
                      : "bg-accent hover:bg-accent-hover text-black"
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
                <div className="mb-4 text-muted-foreground">
                  {Object.values(selectedExercises).flat().length} ejercicios seleccionados
                </div>
                <button
                  onClick={handleConfirmar}
                  disabled={Object.values(selectedExercises).flat().length === 0}
                  className={`
                    group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all cursor-pointer
                    ${Object.values(selectedExercises).flat().length > 0
                      ? "bg-accent hover:bg-accent-hover text-black hover:scale-105"
                      : "bg-zinc-700 text-icon cursor-not-allowed"
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

      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {showCreateCustomExercise && (
        <CreateCustomExerciseModal
          preselectedMuscle={step === "exercises" ? selectedMuscles[currentMuscleIndex] : undefined}
          onClose={() => setShowCreateCustomExercise(false)}
          onCreated={() => {
            loadCustomExercises();
          }}
        />
      )}

    </div>
  );
}
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import type { Session } from "@supabase/supabase-js";
import type { WgerExercise } from "@/app/components/EjercicioCard";
import * as service from "@/lib/workout/service";
import { muscleGroupsData, MuscleGroup } from "@/lib/data/ejercicios";
import { isCardioExercise, isExcludedCardio, getDefaultCardioSets } from "@/lib/data/cardio";
import type { WorkoutTemplate } from "@/lib/workout/types";

const DEFAULT_SETS = 3;

export interface ResumenEjercicio {
  id: string;
  uuid: string;
  nombre: string;
  description: string;
  equipment: string;
  imageUrl?: string;
  is_cardio?: boolean;
  distance_km?: number;
  duration_minutes?: number;
  muscleGroup?: string;
  sets: { reps: number; peso: number }[];
}

export interface WizardState {
  step: "muscles" | "exercises" | "summary" | "saving";
  selectedMuscles: string[];
  currentMuscleIndex: number;
  selectedExercises: Record<string, string[]>;
  exercises: Record<string, WgerExercise[]>;
  customExercises: Record<string, WgerExercise[]>;
  recentExercises: Record<string, (WgerExercise & { lastWeight: number })[]>;
  loadingExercises: Record<string, boolean>;
  selectedEquipment: Record<string, string>;
  searchQueries: Record<string, string>;
  resumen: ResumenEjercicio[];
  saving: boolean;
  error: string | null;
  modalImage: { url: string; description: string } | null;
  showRegisterModal: boolean;
  registerModalKey: number;
  showTemplateSelector: boolean;
  showCreateCustomExercise: boolean;
  showIntroVideo: boolean;
  deletingCustomId: string | null;
}

export interface WizardActions {
  supabase: ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null;
  toggleMuscle: (id: string) => Promise<void>;
  toggleExercise: (muscleId: string, exerciseId: string) => void;
  handleSearchChange: (muscleId: string, value: string) => void;
  handleImageClick: (url: string, description?: string) => void;
  closeModalImage: () => void;
  setSelectedEquipment: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  setCurrentMuscleIndex: (index: number) => void;
  handleConfirmar: () => void;
  handleGuardarYEjecutar: () => void;
  handleSelectTemplate: (template: WorkoutTemplate) => Promise<void>;
  handleDeleteCustomExercise: (exerciseId: string) => Promise<void>;
  agregarSet: (ejercicioId: string) => void;
  eliminarSet: (ejercicioId: string, setIndex: number) => void;
  getFilteredExercises: (muscleId: string) => WgerExercise[];
  isExerciseSelected: (muscleId: string, exerciseId: string) => boolean;
  setShowTemplateSelector: (show: boolean) => void;
  setShowCreateCustomExercise: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
  setStep: (step: "muscles" | "exercises" | "summary") => void;
  openRegisterModal: () => void;
  setError: (error: string | null) => void;
  guardarYRedirigir: () => Promise<void>;
  handleVideoComplete: () => void;
  refreshCustomExercises: () => Promise<void>;
}

export function useWorkoutWizard() {
  const router = useRouter();
  const { t } = useLanguage();
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
  const [modalImage, setModalImage] = useState<{ url: string; description: string } | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerModalKey, setRegisterModalKey] = useState(0);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCreateCustomExercise, setShowCreateCustomExercise] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const pendingWorkoutId = useRef<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<Record<string, WgerExercise[]>>({});
  const [recentExercises, setRecentExercises] = useState<Record<string, (WgerExercise & { lastWeight: number })[]>>({});

  const openRegisterModal = useCallback(() => {
    setShowRegisterModal(true);
    setRegisterModalKey(prev => prev + 1);
  }, []);

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

  const loadCustomExercises = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const response = await fetch("/api/custom-exercises");
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;
      const grouped: Record<string, WgerExercise[]> = {};
      for (const ex of data) {
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
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    loadCustomExercises();
  }, [supabase, loadCustomExercises]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/videos/comencemos.mp4";
    link.as = "video";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

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
    return () => { subscription.unsubscribe(); };
  }, [supabase]);

  const fetchExercises = useCallback(async (muscleGroup: MuscleGroup, onComplete?: (exercises: WgerExercise[]) => void) => {
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
        setExercises(prev => ({ ...prev, [muscleGroup.id]: fetchedData }));
        if (onComplete) onComplete(fetchedData);
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
      if (onComplete) onComplete([]);
    } finally {
      setLoadingExercises(prev => ({ ...prev, [muscleGroup.id]: false }));
    }
  }, [exercises]);

  const fetchRecentExercises = useCallback(async (muscleGroupId: string, userId: string, muscleExercises: WgerExercise[]) => {
    if (!supabase) return;
    if (recentExercises[muscleGroupId]?.length > 0) return;
    try {
      const { data: workouts, error: workoutsError } = await supabase
        .from("workouts").select("id").eq("user_id", userId);
      if (workoutsError) throw workoutsError;
      if (!workouts || workouts.length === 0) return;
      const workoutIds = workouts.map((w: { id: string }) => w.id);
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_id, exercise_name, completed_at, weight_kg")
        .in("workout_id", workoutIds)
        .order("completed_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      if (!data || data.length === 0) return;
      const exerciseCounts: Record<string, { count: number; lastUsed: string; name: string; lastWeight: number }> = {};
      data.forEach((set: { exercise_id: string; exercise_name: string; completed_at?: string; weight_kg?: number }) => {
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
      const recentMatches = sorted
        .map(s => {
          const exercise = muscleExercises.find(e => e.id === s.id || e.uuid === s.id);
          return exercise ? { ...exercise, lastWeight: s.lastWeight } : null;
        })
        .filter(Boolean) as (WgerExercise & { lastWeight: number })[];
      setRecentExercises(prev => ({ ...prev, [muscleGroupId]: recentMatches }));
    } catch (err) {
      console.error("Error fetching recent exercises:", err);
    }
  }, [supabase, recentExercises]);

  const toggleMuscle = useCallback(async (id: string) => {
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
            supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
              if (result.data?.session?.user) {
                fetchRecentExercises(id, result.data.session.user.id, fetchedExercises);
              }
            });
          }
        });
      }
    }
  }, [selectedMuscles, muscleGroups, fetchExercises, supabase, fetchRecentExercises]);

  const toggleExercise = useCallback((muscleId: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const current = prev[muscleId] || [];
      const updated = current.includes(exerciseId)
        ? current.filter(e => e !== exerciseId)
        : [...current, exerciseId];
      return { ...prev, [muscleId]: updated };
    });
  }, []);

  const getFilteredExercises = useCallback((muscleId: string): WgerExercise[] => {
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
      const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch)
      );
    }

    const recentIds = new Set(recent.map(r => r.id));
    let filteredWithoutRecent = filtered.filter(ex => !recentIds.has(ex.id));
    filteredWithoutRecent = filteredWithoutRecent.filter(ex => !isExcludedCardio(ex.id));
    const sortedRecent = recent.filter(ex => filtered.some(f => f.id === ex.id))
      .filter(ex => !isExcludedCardio(ex.id));

    return [...sortedRecent, ...filteredWithoutRecent].sort((a, b) => {
      const aIsRecent = recentIds.has(a.id);
      const bIsRecent = recentIds.has(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (a.imageUrl && !b.imageUrl) return -1;
      if (!a.imageUrl && b.imageUrl) return 1;
      return 0;
    });
  }, [exercises, customExercises, selectedEquipment, searchQueries, recentExercises]);

  const handleSearchChange = useCallback((muscleId: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [muscleId]: value }));
  }, []);

  const handleImageClick = useCallback((imageUrl: string, description?: string) => {
    setModalImage({ url: imageUrl, description: description || "" });
  }, []);

  const closeModalImage = useCallback(() => {
    setModalImage(null);
  }, []);

  const isExerciseSelected = useCallback((muscleId: string, exerciseId: string): boolean => {
    return (selectedExercises[muscleId] || []).includes(exerciseId);
  }, [selectedExercises]);

  const getSelectedExercisesList = useCallback((): ResumenEjercicio[] => {
    const exerciseList: ResumenEjercicio[] = [];
    Object.entries(selectedExercises).forEach(([muscleId, exerciseIds]) => {
      exerciseIds.forEach(exerciseId => {
        const muscleExercises = exercises[muscleId] || [];
        const customGroup = customExercises[muscleId] || [];
        const exerciseData = muscleExercises.find(e => e.id === exerciseId) || customGroup.find(e => e.id === exerciseId);
        if (exerciseData) {
          const isCardio = isCardioExercise(exerciseData.id);
          const setsCount = isCardio ? getDefaultCardioSets(exerciseData.id) : DEFAULT_SETS;
          const defaultSets = Array.from({ length: setsCount }, () => ({ reps: 0, peso: 0 }));
          exerciseList.push({
            id: exerciseData.id,
            uuid: exerciseData.uuid,
            nombre: exerciseData.name,
            description: exerciseData.description,
            equipment: exerciseData.equipment,
            imageUrl: exerciseData.imageUrl || undefined,
            is_cardio: isCardio || undefined,
            distance_km: isCardio ? 0 : undefined,
            duration_minutes: isCardio ? 0 : undefined,
            muscleGroup: muscleId,
            sets: isCardio ? [] : defaultSets,
          });
        }
      });
    });
    return exerciseList;
  }, [selectedExercises, exercises, customExercises]);

  const agregarSet = useCallback((ejercicioId: string) => {
    setResumen(prev => prev.map(ej => {
      if (ej.id === ejercicioId) {
        return { ...ej, sets: [...ej.sets, { reps: 0, peso: 0 }] };
      }
      return ej;
    }));
  }, []);

  const eliminarSet = useCallback((ejercicioId: string, setIndex: number) => {
    setResumen(prev => prev.map(ej => {
      if (ej.id === ejercicioId && ej.sets.length > 1) {
        return { ...ej, sets: ej.sets.filter((_, i) => i !== setIndex) };
      }
      return ej;
    }));
  }, []);

  const handleConfirmar = useCallback(() => {
    const exList = getSelectedExercisesList();
    setResumen(exList);
    setStep("summary");
  }, [getSelectedExercisesList]);

  const handleSelectTemplate = useCallback(async (template: WorkoutTemplate) => {
    const exerciseList: ResumenEjercicio[] = template.exercises.map(ex => {
      const isCardio = isCardioExercise(ex.exerciseId);
      return {
        id: ex.exerciseId,
        uuid: "",
        nombre: ex.name,
        description: "",
        equipment: ex.equipment,
        is_cardio: isCardio || undefined,
        distance_km: isCardio ? 0 : undefined,
        duration_minutes: isCardio ? 0 : undefined,
        sets: isCardio ? [] : Array.from({ length: Math.max(ex.sets, 1) }, () => ({ reps: 0, peso: 0 })),
      };
    });
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
    const exerciseMuscleMap = new Map<string, string>();

    for (const ex of template.exercises) {
      let found = false;
      for (const [muscleId, muscleExs] of Object.entries(allExercises)) {
        if (muscleExs.some(e => e.id === ex.exerciseId || e.uuid === ex.exerciseId)) {
          muscleIds.add(muscleId);
          if (!selectedExByMuscle[muscleId]) selectedExByMuscle[muscleId] = [];
          selectedExByMuscle[muscleId].push(ex.exerciseId);
          exerciseMuscleMap.set(ex.exerciseId, muscleId);
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
            exerciseMuscleMap.set(ex.exerciseId, muscleId);
            break;
          }
        }
      }
    }

    setResumen(prev => prev.map(ej => ({
      ...ej,
      muscleGroup: exerciseMuscleMap.get(ej.id) || ej.muscleGroup,
    })));

    if (muscleIds.size > 0) {
      setSelectedMuscles(Array.from(muscleIds));
      setSelectedExercises(selectedExByMuscle);
    }
  }, [muscleGroups, fetchExercises, customExercises]);

  const handleDeleteCustomExercise = useCallback(async (exerciseId: string) => {
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
  }, [deletingCustomId, loadCustomExercises]);

  const guardarYRedirigir = useCallback(async () => {
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError(t("train.loginRequired"));
      sessionStorage.setItem("pending_workout_summary", JSON.stringify(resumen));
      setSaving(false);
      openRegisterModal();
      return;
    }
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const { data: workout, error: workoutError } = await supabase
        .from("workouts").insert({ user_id: session.user.id, date: fecha, status: "pendiente" }).select().single();
      if (workoutError) throw workoutError;
      const setsToInsert: Array<Record<string, unknown>> = [];
      resumen.forEach((ej, ejIndex) => {
        if (ej.is_cardio) {
          setsToInsert.push({
            workout_id: workout.id, exercise_id: ej.id, exercise_name: ej.nombre,
            set_number: 1, reps: null, weight_kg: null, is_cardio: true,
            distance_km: ej.distance_km ?? 0, duration_minutes: ej.duration_minutes ?? 0,
            is_completed: false, image_url: ej.imageUrl || null,
            description: ej.description || null,
            exercise_order: ejIndex, muscle_group: ej.muscleGroup || null,
          });
        } else {
          ej.sets.forEach((_, index) => {
            setsToInsert.push({
              workout_id: workout.id, exercise_id: ej.id, exercise_name: ej.nombre,
              set_number: index + 1, reps: 0, weight_kg: 0, is_cardio: false,
              is_completed: false, image_url: ej.imageUrl || null,
              description: ej.description || null,
              exercise_order: ejIndex, muscle_group: ej.muscleGroup || null,
            });
          });
        }
      });
      const { error: setsError } = await supabase.from("workout_sets").insert(setsToInsert);
      if (setsError) throw setsError;
      setSaving(false);
      pendingWorkoutId.current = workout.id;
      setShowIntroVideo(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("train.saveError");
      setError(errorMessage);
      setSaving(false);
    }
  }, [supabase, t, resumen, openRegisterModal]);

  const handleVideoComplete = useCallback(() => {
    if (pendingWorkoutId.current) {
      router.replace(`/workout/${pendingWorkoutId.current}`);
    }
  }, [router]);

  return {
    state: {
      step, selectedMuscles, currentMuscleIndex, selectedExercises,
      exercises, customExercises, recentExercises, loadingExercises,
      selectedEquipment, searchQueries, resumen, saving, error,
      modalImage, showRegisterModal, registerModalKey,
      showTemplateSelector, showCreateCustomExercise, showIntroVideo,
      deletingCustomId, muscleGroups,
    } as WizardState & { muscleGroups: MuscleGroup[] },
    actions: {
      supabase, toggleMuscle, toggleExercise, handleSearchChange,
      handleImageClick, closeModalImage,
      setSelectedEquipment,
      setCurrentMuscleIndex,
      handleConfirmar, handleGuardarYEjecutar: () => guardarYRedirigir(),
      handleSelectTemplate, handleDeleteCustomExercise,
      agregarSet, eliminarSet, getFilteredExercises, isExerciseSelected,
      setShowTemplateSelector, setShowCreateCustomExercise, setShowRegisterModal, setStep: (s: "muscles" | "exercises" | "summary") => setStep(s),
      openRegisterModal, setError, guardarYRedirigir, handleVideoComplete, refreshCustomExercises: loadCustomExercises,
    } as WizardActions,
  };
}

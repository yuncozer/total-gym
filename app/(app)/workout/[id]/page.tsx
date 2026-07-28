"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Plus,
  Play,
  Loader2,
  CheckCircle2,
  Target,
  Flame,
  Share2,
  History,
  Save,
  Bookmark,
  Trash2,
  X,
  ZoomIn,
  XCircle,
  FileText,
  ImageOff,
  Image as ImageIcon,
  Camera,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { MotivationalModal } from "@/app/components/MotivationalModal";
import { WorkoutProvider, useWorkout } from "@/lib/workout";
import * as service from "@/lib/workout/service";
import type { ExerciseInWorkout } from "@/lib/workout/types";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { WorkoutPhotoOverlay } from "@/app/components/WorkoutPhotoOverlay";
import { ShareSheet } from "@/app/components/ShareSheet";
import { SaveTemplateModal } from "@/app/components/SaveTemplateModal";
import { AddExerciseModal } from "@/app/components/AddExerciseModal";
import { ImageModal } from "@/app/components/EjercicioCard";
import { ReferenceSheet } from "@/app/components/ReferenceSheet";
import { TimerCircle } from "@/app/components/TimerCircle";
import { PRCelebration } from "@/app/components/PRCelebration";
import { DraggableExerciseList, GripVertical } from "@/app/components/DraggableExerciseList";
import { getDailyQuote } from "@/lib/data/quote";
import { getCardioGroup, CardioGroup } from "@/lib/data/cardio";
import type { NewExerciseDef } from "@/lib/workout/service";
import { useLanguage } from "@/lib/i18n";
import { muscleGroupsData } from "@/lib/data/ejercicios";
import { createClient } from "@/lib/supabase/client";

function WorkoutContent({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const workout = useWorkout();

  const MOTIVATIONAL_PHRASES = [
    t("workout.phrase.excellent"),
    t("workout.phrase.achieving"),
    t("workout.phrase.keepGoing"),
    t("workout.phrase.unstoppable"),
    t("workout.phrase.veryGood"),
    t("workout.phrase.greatEffort"),
    t("workout.phrase.strong"),
    t("workout.phrase.keepMoving"),
    t("workout.phrase.goodPace"),
    t("workout.phrase.dontStop"),
  ];

  const COMPLETED_PHRASES = [
    t("workout.phrase.veryNice"),
    t("workout.phrase.goodJob"),
    t("workout.phrase.wellDone"),
    t("workout.phrase.perfect"),
    t("workout.phrase.incredible"),
    t("workout.phrase.great"),
    t("workout.phrase.fantastic"),
    t("workout.phrase.amazing"),
  ];

  const getRandomPhrase = (phrases: string[]) => {
    const index = phraseSeed % phrases.length;
    return phrases[index];
  };

  const {
    loading,
    saving,
    exercises,
    selectedExercise,
    currentSetIndex,
    setCurrentSetIndex,
    isWorkoutComplete,
    pendingCompletion,
    confirmWorkoutCompletion,
    dismissPendingCompletion,
    isExerciseComplete,
    isLastSet,
    showExtraSetButton,
    timer,
    setTimer,
    canCompleteSet,
    progress,
    progressPercentage,
    selectExercise,
    deselectExercise,
    goToSet,
    updateSet,
    completeSet,
    undoSetComplete,
    addExtraSet,
    setAsLastSet,
    getSetsCompletados,
    getTotalSets,
    isExerciseCompleted,
    getLastWeight,
    getLastCardio,
    removeExercise,
    addExercises,
    reorderExercises,
  } = workout;

  const [phraseSeed, setPhraseSeed] = useState(0);
  const lastCompletedRef = useRef<string>("");
  const extraSetIndexRef = useRef<number | null>(null);
  const [deleteConfirmExercise, setDeleteConfirmExercise] = useState<ExerciseInWorkout | null>(null);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [showMotivationalModal, setShowMotivationalModal] = useState(false);
  const [modalPhrase, setModalPhrase] = useState("");
  const [modalSubPhrase, setModalSubPhrase] = useState("");
  const [pendingAction, setPendingAction] = useState<"completeSet" | "addExtraSet" | null>(null);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [listImageModal, setListImageModal] = useState<{ url: string; name: string; description?: string; gallery?: { imageUrl: string; name: string; description?: string }[]; index?: number } | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [prCelebration, setPrCelebration] = useState<{
    exerciseName: string;
    weight: number;
    reps: number;
  } | null>(null);
  const [redirectHome, setRedirectHome] = useState(false);
  const [workoutPhotos, setWorkoutPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<{ url: string; index: number } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profileWeightKg, setProfileWeightKg] = useState<number | null>(null);
  const [showProfileWeightModal, setShowProfileWeightModal] = useState(false);
  const [profileWeightInput, setProfileWeightInput] = useState("");
  const [weightInputText, setWeightInputText] = useState<string | null>(null);
  const currentSetKey = selectedExercise ? `${selectedExercise.exerciseId}-${currentSetIndex}` : null;
  const prevSetKeyRef = useRef<string | null>(currentSetKey);
  if (prevSetKeyRef.current !== currentSetKey) {
    prevSetKeyRef.current = currentSetKey;
    if (weightInputText !== null) setWeightInputText(null);
  }

  useEffect(() => {
    if (!selectedExercise) return;
    const set = selectedExercise.sets[currentSetIndex];
    const setKey = `${selectedExercise.exerciseId}-${currentSetIndex}`;
    if (set?.is_completed && lastCompletedRef.current !== setKey) {
      lastCompletedRef.current = setKey;
      setPhraseSeed(prev => prev + 1);
    }
  }, [selectedExercise, currentSetIndex]);

  useEffect(() => {
    if (selectedExercise) {
      document.documentElement.classList.add("workout-mode");
    } else {
      document.documentElement.classList.remove("workout-mode");
    }
    return () => document.documentElement.classList.remove("workout-mode");
  }, [selectedExercise]);

  useEffect(() => {
    if (redirectHome) {
      router.push("/");
    }
  }, [redirectHome, router]);

  useEffect(() => {
    if (!isWorkoutComplete) return;
    service.getWorkoutPhotos(workoutId).then(photos => {
      setWorkoutPhotos(photos.map(p => ({ id: p.id, url: p.url })));
    }).catch(() => {});
  }, [isWorkoutComplete, workoutId]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("profiles").select("weight_kg").eq("id", session.user.id).maybeSingle();
      setProfileWeightKg(data?.weight_kg ?? null);
    })();
  }, []);

const handleCompleteSet = () => {
    if (!selectedExercise || !canCompleteSet) return;
    
    setPendingAction("completeSet");
    setModalPhrase(getRandomPhrase(COMPLETED_PHRASES));
    setModalSubPhrase(getRandomPhrase(MOTIVATIONAL_PHRASES));
    setShowMotivationalModal(true);
  };

  const handleAddExtraSet = () => {
    if (!selectedExercise) return;
    setPendingAction("addExtraSet");
    setModalPhrase(getRandomPhrase(COMPLETED_PHRASES));
    setModalSubPhrase(getRandomPhrase(MOTIVATIONAL_PHRASES));
    setShowMotivationalModal(true);
  };

  const handleMotivationalComplete = () => {
    setShowMotivationalModal(false);

    if (pendingAction === "addExtraSet" && selectedExercise) {
      const originalSetsCount = selectedExercise.sets.length;
      addExtraSet();
      extraSetIndexRef.current = originalSetsCount;
    } else if (pendingAction === "completeSet") {
      if (navigator.vibrate) navigator.vibrate(15);

      const set = selectedExercise?.sets[currentSetIndex];
      const weight = set?.weight_kg ?? 0;
      const reps = set?.reps ?? 0;
      const lastWeight = getLastWeight(selectedExercise?.exerciseId ?? "");

      if (weight > 0 && weight > lastWeight) {
        setPrCelebration({
          exerciseName: selectedExercise?.name ?? "",
          weight,
          reps,
        });
      }

      completeSet();
    }

    setPendingAction(null);
  };

  const handleNextSet = () => {
    setTimer({ segundos: 0, activo: false, descansando: false });
    if (extraSetIndexRef.current !== null) {
      setCurrentSetIndex(extraSetIndexRef.current);
      extraSetIndexRef.current = null;
    } else {
      setCurrentSetIndex(prev => prev + 1);
    }
  };

  const getEquipmentLabel = (equipment: string) => {
    const barraKeywords = ['barbell', 'máquina', 'prensa', 'smith'];
    return barraKeywords.some(k => equipment?.toLowerCase().includes(k))
      ? t("workout.weightBarbell")
      : t("workout.weightPerSide");
  };

  const handleBack = () => {
    deselectExercise();
    const prog = progress;
    if (prog.completed === prog.total && prog.total > 0) {
      router.push("/");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingPhoto) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("workout.photoTooLarge"));
      return;
    }
    setUploadingPhoto(true);
    try {
      const { id, url } = await service.uploadWorkoutPhoto(workoutId, file);
      setWorkoutPhotos(prev => [...prev, { id, url }]);
    } catch {
      toast.error(t("workout.photoError"));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await service.deleteWorkoutPhoto(workoutId, photoId);
      setWorkoutPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch {
      toast.error(t("workout.photoError"));
    }
  };

  const handleSaveProfileWeight = async () => {
    const weight = parseFloat(profileWeightInput);
    if (!weight || weight <= 0) return;
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) return;
    await supabase.from("profiles").update({ weight_kg: weight }).eq("id", session.user.id);
    setProfileWeightKg(weight);
    setShowProfileWeightModal(false);
    updateSet('weight_kg', weight);
    updateSet('is_bodyweight', 1);
  };

  if (loading || isDeletingWorkout) {
    return <LoadingScreen />;
  }

  if (exercises.length === 0 && !loading) {
    if (!redirectHome) setRedirectHome(true);
    return null;
  }

  if (pendingCompletion) {
    return (
      <div className="min-h-screen bg-background text-white">
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111113] border border rounded-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                {t("workout.pendingTitle")}
              </h2>
              <p className="text-sm text-icon">{t("workout.pendingMsg")}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { dismissPendingCompletion(); setShowAddExercise(true); }}
                className="flex-1 py-3 rounded-xl border border-accent/30 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {t("workout.pendingAdd")}
              </button>
              <button
                onClick={confirmWorkoutCompletion}
                className="flex-1 py-3 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent-hover transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {t("workout.pendingFinish")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isWorkoutComplete) {
    const quote = getDailyQuote();
    return (
      <div className="min-h-screen bg-background text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card opacity-90" />
                <main className="relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("workout.completedTitle").split(' ')[0]} <span className="text-green-500">{t("workout.completedTitle").split(' ')[1]}</span>
            </h1>
            <p className="text-muted-foreground mb-6">{t("workout.completedMsg")}</p>
            <div className="mb-6">
              <input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value.slice(0, 40))}
                placeholder={t("workout.namePlaceholder")}
                maxLength={40}
                className="w-full px-4 py-3 bg-card border border rounded-xl text-white text-center text-lg placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-colors"
              />
              <p className="text-xs text-zinc-600 mt-1 text-right">{workoutName.length}/40</p>
            </div>
            <div className="bg-card/80 border border rounded-2xl p-6 mb-8">
              <Flame className="w-8 h-8 text-accent mx-auto mb-4" />
              <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-rajdhani)" }}>&ldquo;{quote}&rdquo;</p>
            </div>
            <div className="bg-card rounded-xl p-4 mb-6">
              <span className="text-sm text-icon">{t("workout.seriesCount")} </span>
              <span className="text-sm font-bold text-green-500">{progress.completed}/{progress.total}</span>
            </div>

            {workoutPhotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                {workoutPhotos.map((photo, i) => (
                  <div key={photo.id} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border group">
                    <button
                      onClick={() => setPhotoViewer({ url: photo.url, index: i })}
                      className="w-full h-full cursor-pointer"
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-500/90 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex flex-col gap-3 mb-4">
              <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); setShowShareSheet(true); }} className="flex items-center justify-center gap-2 w-full py-4 border-2 border-accent/50 hover:border-accent hover:bg-accent/5 cursor-pointer font-bold rounded-xl text-accent transition-all duration-200" style={{ fontFamily: "var(--font-oswald)" }}>
                <Share2 className="w-5 h-5" /> {t("workout.share")}
              </button>
              <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); router.push("/"); }} className="flex items-center justify-center gap-2 w-full py-4 bg-accent hover:bg-accent-hover cursor-pointer text-black font-bold rounded-xl transition-all duration-200" style={{ fontFamily: "var(--font-oswald)" }}>
                <Play className="w-5 h-5" /> {t("workout.goHome")}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto || workoutPhotos.length >= 5}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border border rounded-xl text-icon hover:text-accent hover:border-accent/30 hover:bg-accent/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer relative"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span className="text-[11px] font-medium leading-tight text-center">
                  {uploadingPhoto ? t("workout.photoUploading") : t("workout.addPhoto")}
                </span>
                {workoutPhotos.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {workoutPhotos.length}
                  </span>
                )}
              </button>
              <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); setShowSaveTemplate(true); }} className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border border rounded-xl text-icon hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer">
                <Bookmark className="w-4 h-4" />
                <span className="text-[11px] font-medium leading-tight text-center">{t("workout.saveTemplate")}</span>
              </button>
              <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); router.push("/historial"); }} className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border border rounded-xl text-icon hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer">
                <History className="w-4 h-4" />
                <span className="text-[11px] font-medium leading-tight text-center">{t("workout.viewHistory")}</span>
              </button>
            </div>
          </div>
        </main>

        {photoViewer && (
          <div
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={() => setPhotoViewer(null)}
          >
            <button
              onClick={() => setPhotoViewer(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={photoViewer.url}
              alt=""
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(workoutPhotos[photoViewer.index].id);
                  setPhotoViewer(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {t("workout.photoDelete")}
              </button>
              <span className="text-sm text-icon">
                {photoViewer.index + 1} / {workoutPhotos.length}
              </span>
            </div>
          </div>
        )}

        {showShareSheet && (
          <ShareSheet
            workoutId={workoutId}
            workoutName={workoutName.trim()}
            exercises={exercises}
            onClose={() => setShowShareSheet(false)}
            onRename={(name) => setWorkoutName(name)}
          />
        )}
        {showSaveTemplate && (
          <SaveTemplateModal
            exercises={exercises}
            onClose={() => setShowSaveTemplate(false)}
            onSaved={() => setShowSaveTemplate(false)}
          />
        )}
      </div>
    );
  }

  if (selectedExercise) {
    const set = selectedExercise.sets[currentSetIndex];
    const lastSet = currentSetIndex === selectedExercise.sets.length - 1;
    const isCardio = set?.is_cardio;

    return (
      <div className="min-h-screen bg-background text-white py-8">
                <main className="pb-12 px-4">
          <div className="max-w-md mx-auto">
            <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-white cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" /> {t("workout.back")}
            </button>
            <div className="bg-card rounded-xl p-6 border border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-2xl">{selectedExercise.name}</h2>
                {isCardio ? (
                  <span className="text-sm text-icon">
                    {(set?.distance_km ?? 0) > 0 && `${set.distance_km} km`}
                    {(set?.distance_km ?? 0) > 0 && (set?.duration_minutes ?? 0) > 0 && " · "}
                    {(set?.duration_minutes ?? 0) > 0 && `${set.duration_minutes} min`}
                  </span>
                ) : (
                  <span className="text-sm text-icon">{selectedExercise.sets.length} {t("workout.series")}</span>
                )}
              </div>

              {!isCardio && (
                <div className="space-y-1.5 mb-6">
                  {selectedExercise.sets.map((s, idx) => {
                    const isCurrent = idx === currentSetIndex;
                    const isPast = idx < currentSetIndex || s.is_completed;
                    const isFuture = idx > currentSetIndex && !s.is_completed;
                    if (isCurrent) return null;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSet(idx)}
                        disabled={isFuture}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                          isPast
                            ? "bg-green-500/5 border border-green-500/10 hover:bg-green-500/10"
                            : "bg-muted/30 border border hover:bg-muted/60 opacity-40"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isPast ? "bg-green-500 text-black" : "bg-zinc-700 text-icon"
                        }`}>
                          {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">{t("workout.setLabel")} {idx + 1}</span>
                          {isPast && (
                            <p className="text-xs text-icon truncate">
                              {s.reps || 0} reps × {s.weight_kg || 0} kg
                            </p>
                          )}
                        </div>
                        {isPast && (
                          <span className="text-[10px] text-green-500/60 font-medium">{t("workout.completed")}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col items-center mb-4">
                {selectedExercise.imageUrl ? (
                  <button
                    onClick={() => {
                      const galleryItems = exercises.filter(e => e.imageUrl).map(e => ({
                        imageUrl: e.imageUrl!,
                        name: e.name,
                        description: e.description,
                      }));
                      const idx = galleryItems.findIndex(i => i.imageUrl === selectedExercise.imageUrl);
                      setListImageModal({ url: selectedExercise.imageUrl!, name: selectedExercise.name, description: selectedExercise.description, gallery: galleryItems, index: idx });
                    }}
                    className="relative block rounded-xl border border-accent-tertiary/20 hover:border-accent-tertiary/40 transition-all active:scale-95"
                    title={t("workout.imageView")}
                  >
                    <Image
                      src={selectedExercise.imageUrl}
                      alt={selectedExercise.name}
                      width={120}
                      height={90}
                      className="rounded-xl object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5">
                      <div className="bg-black/60 rounded-full p-1.5 backdrop-blur-sm">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-[120px] h-[90px] bg-zinc-800/50 rounded-xl flex items-center justify-center border border-white/5">
                    <ImageOff className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 max-w-[260px] text-center">
                  <FileText className="w-3 h-3 shrink-0 text-accent-tertiary/60" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                    {selectedExercise.description || "Sin descripción disponible"}
                  </p>
                </div>
              </div>

              {!isCardio && (
                <div className="text-center mb-6">
                  <span className="text-sm text-icon">{t("workout.setLabel")} </span>
                  <span className="text-4xl font-bold text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {currentSetIndex + 1}
                  </span>
                </div>
              )}

              {isCardio ? (
                <div className="space-y-4 mb-4">
                  {getCardioGroup(selectedExercise.exerciseId) === CardioGroup.A && (
                    <div>
                      <label className="block text-sm text-icon mb-2">{t("workout.distanceLabel")}</label>
                      <input
                        type="number"
                        value={set?.distance_km || ""}
                        onChange={(e) => updateSet('distance_km', parseFloat(e.target.value) || 0)}
                        disabled={set?.is_completed}
                        inputMode="decimal"
                        placeholder={(() => {
                          const last = getLastCardio(selectedExercise.exerciseId);
                          return last.distance_km > 0 ? `${t("workout.last")} ${last.distance_km} km` : "0";
                        })()}
                        className="w-full px-4 py-4 bg-background border border rounded-xl text-white text-center text-2xl placeholder:text-zinc-600"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-icon mb-2">{t("workout.durationLabel")}</label>
                      <input
                        type="number"
                        value={set?.duration_minutes || ""}
                        onChange={(e) => updateSet('duration_minutes', parseFloat(e.target.value) || 0)}
                        disabled={set?.is_completed}
                        inputMode="decimal"
                        placeholder={(() => {
                          const last = getLastCardio(selectedExercise.exerciseId);
                          return last.duration_minutes > 0 ? `${t("workout.last")} ${last.duration_minutes} min` : "0";
                        })()}
                      className="w-full px-4 py-4 bg-background border border rounded-xl text-white text-center text-2xl placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {(set.target_reps || set.target_weight_kg || set.target_rpe) && (
                    <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-3 py-2 text-xs text-accent">
                      <Target className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {t("workout.trainerTarget")}:{" "}
                        {[
                          set.target_reps ? `${set.target_reps} ${t("workout.repsLabel").toLowerCase()}` : null,
                          set.target_weight_kg ? `${set.target_weight_kg} kg` : null,
                          set.target_rpe ? `RPE ${set.target_rpe}` : null,
                        ].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  )}
                  {set.trainer_note && (
                    <p className="text-xs text-icon italic">&ldquo;{set.trainer_note}&rdquo;</p>
                  )}
                  <div>
                    <label className="block text-sm text-icon mb-2">{t("workout.repsLabel")}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => !set.is_completed && (set.reps ?? 0) > 0 && updateSet('reps', (set.reps ?? 0) - 1)}
                        disabled={set.is_completed || (set.reps ?? 0) <= 0}
                        className="w-12 h-12 bg-card border border rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={set.reps || ""}
                        onChange={(e) => updateSet('reps', parseInt(e.target.value) || 0)}
                        disabled={set.is_completed}
                        inputMode="numeric"
                        className="flex-1 w-full px-4 py-4 bg-background border border rounded-xl text-white text-center text-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => !set.is_completed && updateSet('reps', (set.reps ?? 0) + 1)}
                        disabled={set.is_completed}
                        className="w-12 h-12 bg-card border border rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bg-card/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs text-icon/70 uppercase tracking-wider flex-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        {set.is_bodyweight ? t("workout.bodyweightLabel") : getEquipmentLabel(selectedExercise.equipment)}
                      </label>
                      {!!set.is_bodyweight && (profileWeightKg != null) && (
                        <span className="text-[10px] text-accent font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />{profileWeightKg} kg
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={weightInputText !== null ? weightInputText : (set.weight_kg && set.weight_kg > 0 ? String(set.weight_kg) : "")}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "" || /^\d*[.,]?\d*$/.test(raw)) {
                            setWeightInputText(raw);
                            updateSet('weight_kg', parseFloat(raw.replace(',', '.')) || 0);
                            if (set.is_bodyweight) updateSet('is_bodyweight', 0);
                          }
                        }}
                        disabled={set.is_completed || set.is_bodyweight}
                        placeholder={(() => {
                          const lastW = getLastWeight(selectedExercise.exerciseId);
                          return lastW > 0 ? `${t("workout.last")} ${lastW} kg` : "0";
                        })()}
                        className="flex-1 min-w-0 px-3 py-3 bg-background border border rounded-lg text-white text-center text-xl font-bold placeholder:text-zinc-600 placeholder:font-normal disabled:opacity-50"
                      />
                      {!set.is_completed && (
                        <button
                          type="button"
                          onClick={() => {
                            setWeightInputText(null);
                            if (set.is_bodyweight) {
                              updateSet('is_bodyweight', 0);
                            } else {
                              if (profileWeightKg == null) {
                                setShowProfileWeightModal(true);
                                return;
                              }
                              updateSet('weight_kg', profileWeightKg);
                              updateSet('is_bodyweight', 1);
                            }
                          }}
                          className={`h-[50px] px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 tracking-wide ${
                            set.is_bodyweight
                              ? "bg-accent/10 border-accent/40 text-accent"
                              : "border-zinc-700 text-icon hover:text-accent hover:border-accent/30"
                          }`}
                          style={{ fontFamily: "var(--font-oswald)" }}
                        >
                          <User className="w-3.5 h-3.5" />
                          {set.is_bodyweight ? "CORP" : "PESO CORP"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isCardio && showExtraSetButton && (set.reps ?? 0) > 0 && (set.weight_kg ?? 0) > 0 && !set.is_completed && lastSet && (
                <button
                  type="button"
                  onClick={handleAddExtraSet}
                  className="flex items-center justify-center gap-2 w-full py-3 mb-4 border border-accent text-accent hover:bg-accent/10 cursor-pointer rounded-xl"
                >
                  <Plus className="w-4 h-4" />{t("workout.addExtraSet")}
                </button>
              )}

              {!isCardio && !lastSet && !set.is_completed && (
                <button
                  type="button"
                  onClick={() => setAsLastSet(!isLastSet)}
                  className={`flex items-center gap-3 w-full p-4 mb-4 rounded-xl border-2 transition-all cursor-pointer ${isLastSet ? "bg-accent/20 border-accent" : "bg-card border hover:border-accent"
                    }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${isLastSet ? "bg-accent border-accent" : "border-icon"
                    }`}>
                    {isLastSet && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <span className={`font-medium ${isLastSet ? "text-accent" : "text-muted-foreground"}`}>
                    {t("workout.markLastSet")}
                  </span>
                </button>
              )}

              {!set.is_completed && (
                <button
                  onClick={handleCompleteSet}
                  disabled={saving || !canCompleteSet}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl mt-4"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : isCardio ? <><Check className="w-5 h-5" /> {t("workout.register")}</> : <><Check className="w-5 h-5" /> {t("workout.setCompleted")}</>}
                </button>
              )}

              {isCardio && set.is_completed && (
                <div className="text-center py-4 text-green-500">
                  <span className="font-bold text-lg">
                    {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                  </span>
                  <div className="text-sm text-green-500/70 mt-1">{t("workout.registered")}</div>
                </div>
              )}

              {!isCardio && timer.descansando && (
                <div className="mt-4 bg-card rounded-2xl border p-6 text-center">
                  {set.is_completed && (
                    <div className="mb-4 pb-4 border-b border">
                      <span className="text-green-500 font-bold text-lg">
                        {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                      </span>
                      <div className="text-sm text-green-500/70 mt-1">{t("workout.setComplete")}</div>
                    </div>
                  )}
                  <button
                    onClick={handleNextSet}
                    className="mx-auto mb-4 cursor-pointer active:scale-95 transition-transform"
                  >
                    <TimerCircle
                      seconds={timer.segundos}
                      maxSeconds={180}
                      isResting={true}
                      size={220}
                      strokeWidth={5}
                    />
                  </button>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleNextSet}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover cursor-pointer text-black font-bold rounded-xl"
                    >
                      <Play className="w-4 h-4" /> {t("workout.startNextSet")}
                    </button>
                    <button
                      onClick={undoSetComplete}
                      className="flex items-center justify-center gap-2 w-full py-2.5 border border-zinc-600 text-icon hover:text-white hover:border-zinc-500 rounded-xl transition-colors cursor-pointer text-sm"
                    >
                      {t("workout.editSet")}
                    </button>
                  </div>
                </div>
              )}

              {!isCardio && !timer.descansando && set.is_completed && !isExerciseComplete && (
                <div className="text-center py-4 text-green-500">
                  <span className="font-bold text-lg">
                    {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                  </span>
                  <div className="text-sm text-green-500/70 mt-1">{t("workout.setComplete")}</div>
                </div>
              )}

              {isExerciseComplete && (
                <div className="text-center py-4">
                  {(() => {
                    const currentIdx = exercises.findIndex(e => e.exerciseId === selectedExercise.exerciseId);
                    const nextExercise = currentIdx >= 0 && currentIdx < exercises.length - 1 ? exercises[currentIdx + 1] : null;
                    return nextExercise ? (
                      <>
                        <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                          <CheckCircle2 className="w-6 h-6" />
                          <span className="font-bold">{t("workout.exerciseComplete")}</span>
                        </div>
                        <div className="bg-card rounded-xl p-4 border text-left mb-4">
                          <p className="text-xs text-icon mb-2 uppercase tracking-wider">{t("workout.nextExercise")}</p>
                          <div className="flex items-center gap-3">
                            {nextExercise.imageUrl && (
                              <Image src={nextExercise.imageUrl} alt={nextExercise.name} width={48} height={48} className="rounded-lg object-cover w-12 h-12" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{nextExercise.name}</p>
                              <p className="text-xs text-icon">{nextExercise.sets.length} {t("workout.series")}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => selectExercise(nextExercise)}
                          className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl cursor-pointer mb-2"
                        >
                          {t("workout.startNext")}
                        </button>
                        <button
                          onClick={() => { deselectExercise(); }}
                          className="text-sm text-muted-foreground hover:text-white cursor-pointer"
                        >
                          {t("workout.pickAnother")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                          <CheckCircle2 className="w-6 h-6" />
                          <span className="font-bold">{t("workout.exerciseComplete")}</span>
                        </div>
                        <button onClick={() => { deselectExercise(); }} className="text-accent font-bold cursor-pointer">
                          {t("workout.pickAnother")}
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </main>

        {selectedExercise && (selectedExercise.imageUrl) && (
          <button
            onClick={() => setShowReference(true)}
            className="fixed bottom-36 right-4 z-[45] w-12 h-12 bg-accent-tertiary/90 hover:bg-accent-tertiary text-black rounded-full flex items-center justify-center shadow-lg shadow-accent-tertiary/20 active:scale-90 transition-all cursor-pointer"
            title="Ver referencia del ejercicio"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        )}

        <MotivationalModal
          show={showMotivationalModal}
          phrase={modalPhrase}
          subPhrase={modalSubPhrase}
          onComplete={handleMotivationalComplete}
          duration={2500}
        />

        {exerciseImage && (
          <ImageModal
            imageUrl={exerciseImage}
            exerciseName={selectedExercise?.name}
            exerciseDescription={selectedExercise?.description}
            gallery={exercises.filter(e => e.imageUrl).map(e => ({
              imageUrl: e.imageUrl!,
              name: e.name,
              description: e.description,
            }))}
            onClose={() => setExerciseImage(null)}
          />
        )}
        {prCelebration && (
          <PRCelebration
            exerciseName={prCelebration.exerciseName}
            weight={prCelebration.weight}
            reps={prCelebration.reps}
            onClose={() => setPrCelebration(null)}
          />
        )}
        {showReference && selectedExercise && (
          <ReferenceSheet
            imageUrl={selectedExercise.imageUrl}
            exerciseName={selectedExercise.name}
            description={selectedExercise.description}
            onClose={() => setShowReference(false)}
          />
        )}
        {listImageModal && (
          <ImageModal
            imageUrl={listImageModal.url}
            exerciseName={listImageModal.name}
            exerciseDescription={listImageModal.description}
            gallery={listImageModal.gallery}
            onClose={() => setListImageModal(null)}
          />
        )}
        {showProfileWeightModal && (
          <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111113] border border rounded-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                  {t("workout.profileWeightTitle")}
                </h2>
                <p className="text-sm text-icon">{t("workout.profileWeightMsg")}</p>
              </div>
              <input
                type="number"
                value={profileWeightInput}
                onChange={(e) => setProfileWeightInput(e.target.value)}
                placeholder={t("workout.profileWeightPlaceholder")}
                inputMode="decimal"
                className="w-full px-4 py-3 bg-background border border rounded-xl text-white text-center text-xl placeholder:text-zinc-600 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProfileWeightModal(false)}
                  className="flex-1 py-3 rounded-xl border border text-sm font-semibold text-icon hover:text-white transition-colors cursor-pointer"
                >
                  {t("workout.cancel")}
                </button>
                <button
                  onClick={handleSaveProfileWeight}
                  disabled={!profileWeightInput || parseFloat(profileWeightInput) <= 0}
                  className="flex-1 py-3 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  {t("workout.profileWeightSave")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
            <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("workout.title").split(' ')[0]} <span className="text-accent">{t("workout.title").split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-muted-foreground mb-8">{t("workout.subtitle")}</p>

          <div className="bg-card rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-icon">{t("workout.progress")}</span>
              <span className="text-sm font-bold text-accent">{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {(() => {
            const groups = new Map<string, { label: string; exercises: ExerciseInWorkout[] }>();
            const groupOrder: string[] = [];

            for (const ex of exercises) {
              const g = ex.muscleGroup || "otros";
              if (!groups.has(g)) {
                const muscle = muscleGroupsData.find(m => m.id === g);
                groupOrder.push(g);
                groups.set(g, {
                  label: muscle ? g.toUpperCase() : "Otros",
                  exercises: [],
                });
              }
              groups.get(g)!.exercises.push(ex);
            }

            const groupedList = groupOrder.flatMap(g => groups.get(g)!.exercises);

            return (
              <DraggableExerciseList
                exercises={groupedList}
                onReorder={reorderExercises}
              >
                {(exercise, index, dragHandleProps) => {
                  const prevExercise = index > 0 ? groupedList[index - 1] : null;
                  const currentGroup = exercise.muscleGroup || "otros";
                  const prevGroup = prevExercise ? (prevExercise.muscleGroup || "otros") : null;
                  const showHeader = currentGroup !== prevGroup;
                  const muscle = muscleGroupsData.find(m => m.id === exercise.muscleGroup);

                  const completados = getSetsCompletados(exercise);
                  const total = getTotalSets(exercise);
                  const isComplete = completados === total;
                  const firstSet = exercise.sets[0];
                  const isCardioEx = firstSet?.is_cardio;

                  return (
                    <>
                      {showHeader && (
                        <div className="flex items-center gap-3 pt-2 pb-1">
                          {muscle?.image && (
                            <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
                              <Image
                                src={muscle.image}
                                alt={muscle.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <h3
                            className="text-xs font-bold text-accent uppercase tracking-widest"
                            style={{ fontFamily: "var(--font-oswald)" }}
                          >
                            {muscle ? t("muscleGroup." + muscle.id + ".name") : "Otros"}
                          </h3>
                        </div>
                      )}
                      <div className="relative">
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') selectExercise(exercise); }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-avatar]') || target.closest('[data-drag]')) return;
                            selectExercise(exercise);
                          }}
                          className={`w-full p-5 pr-14 rounded-xl border-2 text-left cursor-pointer ${isComplete
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-card border hover:border-accent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                data-drag
                                className="p-1.5 -ml-1.5 text-icon hover:text-white active:text-accent touch-none cursor-grab active:cursor-grabbing shrink-0 rounded-lg hover:bg-zinc-800 active:bg-zinc-700"
                                {...dragHandleProps.listeners}
                                {...dragHandleProps.attributes}
                                aria-label="Reordenar ejercicio"
                              >
                                <GripVertical className="w-5 h-5 pointer-events-none" />
                              </div>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-14 h-14 shrink-0">
                                  {exercise.imageUrl ? (
                                    <div
                                      onClick={() => {
                                        const galleryItems = exercises.filter(e => e.imageUrl).map(e => ({
                                          imageUrl: e.imageUrl!,
                                          name: e.name,
                                          description: e.description,
                                        }));
                                        const idx = galleryItems.findIndex(i => i.imageUrl === exercise.imageUrl);
                                        setListImageModal({ url: exercise.imageUrl!, name: exercise.name, description: exercise.description, gallery: galleryItems, index: idx });
                                      }}
                                      data-avatar
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setListImageModal({ url: exercise.imageUrl!, name: exercise.name, description: exercise.description }); }}
                                      className={`w-14 h-14 block rounded-xl overflow-hidden cursor-zoom-in active:scale-90 transition-transform relative ${isComplete ? "ring-2 ring-green-500" : "ring-1 ring-accent-tertiary/20 hover:ring-accent-tertiary/50"}`}
                                    >
                                      <Image
                                        src={exercise.imageUrl}
                                        alt={exercise.name}
                                        width={56}
                                        height={56}
                                        className="object-cover w-14 h-14"
                                      />
                                      <div className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                                        <ZoomIn className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    </div>
                                  ) : isComplete ? (
                                    <div className="w-14 h-14 bg-green-500/20 rounded-xl flex justify-center items-center ring-1 ring-green-500/30">
                                      <Check className="w-6 h-6 text-green-500" />
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 bg-zinc-800/50 rounded-xl flex justify-center items-center ring-1 ring-white/5">
                                      <ImageOff className="w-5 h-5 text-zinc-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-lg truncate">{exercise.name}</h3>
                                  {isCardioEx ? (
                                    <p className="text-sm text-icon truncate">
                                      {(firstSet?.distance_km ?? 0) > 0 && `${firstSet.distance_km} km`}
                                      {(firstSet?.distance_km ?? 0) > 0 && (firstSet?.duration_minutes ?? 0) > 0 && " · "}
                                      {(firstSet?.duration_minutes ?? 0) > 0 && `${firstSet.duration_minutes} min`}
                                      {(firstSet?.distance_km ?? 0) <= 0 && (firstSet?.duration_minutes ?? 0) <= 0 && t("train.cardio")}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-icon">{total} {t("workout.series")}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`text-lg font-bold shrink-0 ${isComplete ? "text-green-500" : "text-accent"}`}>
                              {completados}/{total}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmExercise(exercise);
                          }}
                          disabled={saving}
                          className="absolute top-1 right-1 p-2 text-icon hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                          title={t("workout.deleteTooltip")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  );
                }}
              </DraggableExerciseList>
            );
          })()}

          <div className="mt-8 flex justify-between text-sm text-icon">
            <span>{progress.completed} {t("workout.completed")}</span>
            <span>{progress.total - progress.completed} {t("workout.remaining")}</span>
          </div>

          <button
            onClick={() => setShowAddExercise(true)}
            className="flex items-center justify-center gap-2 w-full py-3 mt-6 border border-accent/30 text-accent hover:bg-accent/10 rounded-xl transition-colors cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" /> {t("workout.addExercise")}
          </button>

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 mt-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-sm"
          >
            <XCircle className="w-4 h-4" /> {t("workout.cancelWorkout")}
          </button>
        </div>

        <ConfirmModal
          isOpen={showCancelConfirm}
          title={t("workout.cancelConfirmTitle")}
          message={t("workout.cancelConfirmMsg")}
          confirmText={t("workout.cancelConfirmBtn")}
          onConfirm={async () => {
            setShowCancelConfirm(false);
            setIsDeletingWorkout(true);
            await service.cancelWorkout(workoutId);
            router.push("/");
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />

        <ConfirmModal
          isOpen={!!deleteConfirmExercise}
          title={exercises.length === 1 ? t("workout.cancelConfirmTitle") : t("workout.deleteExerciseTitle")}
          message={exercises.length === 1
            ? t("workout.deleteExerciseLastMsg")
            : `${t("workout.deleteExerciseMsg")} "${deleteConfirmExercise?.name}" del entrenamiento? Esta acción no se puede deshacer.`}
          confirmText={exercises.length === 1 ? t("workout.deleteAndCancel") : t("workout.deleteConfirm")}
          onConfirm={async () => {
            if (!deleteConfirmExercise) return;
            if (exercises.length === 1) {
              setDeleteConfirmExercise(null);
              setIsDeletingWorkout(true);
              await service.deleteWorkout(workoutId);
              router.push("/");
            } else {
              removeExercise(deleteConfirmExercise.exerciseId);
              setDeleteConfirmExercise(null);
            }
          }}
          onCancel={() => setDeleteConfirmExercise(null)}
        />

        {showAddExercise && (
          <AddExerciseModal
            onClose={() => setShowAddExercise(false)}
            onAddExercises={async (exercises) => {
              await addExercises(exercises);
            }}
          />
        )}

        {listImageModal && (
          <ImageModal
            imageUrl={listImageModal.url}
            exerciseName={listImageModal.name}
            exerciseDescription={listImageModal.description}
            gallery={listImageModal.gallery}
            onClose={() => setListImageModal(null)}
          />
        )}
      </main>
    </div>
  );
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <WorkoutProvider workoutId={resolvedParams.id}>
      <WorkoutContent workoutId={resolvedParams.id} />
    </WorkoutProvider>
  );
}
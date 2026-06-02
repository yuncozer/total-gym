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
  Maximize2,
  XCircle,
} from "lucide-react";
import { MotivationalModal } from "@/app/components/MotivationalModal";
import { WorkoutProvider, useWorkout } from "@/lib/workout";
import * as service from "@/lib/workout/service";
import type { ExerciseInWorkout } from "@/lib/workout/types";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { WorkoutPhotoOverlay } from "@/app/components/WorkoutPhotoOverlay";
import { SaveTemplateModal } from "@/app/components/SaveTemplateModal";
import { AddExerciseModal } from "@/app/components/AddExerciseModal";
import { getDailyQuote } from "@/lib/data/quote";
import { getCardioGroup, CardioGroup } from "@/lib/data/cardio";
import type { NewExerciseDef } from "@/lib/workout/service";
import { useLanguage } from "@/lib/i18n";

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
  } = workout;

  const [phraseSeed, setPhraseSeed] = useState(0);
  const lastCompletedRef = useRef<string>("");
  const extraSetIndexRef = useRef<number | null>(null);
  const [deleteConfirmExercise, setDeleteConfirmExercise] = useState<ExerciseInWorkout | null>(null);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [showMotivationalModal, setShowMotivationalModal] = useState(false);
  const [modalPhrase, setModalPhrase] = useState("");
  const [modalSubPhrase, setModalSubPhrase] = useState("");
  const [pendingAction, setPendingAction] = useState<"completeSet" | "addExtraSet" | null>(null);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  useEffect(() => {
    if (!selectedExercise) return;
    const set = selectedExercise.sets[currentSetIndex];
    const setKey = `${selectedExercise.exerciseId}-${currentSetIndex}`;
    if (set?.is_completed && lastCompletedRef.current !== setKey) {
      lastCompletedRef.current = setKey;
      setPhraseSeed(prev => prev + 1);
    }
  }, [selectedExercise, currentSetIndex]);

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

  if (loading || isDeletingWorkout) {
    return <LoadingScreen />;
  }

  if (exercises.length === 0 && !loading) {
    router.push("/");
    return null;
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
            <div className="bg-card rounded-xl p-4 mb-8">
              <span className="text-sm text-icon">{t("workout.seriesCount")} </span>
              <span className="text-sm font-bold text-green-500">{progress.completed}/{progress.total}</span>
            </div>
            <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); setShowPhotoOverlay(true); }} className="flex items-center justify-center gap-2 w-full py-4 mb-4 bg-accent/10 border-2 border-accent hover:bg-accent/20 cursor-pointer font-bold rounded-xl text-accent transition-all duration-300 animate-pulse">
              <Share2 className="w-5 h-5" /> {t("workout.share")}
            </button>
            <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); setShowSaveTemplate(true); }} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border hover:border-accent cursor-pointer font-bold rounded-xl">
              <Bookmark className="w-5 h-5" /> {t("workout.saveTemplate")}
            </button>
            <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); router.push("/historial"); }} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border hover:border-accent cursor-pointer font-bold rounded-xl">
              <History className="w-5 h-5" /> {t("workout.viewHistory")}
            </button>
            <button onClick={() => { if (workoutName.trim()) service.renameWorkout(workoutId, workoutName.trim()); router.push("/"); }} className="flex items-center justify-center gap-2 w-full py-4 bg-accent hover:bg-accent-hover cursor-pointer text-black font-bold rounded-xl">
              <Play className="w-5 h-5" /> {t("workout.goHome")}
            </button>
          </div>
        </main>
        {showPhotoOverlay && (
          <WorkoutPhotoOverlay
            exercises={exercises}
            workoutName={workoutName.trim()}
            onClose={() => setShowPhotoOverlay(false)}
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
      <div className="min-h-screen bg-background text-white">
                <main className="pt-24 pb-12 px-4">
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
                <div className="flex items-center justify-center gap-2 mb-6">
                  {selectedExercise.sets.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToSet(idx)}
                      disabled={idx > currentSetIndex && !selectedExercise.sets[idx].is_completed}
                      className={`w-10 h-10 rounded-full text-sm font-bold cursor-pointer ${idx === currentSetIndex
                        ? "bg-accent text-black"
                        : selectedExercise.sets[idx].is_completed
                          ? "bg-green-500 text-black"
                          : "bg-muted text-icon"
                        }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {selectedExercise.imageUrl && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => setExerciseImage(selectedExercise.imageUrl!)}
                    className="relative block"
                    title="Ver ejercicio"
                  >
                    <Image
                      src={selectedExercise.imageUrl}
                      alt={selectedExercise.name}
                      width={80}
                      height={60}
                      className="rounded-lg object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </button>
                </div>
              )}

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
                  <div>
                    <label className="block text-sm text-icon mb-2">
                      {getEquipmentLabel(selectedExercise.equipment)}
                    </label>
                    <input
                      type="number"
                        value={set.weight_kg || ""}
                      onChange={(e) => updateSet('weight_kg', parseFloat(e.target.value) || 0)}
                      disabled={set.is_completed}
                      placeholder={(() => {
                        const lastW = getLastWeight(selectedExercise.exerciseId);
                        return lastW > 0 ? `${t("workout.last")} ${lastW} kg` : undefined;
                      })()}
                      className="w-full px-4 py-4 bg-background border border rounded-xl text-white text-center text-2xl placeholder:text-zinc-600"
                    />
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
                <div className="mt-4 p-4 bg-card rounded-xl border border">
                  {set.is_completed && (
                    <div className="text-center mb-3 pb-3 border-b border">
                      <span className="text-green-500 font-bold text-lg">
                        {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                      </span>
                      <div className="text-sm text-green-500/70 mt-1">{t("workout.setComplete")}</div>
                    </div>
                  )}
                  <div className="text-center mb-3">
                    <span className="text-sm text-icon">{t("workout.restLabel")}</span>
                    <div className="text-6xl font-bold text-accent mt-2" style={{ fontFamily: "var(--font-oswald)", textShadow: "0 0 20px rgba(234, 179, 8, 0.4)" }}>
                      {Math.floor(timer.segundos / 60).toString().padStart(2, '0')}:{(timer.segundos % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={undoSetComplete}
                      className="flex items-center justify-center gap-2 w-full py-2.5 border border-zinc-600 text-icon hover:text-white hover:border-zinc-500 rounded-xl transition-colors cursor-pointer text-sm"
                    >
                      {t("workout.editSet")}
                    </button>
                    <button
                      onClick={handleNextSet}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover cursor-pointer text-black font-bold rounded-xl"
                    >
                      <Play className="w-4 h-4" /> {t("workout.startNextSet")}
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
                  <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
                    <span className="text-2xl">🏆</span>
                    <span className="font-bold">{t("workout.exerciseComplete")}</span>
                  </div>
                  <button
                    onClick={() => {
                      deselectExercise();
                    }}
                    className="text-accent font-bold cursor-pointer"
                  >
                    {t("workout.pickAnother")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        <MotivationalModal
          show={showMotivationalModal}
          phrase={modalPhrase}
          subPhrase={modalSubPhrase}
          onComplete={handleMotivationalComplete}
          duration={2500}
        />

        {exerciseImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExerciseImage(null)}
          >
            <button
              onClick={() => setExerciseImage(null)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white cursor-pointer z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <Image
              src={exerciseImage}
              alt="Ejercicio"
              width={600}
              height={450}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
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

          <div className="space-y-3">
            {exercises.map((exercise) => {
              const completados = getSetsCompletados(exercise);
              const total = getTotalSets(exercise);
              const isComplete = completados === total;

              const firstSet = exercise.sets[0];
              const isCardioEx = firstSet?.is_cardio;

              return (
                <div key={exercise.exerciseId} className="relative">
                  <button
                    type="button"
                    onClick={() => selectExercise(exercise)}
                    className={`w-full p-5 pr-14 rounded-xl border-2 text-left cursor-pointer ${isComplete
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-card border hover:border-accent"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isComplete ? (
                          <div className="w-10 h-10 bg-green-500 rounded-full flex justify-center items-center">
                            <Check className="w-5 h-5 text-black" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-full flex justify-center items-center">
                            <Target className="w-5 h-5 text-icon" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{exercise.name}</h3>
                          {isCardioEx ? (
                            <p className="text-sm text-icon">
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
                      <span className={`text-lg font-bold ${isComplete ? "text-green-500" : "text-accent"}`}>
                        {completados}/{total}
                      </span>
                    </div>
                  </button>
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
              );
            })}
          </div>

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
"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
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
  History
} from "lucide-react";
import { UserHeader } from "@/app/components/UserHeader";
import { MotivationalModal } from "@/app/components/MotivationalModal";
import { WorkoutProvider, useWorkout } from "@/lib/workout";
import { getDailyQuote } from "@/lib/data/quote";

function WorkoutContent() {
  const router = useRouter();
  const workout = useWorkout();

  const MOTIVATIONAL_PHRASES = [
    "¡Excelente trabajo!",
    "¡Lo estás logrando!",
    "¡Sigue así!",
    "¡Imparable!",
    "¡Muy bien!",
    "¡Gran esfuerzo!",
    "¡Eres fuerte!",
    "¡Sigue adelante!",
    "¡Buen ritmo!",
    "¡No te detengas!",
  ];

  const COMPLETED_PHRASES = [
    "¡Muy Bien!",
    "¡Buen Trabajo!",
    "¡Bien Hecho!",
    "¡Perfecto!",
    "¡Increíble!",
    "¡Genial!",
    "¡Fantástico!",
    "¡Asombroso!",
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
    addExtraSet,
    setAsLastSet,
    getSetsCompletados,
    getTotalSets,
    isExerciseCompleted,
    getLastWeight
  } = workout;

  const [phraseSeed, setPhraseSeed] = useState(0);
  const lastCompletedRef = useRef<string>("");
  const extraSetIndexRef = useRef<number | null>(null);
  const [showMotivationalModal, setShowMotivationalModal] = useState(false);
  const [modalPhrase, setModalPhrase] = useState("");
  const [modalSubPhrase, setModalSubPhrase] = useState("");
  const [pendingAction, setPendingAction] = useState<"completeSet" | "addExtraSet" | null>(null);

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
      ? "Peso (kg)"
      : "Peso por lado (kg)";
  };

  const handleBack = () => {
    deselectExercise();
    const prog = progress;
    if (prog.completed === prog.total && prog.total > 0) {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#eab308]" />
        </main>
      </div>
    );
  }

  if (isWorkoutComplete) {
    const quote = getDailyQuote();
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#18181b] opacity-90" />
        <UserHeader showBack backHref="/" />
        <main className="relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-[#22c55e]" />
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              ENTRENAMIENTO <span className="text-[#22c55e]">COMPLETADO</span>
            </h1>
            <p className="text-[#a1a1aa] mb-8">¡Felicitaciones! Has terminado tu rutina de hoy.</p>
            <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-2xl p-6 mb-8">
              <Flame className="w-8 h-8 text-[#eab308] mx-auto mb-4" />
              <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-rajdhani)" }}>&ldquo;{quote}&rdquo;</p>
            </div>
            <div className="bg-[#18181b] rounded-xl p-4 mb-8">
              <span className="text-sm text-[#71717a]">Series: </span>
              <span className="text-sm font-bold text-[#22c55e]">{progress.completed}/{progress.total}</span>
            </div>
            <button onClick={() => { }} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer font-bold rounded-xl">
              <Share2 className="w-5 h-5" /> COMPARTIR
            </button>
            <button onClick={() => router.push("/historial")} className="flex items-center justify-center gap-2 w-full py-4 mb-4 border border-[#3f3f46] hover:border-[#eab308] cursor-pointer font-bold rounded-xl">
              <History className="w-5 h-5" /> VER HISTORIAL
            </button>
            <button onClick={() => router.push("/")} className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl">
              <Play className="w-5 h-5" /> IR AL INICIO
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (selectedExercise) {
    const set = selectedExercise.sets[currentSetIndex];
    const lastSet = currentSetIndex === selectedExercise.sets.length - 1;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <UserHeader showBack backHref="/" />
        <main className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <button onClick={handleBack} className="flex items-center gap-2 text-[#a1a1aa] hover:text-white cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <div className="bg-[#18181b] rounded-xl p-6 border border-[#3f3f46]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-2xl">{selectedExercise.name}</h2>
                <span className="text-sm text-[#71717a]">{selectedExercise.sets.length} series</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                {selectedExercise.sets.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSet(idx)}
                    disabled={idx > currentSetIndex && !selectedExercise.sets[idx].is_completed}
                    className={`w-10 h-10 rounded-full text-sm font-bold cursor-pointer ${idx === currentSetIndex
                      ? "bg-[#eab308] text-black"
                      : selectedExercise.sets[idx].is_completed
                        ? "bg-[#22c55e] text-black"
                        : "bg-[#27272a] text-[#71717a]"
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="text-center mb-6">
                <span className="text-sm text-[#71717a]">SERIE </span>
                <span className="text-4xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                  {currentSetIndex + 1}
                </span>
              </div>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">REPETICIONES</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => !set.is_completed && set.reps > 0 && updateSet('reps', set.reps - 1)}
                      disabled={set.is_completed || set.reps <= 0}
                      className="w-12 h-12 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => updateSet('reps', parseInt(e.target.value) || 0)}
                      disabled={set.is_completed}
                      inputMode="numeric"
                      className="flex-1 w-full px-4 py-4 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white text-center text-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => !set.is_completed && updateSet('reps', set.reps + 1)}
                      disabled={set.is_completed}
                      className="w-12 h-12 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#71717a] mb-2">
                    {getEquipmentLabel(selectedExercise.equipment)}
                  </label>
                  <input
                    type="number"
                    value={set.weight_kg || ""}
                    onChange={(e) => updateSet('weight_kg', parseFloat(e.target.value) || 0)}
                    disabled={set.is_completed}
                    placeholder={(() => {
                      const lastW = getLastWeight(selectedExercise.exerciseId);
                      return lastW > 0 ? `Último: ${lastW} kg` : undefined;
                    })()}
                    className="w-full px-4 py-4 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white text-center text-2xl placeholder:text-[#52525b]"
                  />
                </div>
              </div>

              {showExtraSetButton && set.reps > 0 && set.weight_kg > 0 && !set.is_completed && lastSet && (
                <button
                  type="button"
                  onClick={handleAddExtraSet}
                  className="flex items-center justify-center gap-2 w-full py-3 mb-4 border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/10 cursor-pointer rounded-xl"
                >
                  <Plus className="w-4 h-4" />Agregar serie extra
                </button>
              )}

              {!lastSet && !set.is_completed && (
                <button
                  type="button"
                  onClick={() => setAsLastSet(!isLastSet)}
                  className={`flex items-center gap-3 w-full p-4 mb-4 rounded-xl border-2 transition-all cursor-pointer ${isLastSet ? "bg-[#eab308]/20 border-[#eab308]" : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]"
                    }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${isLastSet ? "bg-[#eab308] border-[#eab308]" : "border-[#71717a]"
                    }`}>
                    {isLastSet && <Check className="w-4 h-4 text-black" />}
                  </div>
                  <span className={`font-medium ${isLastSet ? "text-[#eab308]" : "text-[#a1a1aa]"}`}>
                    Marcar como última serie
                  </span>
                </button>
              )}

              {!set.is_completed && (
                <button
                  onClick={handleCompleteSet}
                  disabled={saving || !canCompleteSet}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#3f3f46] disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl mt-4"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> SERIE COMPLETADA</>}
                </button>
              )}

              {timer.descansando && (
                <div className="mt-4 p-4 bg-[#18181b] rounded-xl border border-[#3f3f46]">
                  {set.is_completed && (
                    <div className="text-center mb-3 pb-3 border-b border-[#3f3f46]">
                      <span className="text-[#22c55e] font-bold text-lg">
                        {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                      </span>
                      <div className="text-sm text-[#22c55e]/70 mt-1">Serie completada</div>
                    </div>
                  )}
                  <div className="text-center mb-3">
                    <span className="text-sm text-[#71717a]">Descanso entre series</span>
                    <div className="text-6xl font-bold text-[#eab308] mt-2" style={{ fontFamily: "var(--font-oswald)", textShadow: "0 0 20px rgba(234, 179, 8, 0.4)" }}>
                      {Math.floor(timer.segundos / 60).toString().padStart(2, '0')}:{(timer.segundos % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <button
                    onClick={handleNextSet}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#eab308] hover:bg-[#ca9a04] cursor-pointer text-black font-bold rounded-xl"
                  >
                    <Play className="w-4 h-4" /> COMENZAR SIGUIENTE SERIE
                  </button>
                </div>
              )}

              {!timer.descansando && set.is_completed && !isExerciseComplete && (
                <div className="text-center py-4 text-[#22c55e]">
                  <span className="font-bold text-lg">
                    {getRandomPhrase(COMPLETED_PHRASES)} {getRandomPhrase(MOTIVATIONAL_PHRASES)}
                  </span>
                  <div className="text-sm text-[#22c55e]/70 mt-1">Serie completada</div>
                </div>
              )}

              {isExerciseComplete && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-[#22c55e] mb-4">
                    <span className="text-2xl">🏆</span>
                    <span className="font-bold">¡Ejercicio completado!</span>
                  </div>
                  <button
                    onClick={() => {
                      deselectExercise();
                    }}
                    className="text-[#eab308] font-bold cursor-pointer"
                  >
                    Elegir otro
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader showBack backHref="/" />
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
            TU <span className="text-[#eab308]">ENTRENAMIENTO</span>
          </h1>
          <p className="text-[#a1a1aa] mb-8">Elige un ejercicio</p>

          <div className="bg-[#18181b] rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[#71717a]">Progreso</span>
              <span className="text-sm font-bold text-[#eab308]">{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-2 bg-[#27272a] rounded-full">
              <div
                className="h-full bg-[#eab308] transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {exercises.map((exercise) => {
              const completados = getSetsCompletados(exercise);
              const total = getTotalSets(exercise);
              const isComplete = completados === total;

              return (
                <button
                  key={exercise.exerciseId}
                  type="button"
                  onClick={() => selectExercise(exercise)}
                  className={`w-full p-5 rounded-xl border-2 text-left cursor-pointer ${isComplete
                    ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                    : "bg-[#18181b] border-[#3f3f46] hover:border-[#eab308]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <div className="w-10 h-10 bg-[#22c55e] rounded-full flex justify-center items-center">
                          <Check className="w-5 h-5 text-black" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[#27272a] rounded-full flex justify-center items-center">
                          <Target className="w-5 h-5 text-[#71717a]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{exercise.name}</h3>
                        <p className="text-sm text-[#71717a]">{total} series</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${isComplete ? "text-[#22c55e]" : "text-[#eab308]"}`}>
                      {completados}/{total}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between text-sm text-[#71717a]">
            <span>{progress.completed} completadas</span>
            <span>{progress.total - progress.completed} restantes</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <WorkoutProvider workoutId={resolvedParams.id}>
      <WorkoutContent />
    </WorkoutProvider>
  );
}
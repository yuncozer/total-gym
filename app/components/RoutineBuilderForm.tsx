"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, AlertCircle, Dumbbell } from "lucide-react";
import { AddExerciseModal } from "@/app/components/AddExerciseModal";
import { useLanguage } from "@/lib/i18n";
import type { RoutineExercise } from "@/lib/trainer/types";
import type { NewExerciseDef } from "@/lib/workout/service";

interface RoutineBuilderFormProps {
  initialName?: string;
  initialDescription?: string;
  initialGoal?: string;
  initialExercises?: RoutineExercise[];
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: { name: string; description: string; goal: string; exercises: RoutineExercise[] }) => Promise<void>;
}

export function RoutineBuilderForm({
  initialName = "",
  initialDescription = "",
  initialGoal = "",
  initialExercises = [],
  submitLabel,
  submittingLabel,
  onSubmit,
}: RoutineBuilderFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [goal, setGoal] = useState(initialGoal);
  const [exercises, setExercises] = useState<RoutineExercise[]>(initialExercises);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddExercises = async (newDefs: NewExerciseDef[]) => {
    setExercises((prev) => [
      ...prev,
      ...newDefs.map((def) => ({
        exerciseId: def.exerciseId,
        name: def.name,
        equipment: def.equipment,
        imageUrl: def.imageUrl,
        muscleGroup: def.muscleGroup,
        isCardio: def.isCardio,
        setsCount: def.setsCount,
      })),
    ]);
  };

  const updateExercise = (index: number, patch: Partial<RoutineExercise>) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setExercises((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("trainer.routineNameRequired"));
      return;
    }
    if (exercises.length === 0) {
      setError(t("trainer.routineExercisesRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), goal: goal.trim(), exercises });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("trainer.routineSaveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-card border border rounded-2xl p-5 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("trainer.routineNamePlaceholder")}
          className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
          disabled={submitting}
        />
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={t("trainer.routineGoalPlaceholder")}
          className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
          disabled={submitting}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("trainer.routineDescriptionPlaceholder")}
          rows={2}
          className="w-full bg-background border border rounded-xl text-white px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors resize-none"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        {exercises.map((ex, index) => (
          <div key={`${ex.exerciseId}-${index}`} className="bg-card/60 border border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{ex.name}</p>
                <p className="text-icon text-xs">{ex.setsCount} {t("trainer.routineSets")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveExercise(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 text-icon hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveExercise(index, 1)}
                  disabled={index === exercises.length - 1}
                  className="p-1.5 text-icon hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeExercise(index)}
                  className="p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.routineTargetReps")}</label>
                <input
                  type="number"
                  min={0}
                  value={ex.targetReps ?? ""}
                  onChange={(e) => updateExercise(index, { targetReps: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-background border border rounded-lg text-white px-2 py-1.5 text-sm focus:outline-none focus:border-accent/50"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.routineTargetWeight")}</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={ex.targetWeightKg ?? ""}
                  onChange={(e) => updateExercise(index, { targetWeightKg: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-background border border rounded-lg text-white px-2 py-1.5 text-sm focus:outline-none focus:border-accent/50"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.routineTargetRpe")}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={ex.targetRpe ?? ""}
                  onChange={(e) => updateExercise(index, { targetRpe: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-background border border rounded-lg text-white px-2 py-1.5 text-sm focus:outline-none focus:border-accent/50"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.routineRestSeconds")}</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={ex.restSeconds ?? ""}
                  onChange={(e) => updateExercise(index, { restSeconds: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-background border border rounded-lg text-white px-2 py-1.5 text-sm focus:outline-none focus:border-accent/50"
                  disabled={submitting}
                />
              </div>
            </div>

            <input
              type="text"
              value={ex.note ?? ""}
              onChange={(e) => updateExercise(index, { note: e.target.value || undefined })}
              placeholder={t("trainer.routineNotePlaceholder")}
              className="w-full bg-background border border rounded-lg text-white px-2.5 py-2 text-xs mt-2 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50"
              disabled={submitting}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowAddExercise(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-accent/40 text-accent rounded-xl hover:bg-accent/5 transition-colors cursor-pointer text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {t("trainer.routineAddExercise")}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>

      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onAddExercises={handleAddExercises}
        />
      )}
    </form>
  );
}

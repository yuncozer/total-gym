"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, X, Plus, Trash2, Loader2, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import { ExerciseCard, ExerciseCardSkeleton, ImageModal, type WgerExercise } from "@/app/components/EjercicioCard";
import { type MuscleGroup } from "@/lib/data/ejercicios";

interface StepExerciseSelectionProps {
  muscleGroups: MuscleGroup[];
  selectedMuscles: string[];
  currentMuscleIndex: number;
  onSetCurrentMuscleIndex: (index: number) => void;
  selectedExercises: Record<string, string[]>;
  onToggleExercise: (muscleId: string, exerciseId: string) => void;
  loadingExercises: Record<string, boolean>;
  selectedEquipment: Record<string, string>;
  onSetSelectedEquipment: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  searchQueries: Record<string, string>;
  onSearchChange: (muscleId: string, value: string) => void;
  recentExercises: Record<string, (WgerExercise & { lastWeight: number })[]>;
  customExercises: Record<string, WgerExercise[]>;
  deletingCustomId: string | null;
  onDeleteCustomExercise: (id: string) => Promise<void>;
  onImageClick: (url: string, description?: string) => void;
  onCloseImage: () => void;
  modalImage: { url: string; description: string } | null;
  onConfirm: () => void;
  onBack: () => void;
  onCreateCustomExercise: () => void;
  getFilteredExercises: (muscleId: string) => WgerExercise[];
  isExerciseSelected: (muscleId: string, exerciseId: string) => boolean;
  t: (key: string) => string;
  EQUIPMENT_TABS: { id: string; label: string }[];
}

export function StepExerciseSelection({
  muscleGroups, selectedMuscles, currentMuscleIndex, onSetCurrentMuscleIndex,
  selectedExercises, onToggleExercise, loadingExercises, selectedEquipment,
  onSetSelectedEquipment, searchQueries, onSearchChange, recentExercises,
  customExercises, deletingCustomId, onDeleteCustomExercise,
  onImageClick, onCloseImage, modalImage, onConfirm, onBack,
  onCreateCustomExercise, getFilteredExercises, isExerciseSelected,
  t, EQUIPMENT_TABS,
}: StepExerciseSelectionProps) {
  const [showRecent, setShowRecent] = useState(true);

  return (
    <div className="animate-step-slide-in" key="exercises">
      <div className="space-y-8 mb-10">
        {selectedMuscles.slice(currentMuscleIndex, currentMuscleIndex + 1).map(muscleId => {
          const muscle = muscleGroups.find(m => m.id === muscleId);
          const filteredExercises = getFilteredExercises(muscleId);
          const selected = selectedExercises[muscleId] || [];
          const isLoading = loadingExercises[muscleId];
          const currentEquipment = selectedEquipment[muscleId] || "all";
          const recent = recentExercises[muscleId] || [];

          return (
            <div key={muscleId} className="bg-card rounded-2xl p-6 border flex flex-col max-h-[calc(100vh-280px)]">
              <div className="flex-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                    {muscle?.image && (
                      <Image src={muscle.image} alt={muscle?.name || ""} fill className="object-contain" />
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {muscle && t("muscleGroup." + muscle.id + ".name")}
                  </h3>
                  <span className="text-sm text-icon ml-auto">
                    {selected.length}/{filteredExercises.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {EQUIPMENT_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => onSetSelectedEquipment(prev => ({ ...prev, [muscleId]: tab.id }))}
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
                  onClick={onCreateCustomExercise}
                  className="flex items-center gap-2 text-sm text-icon hover:text-accent transition-colors mb-4 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t("train.newExercise")}
                </button>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
                  <input
                    type="text"
                    placeholder={t("train.searchPlaceholder")}
                    value={searchQueries[muscleId] || ""}
                    onChange={(e) => onSearchChange(muscleId, e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-background border rounded-xl text-sm text-white placeholder:text-icon focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  {searchQueries[muscleId] && (
                    <button
                      onClick={() => onSearchChange(muscleId, "")}
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
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(i => <ExerciseCardSkeleton key={i} />)}
                    </div>
                  ) : filteredExercises.length > 0 ? (
                    <ExerciseListContent
                      filteredExercises={filteredExercises}
                      recent={recent}
                      muscleId={muscleId}
                      searchQueries={searchQueries}
                      selectedExercises={selectedExercises}
                      customExercises={customExercises}
                      deletingCustomId={deletingCustomId}
                      onToggleExercise={onToggleExercise}
                      onImageClick={onImageClick}
                      onDeleteCustomExercise={onDeleteCustomExercise}
                      isExerciseSelected={isExerciseSelected}
                      t={t}
                    />
                  ) : (
                    <div className="text-center py-8 text-icon">
                      {searchQueries[muscleId]
                        ? `${t("train.noResults")} "${searchQueries[muscleId]}"`
                        : currentEquipment === "personalizados"
                          ? t("train.noCustom")
                          : t("train.noEquipment")
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
          onClick={() => onSetCurrentMuscleIndex(Math.max(0, currentMuscleIndex - 1))}
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
          {t("train.previous")}
        </button>

        <div className="flex items-center gap-2">
          {selectedMuscles.map((muscleId, index) => {
            const muscle = muscleGroups.find(m => m.id === muscleId);
            const isActive = index === currentMuscleIndex;
            const hasSelected = (selectedExercises[muscleId] || []).length > 0;
            return (
              <button
                key={muscleId}
                onClick={() => onSetCurrentMuscleIndex(index)}
                className={`
                  w-3 h-3 rounded-full transition-all cursor-pointer
                  ${isActive ? "bg-accent scale-125" : hasSelected ? "bg-accent/50 hover:bg-accent" : "bg-zinc-700 hover:bg-zinc-600"}
                `}
                title={muscle?.name || ""}
              />
            );
          })}
        </div>

        <button
          onClick={() => onSetCurrentMuscleIndex(Math.min(selectedMuscles.length - 1, currentMuscleIndex + 1))}
          disabled={currentMuscleIndex === selectedMuscles.length - 1}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer
            ${currentMuscleIndex === selectedMuscles.length - 1
              ? "bg-muted text-zinc-600 cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover text-black"
            }
          `}
        >
          {(() => {
            const nextId = selectedMuscles[currentMuscleIndex + 1];
            const nextMuscle = nextId ? muscleGroups.find(m => m.id === nextId) : null;
            return nextMuscle ? (
              <>{t("muscleGroup." + nextMuscle.id + ".name")} <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>{t("train.next")} <ArrowRight className="w-4 h-4" /></>
            );
          })()}
        </button>
      </div>

      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          exerciseDescription={modalImage.description}
          onClose={onCloseImage}
        />
      )}

      <div className="text-center">
        <div className="mb-4 text-muted-foreground">
          {Object.values(selectedExercises).flat().length} {t("train.selected")}
        </div>
        <button
          onClick={onConfirm}
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
          {t("train.confirm")}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function ExerciseListContent({
  filteredExercises, recent, muscleId, searchQueries, customExercises: _customExercises,
  deletingCustomId, onToggleExercise, onImageClick, onDeleteCustomExercise,
  isExerciseSelected, t, selectedExercises: _se,
}: {
  filteredExercises: WgerExercise[];
  recent: (WgerExercise & { lastWeight: number })[];
  muscleId: string;
  searchQueries: Record<string, string>;
  customExercises: Record<string, WgerExercise[]>;
  selectedExercises: Record<string, string[]>;
  deletingCustomId: string | null;
  onToggleExercise: (muscleId: string, exerciseId: string) => void;
  onImageClick: (url: string, description?: string) => void;
  onDeleteCustomExercise: (id: string) => Promise<void>;
  isExerciseSelected: (muscleId: string, exerciseId: string) => boolean;
  t: (key: string) => string;
}) {
  const customExs = filteredExercises.filter(e => e.id.startsWith("custom_"));
  const wgerExs = filteredExercises.filter(e => !e.id.startsWith("custom_"));
  const showRecent = recent.length > 0 && !searchQueries[muscleId];
  const recentIds = new Set(recent.map(r => r.id));

  return showRecent ? (
    <>
      {recent.length > 0 && (
        <>
          <div className="sticky -top-2 z-10 pt-2">
            <div className="text-xs text-accent font-bold mb-2 uppercase tracking-wider bg-card py-2">
              {t("train.recent")}
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
                onSelect={() => onToggleExercise(muscleId, fullExercise.id)}
                onImageClick={onImageClick}
                lastWeight={recentEx.lastWeight}
              />
            );
          })}
        </>
      )}

      {customExs.length > 0 && (
        <>
          <div className="sticky top-0 z-10 pt-2">
            <div className="text-xs text-accent font-bold mb-2 uppercase tracking-wider bg-card py-2">
              {t("train.tabCustom")}
            </div>
          </div>
          {customExs.map((exercise) => {
            const isDeletingCustom = deletingCustomId === exercise.id;
            return (
              <div key={`custom-${exercise.id}`} className="relative group">
                <ExerciseCard
                  exercise={exercise}
                  selected={isExerciseSelected(muscleId, exercise.id)}
                  onSelect={() => { if (!deletingCustomId) onToggleExercise(muscleId, exercise.id); }}
                  onImageClick={onImageClick}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCustomExercise(exercise.id); }}
                  disabled={!!deletingCustomId}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-500 rounded-lg opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  title={t("train.deleteCustomTitle")}
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

      {wgerExs.some(ex => !recentIds.has(ex.id)) && (
        <>
          <div className="sticky top-0 z-10 pt-2">
            <div className="text-xs text-icon font-medium mb-2 uppercase tracking-wider bg-card py-2">
              {t("train.allExercises")}
            </div>
          </div>
          {wgerExs.filter(ex => !recentIds.has(ex.id)).map((exercise) => (
            <ExerciseCard
              key={`normal-${exercise.id}`}
              exercise={exercise}
              selected={isExerciseSelected(muscleId, exercise.id)}
              onSelect={() => onToggleExercise(muscleId, exercise.id)}
              onImageClick={onImageClick}
            />
          ))}
        </>
      )}
    </>
  ) : (
    <>
      <div className="text-xs text-icon font-medium mb-2 uppercase tracking-wider">
        {searchQueries[muscleId] ? t("train.results") : t("train.exercises")}
      </div>
      {filteredExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          selected={isExerciseSelected(muscleId, exercise.id)}
          onSelect={() => onToggleExercise(muscleId, exercise.id)}
          onImageClick={onImageClick}
        />
      ))}
    </>
  );
}

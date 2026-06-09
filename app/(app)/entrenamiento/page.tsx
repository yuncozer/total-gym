"use client";

import { useLanguage } from "@/lib/i18n";
import { RegisterModal } from "@/app/components/RegisterModal";
import { TemplateSelector } from "@/app/components/TemplateSelector";
import { CreateCustomExerciseModal } from "@/app/components/CreateCustomExerciseModal";
import WorkoutIntroVideo from "@/app/components/WorkoutIntroVideo";
import { useWorkoutWizard } from "./useWorkoutWizard";
import { StepMuscleSelection } from "./StepMuscleSelection";
import { StepExerciseSelection } from "./StepExerciseSelection";
import { StepSummary } from "./StepSummary";

function TitleLine({ textKey }: { textKey: string }) {
  const { t } = useLanguage();
  const full = t(textKey);
  const words = full.split(' ');
  const last = words.pop();
  return <>{words.join(' ')} <span className="text-accent">{last}</span></>;
}

const EQUIPMENT_TAB_IDS = [
  "all", "barbell", "dumbbell", "body weight", "personalizados", "other"
] as const;
const EQUIPMENT_TAB_KEY: Record<string, string> = {
  "all": "train.tabAll",
  "barbell": "train.tabBarbell",
  "dumbbell": "train.tabDumbbell",
  "body weight": "train.tabBodyweight",
  "personalizados": "train.tabCustom",
  "other": "train.tabOther",
};

export default function EntrenamientoPage() {
  const { t } = useLanguage();
  const { state, actions } = useWorkoutWizard();
  const EQUIPMENT_TABS = EQUIPMENT_TAB_IDS.map(id => ({ id, label: t(EQUIPMENT_TAB_KEY[id]) }));

  const handleMuscleContinue = () => {
    actions.setStep("exercises");
    actions.setCurrentMuscleIndex(0);
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {state.step === "summary" ? (
        <>
          <StepSummary
            resumen={state.resumen}
            saving={state.saving}
            error={state.error}
            onAddSet={actions.agregarSet}
            onRemoveSet={actions.eliminarSet}
            onSave={actions.guardarYRedirigir}
            onBack={() => actions.setStep("exercises")}
            t={t}
          />
          <RegisterModal
            key={`register-modal-${state.registerModalKey}`}
            isOpen={state.showRegisterModal}
            onClose={() => actions.setShowRegisterModal(false)}
            onLoginSuccess={() => {
              actions.setError(null);
              actions.guardarYRedirigir();
            }}
          />
          {state.showIntroVideo && (
            <WorkoutIntroVideo
              videoSrc="/videos/comencemos.mp4"
              onComplete={actions.handleVideoComplete}
            />
          )}
        </>
      ) : (
        <main className="pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {["muscles", "exercises", "summary"].map((s, i) => {
                    const stepIndex = ["muscles", "exercises", "summary"].indexOf(state.step);
                    const isActive = i === stepIndex;
                    const isPast = i < stepIndex;
                    return (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? "w-10 bg-accent" : isPast ? "w-4 bg-accent/50" : "w-4 bg-zinc-700"}`} />
                    );
                  })}
                </div>
              </div>

              <h1
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {state.step === "muscles" ? (
                  <TitleLine textKey="train.title" />
                ) : (
                  <TitleLine textKey="train.titleExercises" />
                )}
              </h1>
              <p className="text-muted-foreground">
                {state.step === "muscles"
                  ? t("train.selectMuscles")
                  : t("train.selectExercises")}
              </p>
              {state.step === "exercises" && (
                <button
                  onClick={() => actions.setStep("muscles")}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-muted hover:bg-zinc-700 active:bg-zinc-600 text-muted-foreground hover:text-white active:text-white rounded-lg transition-all duration-300 cursor-pointer active:scale-95"
                >
                  {t("train.changeMuscles")} ({state.selectedMuscles.length})
                </button>
              )}
            </div>

            {state.step === "muscles" ? (
              <StepMuscleSelection
                muscleGroups={state.muscleGroups}
                selectedMuscles={state.selectedMuscles}
                onToggleMuscle={actions.toggleMuscle}
                onContinue={handleMuscleContinue}
                onOpenTemplate={() => actions.setShowTemplateSelector(true)}
                t={t}
              />
            ) : (
              <StepExerciseSelection
                muscleGroups={state.muscleGroups}
                selectedMuscles={state.selectedMuscles}
                currentMuscleIndex={state.currentMuscleIndex}
                onSetCurrentMuscleIndex={actions.setCurrentMuscleIndex}
                selectedExercises={state.selectedExercises}
                onToggleExercise={actions.toggleExercise}
                loadingExercises={state.loadingExercises}
                selectedEquipment={state.selectedEquipment}
                onSetSelectedEquipment={actions.setSelectedEquipment}
                searchQueries={state.searchQueries}
                onSearchChange={actions.handleSearchChange}
                recentExercises={state.recentExercises}
                customExercises={state.customExercises}
                deletingCustomId={state.deletingCustomId}
                onDeleteCustomExercise={actions.handleDeleteCustomExercise}
                onImageClick={actions.handleImageClick}
                onCloseImage={actions.closeModalImage}
                modalImage={state.modalImage}
                onConfirm={actions.handleConfirmar}
                onBack={() => actions.setStep("muscles")}
                onCreateCustomExercise={() => actions.setShowCreateCustomExercise(true)}
                getFilteredExercises={actions.getFilteredExercises}
                isExerciseSelected={actions.isExerciseSelected}
                t={t}
                EQUIPMENT_TABS={EQUIPMENT_TABS}
              />
            )}
          </div>
        </main>
      )}

      {state.showTemplateSelector && state.step !== "summary" && (
        <TemplateSelector
          onSelect={actions.handleSelectTemplate}
          onClose={() => actions.setShowTemplateSelector(false)}
        />
      )}

      {state.showCreateCustomExercise && state.step !== "summary" && (
        <CreateCustomExerciseModal
          preselectedMuscle={state.step === "exercises" ? state.selectedMuscles[state.currentMuscleIndex] : undefined}
          onClose={() => actions.setShowCreateCustomExercise(false)}
          onCreated={actions.refreshCustomExercises}
        />
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Dumbbell, ChevronLeft } from "lucide-react";
import { RoutineBuilderForm } from "@/app/components/RoutineBuilderForm";

export default function NewTrainerRoutinePage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8 pt-24">
        <button
          onClick={() => router.push("/entrenador/rutinas")}
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("trainer.back")}
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("trainer.newRoutineTitle")}
          </h1>
        </div>

        <RoutineBuilderForm
          submitLabel={t("trainer.routineCreate")}
          submittingLabel={t("trainer.routineCreating")}
          onSubmit={async (data) => {
            const res = await fetch("/api/trainer/routines", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || t("trainer.routineSaveError"));
            }
            const result = await res.json();
            router.push(`/entrenador/rutinas/${result.routine.id}`);
          }}
        />
      </main>
    </div>
  );
}

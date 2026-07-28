"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Dumbbell, ChevronLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { RoutineBuilderForm } from "@/app/components/RoutineBuilderForm";
import type { TrainerRoutine } from "@/lib/trainer/types";

export default function EditTrainerRoutinePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [routine, setRoutine] = useState<TrainerRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/trainer/routines/${id}`)
      .then(async (res) => {
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setRoutine(data.routine);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(t("trainer.confirmDeleteRoutine"))) return;
    setDeleting(true);
    try {
      await fetch(`/api/trainer/routines/${id}`, { method: "DELETE" });
      router.push("/entrenador/rutinas");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground text-lg">Rutina no encontrada</p>
        <Link href="/entrenador/rutinas" className="mt-4 text-accent text-sm hover:underline cursor-pointer">
          Volver a rutinas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/entrenador/rutinas")}
            className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors cursor-pointer text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("trainer.back")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer text-sm disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t("trainer.deleteRoutine")}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("trainer.editRoutineTitle")}
          </h1>
        </div>

        <RoutineBuilderForm
          initialName={routine.name}
          initialDescription={routine.description || ""}
          initialGoal={routine.goal || ""}
          initialExercises={routine.exercises}
          submitLabel={t("trainer.routineSave")}
          submittingLabel={t("trainer.routineSaving")}
          onSubmit={async (data) => {
            const res = await fetch(`/api/trainer/routines/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || t("trainer.routineSaveError"));
            }
            router.push("/entrenador/rutinas");
          }}
        />
      </main>
    </div>
  );
}

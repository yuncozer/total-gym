"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Dumbbell, Plus, ChevronRight } from "lucide-react";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { TrainerSubnav } from "@/app/components/TrainerSubnav";
import type { TrainerRoutine } from "@/lib/trainer/types";

export default function TrainerRoutinesPage() {
  const { t } = useLanguage();
  const [routines, setRoutines] = useState<TrainerRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trainer/routines")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setRoutines(data.routines || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <TrainerSubnav />
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                {t("trainer.routinesTitle")}
              </h1>
              <p className="text-icon text-sm">{t("trainer.routinesSubtitle")}</p>
            </div>
          </div>
          <Link
            href="/entrenador/rutinas/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("trainer.addRoutine")}
          </Link>
        </div>

        {routines.length === 0 ? (
          <div className="bg-card border border rounded-2xl p-8 text-center">
            <Dumbbell className="w-10 h-10 text-icon mx-auto mb-3" />
            <p className="text-muted-foreground">{t("trainer.noRoutines")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map((routine) => (
              <Link
                key={routine.id}
                href={`/entrenador/rutinas/${routine.id}`}
                className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.1)] transition-all duration-200 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{routine.name}</p>
                  <p className="text-xs text-icon">
                    {routine.exercises.length} {t("trainer.routineExercisesCount")}
                    {routine.goal ? ` · ${routine.goal}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-icon group-hover:text-accent transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

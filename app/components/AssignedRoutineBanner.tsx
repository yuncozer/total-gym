"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2, Play } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface AssignedRoutine {
  id: string;
  routineName: string | null;
  trainerName: string | null;
  exercises: unknown[];
}

export function AssignedRoutineBanner() {
  const router = useRouter();
  const { t } = useLanguage();
  const [assignment, setAssignment] = useState<AssignedRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch("/api/workouts/assigned")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setAssignment(data.assignment);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/workouts/assigned/start", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workout/${data.id}`);
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading || !assignment) return null;

  return (
    <div className="bg-gradient-to-r from-accent/15 via-card to-card border border-accent/30 rounded-2xl p-5 mb-6 sm:mb-8 max-w-2xl mx-auto text-left">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Dumbbell className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">
            {t("trainer.assignedRoutineBannerTitle")}
          </span>
          <p className="text-white font-semibold truncate">{assignment.routineName}</p>
          {assignment.trainerName && (
            <p className="text-xs text-muted-foreground">
              {t("trainer.assignedRoutineBannerFrom")} {assignment.trainerName}
            </p>
          )}
        </div>
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer text-sm shrink-0"
        >
          {starting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {starting ? t("trainer.assignedRoutineStarting") : t("trainer.assignedRoutineStart")}
        </button>
      </div>
    </div>
  );
}

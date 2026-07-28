"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Loader2, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { TrainerRoutine } from "@/lib/trainer/types";

interface Assignment {
  id: string;
  routineId: string;
  routineName: string | null;
}

interface TrainerAssignRoutineProps {
  clientId: string;
  hasAccount: boolean;
}

export function TrainerAssignRoutine({ clientId, hasAccount }: TrainerAssignRoutineProps) {
  const { t } = useLanguage();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [routines, setRoutines] = useState<TrainerRoutine[]>([]);
  const [loading, setLoading] = useState(hasAccount);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasAccount) return;
    fetch(`/api/trainer/clients/${clientId}/assignment`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setAssignment(data.assignment);
      })
      .finally(() => setLoading(false));
  }, [clientId, hasAccount]);

  const openPicker = async () => {
    setShowPicker(true);
    if (routines.length === 0) {
      const res = await fetch("/api/trainer/routines");
      if (res.ok) {
        const data = await res.json();
        setRoutines(data.routines || []);
      }
    }
  };

  const handleAssign = async (routineId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/trainer/clients/${clientId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
        setShowPicker(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm(t("trainer.confirmUnassignRoutine"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/trainer/clients/${clientId}/assignment`, { method: "DELETE" });
      if (res.ok) setAssignment(null);
    } finally {
      setBusy(false);
    }
  };

  if (!hasAccount) {
    return (
      <div className="bg-card/60 border border rounded-xl p-4 mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          {t("trainer.assignedRoutineTitle")}
        </span>
        <p className="text-xs text-icon">{t("trainer.assignRequiresAccount")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card/60 border border rounded-xl p-4 mb-4 flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-icon" />
      </div>
    );
  }

  return (
    <div className="bg-card/60 border border rounded-xl p-4 mb-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
        {t("trainer.assignedRoutineTitle")}
      </span>

      {assignment ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{assignment.routineName}</p>
          </div>
          <button
            onClick={openPicker}
            className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer shrink-0"
          >
            {t("trainer.changeRoutine")}
          </button>
          <button
            onClick={handleUnassign}
            disabled={busy}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {t("trainer.unassignRoutine")}
          </button>
        </div>
      ) : (
        <button
          onClick={openPicker}
          className="w-full flex items-center justify-between gap-2 py-2.5 px-3 border border-dashed border-accent/40 text-accent rounded-xl hover:bg-accent/5 transition-colors cursor-pointer text-sm font-semibold"
        >
          <span>{t("trainer.assignRoutine")}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {showPicker && (
        <div className="mt-3 pt-3 border-t border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-icon">{t("trainer.selectRoutineToAssign")}</span>
            <button onClick={() => setShowPicker(false)} className="text-icon hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {routines.length === 0 ? (
            <p className="text-xs text-icon py-2">{t("trainer.noRoutinesToAssign")}</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleAssign(routine.id)}
                  disabled={busy}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left disabled:opacity-50"
                >
                  <span className="text-sm text-white truncate">{routine.name}</span>
                  <span className="text-[10px] text-icon shrink-0">{routine.exercises.length} {t("trainer.routineExercisesCount")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

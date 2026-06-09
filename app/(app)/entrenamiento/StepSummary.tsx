"use client";

import { Play, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface ResumenEjercicio {
  id: string;
  nombre: string;
  description: string;
  is_cardio?: boolean;
  sets: { reps: number; peso: number }[];
}

interface StepSummaryProps {
  resumen: ResumenEjercicio[];
  saving: boolean;
  error: string | null;
  onAddSet: (ejercicioId: string) => void;
  onRemoveSet: (ejercicioId: string, setIndex: number) => void;
  onSave: () => void;
  onBack: () => void;
  t: (key: string) => string;
}

export function StepSummary({
  resumen, saving, error, onAddSet, onRemoveSet, onSave, onBack, t,
}: StepSummaryProps) {
  return (
    <div className="min-h-screen bg-background text-white">
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {(() => { const a = t("train.summaryTitle").split(' '); const b = a.pop(); return <>{a.join(' ')} <span className="text-accent">{b}</span></> })()}
            </h1>
            <p className="text-muted-foreground">
              {t("train.summarySubtitle")}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-8">
            {resumen.map((ej) => (
              <div key={ej.id} className="bg-card rounded-xl p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{ej.nombre}</h3>
                    <p className="text-sm text-icon mt-1 line-clamp-2">{ej.description}</p>
                  </div>
                  {ej.is_cardio ? (
                    <div className="ml-4 text-right">
                      <span className="text-sm text-accent font-bold">{t("train.cardio")}</span>
                      <p className="text-xs text-icon">{t("train.oneSet")}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onRemoveSet(ej.id, ej.sets.length - 1)}
                        disabled={ej.sets.length <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border text-icon hover:text-red-500 hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span className="block font-bold text-lg">{ej.sets.length}</span>
                        <span className="text-xs text-icon">{t("train.sets")}</span>
                      </div>
                      <button
                        onClick={() => onAddSet(ej.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background border text-icon hover:text-accent hover:border-accent cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center justify-center gap-3 w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("train.saving")}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {t("train.start")}
                </>
              )}
            </button>

            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 w-full py-3 border text-muted-foreground hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("train.back")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

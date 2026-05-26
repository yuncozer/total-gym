"use client";

import { useState } from "react";
import { Save, Loader2, Check, X, Bookmark } from "lucide-react";
import * as service from "@/lib/workout/service";
import type { ExerciseInWorkout, TemplateExercise } from "@/lib/workout/types";

interface SaveTemplateModalProps {
  exercises: ExerciseInWorkout[];
  onClose: () => void;
  onSaved: () => void;
}

export function SaveTemplateModal({ exercises, onClose, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const templateExercises: TemplateExercise[] = exercises.map(e => ({
      exerciseId: e.exerciseId,
      name: e.name,
      equipment: e.equipment,
      sets: e.sets.length,
    }));

    try {
      await service.createTemplate(name.trim(), templateExercises);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el template");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {saved ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-500">¡Template guardado!</p>
            <p className="text-icon text-sm mt-3 leading-relaxed">
              "{name.trim()}" está disponible para cargar desde la pantalla de <strong>Entrenamiento</strong>.
            </p>
            <p className="text-icon text-sm mt-2 leading-relaxed">
              Usá el botón <strong className="text-white">CARGAR TEMPLATE</strong> al seleccionar grupos musculares para cargar esta rutina completa al instante.
            </p>
            <button
              onClick={() => { onSaved(); onClose(); }}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover cursor-pointer text-black font-bold rounded-xl transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              ENTENDIDO
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Guardar como template</h3>
              <button onClick={onClose} className="p-1 text-icon hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Guardá esta rutina para reutilizarla después sin tener que seleccionar ejercicio por ejercicio.
            </p>
            {error && (
              <p className="text-sm text-red-400 mb-4 bg-red-900/30 rounded-xl px-4 py-3">{error}</p>
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Nombre de la rutina"
              maxLength={40}
              className="w-full px-4 py-3 bg-background border border rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-colors mb-4"
              autoFocus
            />
            <p className="text-xs text-zinc-600 text-right mb-4">{name.length}/40</p>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              GUARDAR TEMPLATE
            </button>
          </>
        )}
      </div>
    </div>
  );
}

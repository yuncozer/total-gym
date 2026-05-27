"use client";

import { useState } from "react";
import { Plus, Loader2, Check, X } from "lucide-react";
import * as service from "@/lib/workout/service";
import { muscleGroupsData } from "@/lib/data/ejercicios";

const EQUIPMENT_OPTIONS = [
  { id: "peso_corporal", label: "Peso corporal" },
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Mancuernas" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "band", label: "Banda elástica" },
  { id: "cable", label: "Polea" },
  { id: "machine", label: "Máquina" },
  { id: "other", label: "Otro" },
];

interface CreateCustomExerciseModalProps {
  preselectedMuscle?: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCustomExerciseModal({ preselectedMuscle, onClose, onCreated }: CreateCustomExerciseModalProps) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState(preselectedMuscle || muscleGroupsData[0].id);
  const [equipment, setEquipment] = useState("peso_corporal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      await service.createCustomExercise({
        name: name.trim(),
        muscle_group: muscleGroup,
        equipment,
      });
      onCreated();
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el ejercicio");
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
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-500">¡Ejercicio creado!</p>
            <p className="text-icon text-sm mt-2">Ya podés seleccionarlo en tu entrenamiento.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo ejercicio</h3>
              <button onClick={onClose} className="p-1 text-icon hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Creá un ejercicio personalizado para usar en tus rutinas.
            </p>

            {error && (
              <p className="text-sm text-red-400 mb-4 bg-red-900/30 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-icon mb-2">Nombre del ejercicio</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 50))}
                  placeholder="Ej: Press inclinado con mancuerna"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-background border border rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-icon mb-2">Grupo muscular</label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border rounded-xl text-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {muscleGroupsData.map((mg) => (
                    <option key={mg.id} value={mg.id}>{mg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-icon mb-2">Equipo</label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border rounded-xl text-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  {EQUIPMENT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              CREAR EJERCICIO
            </button>
          </>
        )}
      </div>
    </div>
  );
}

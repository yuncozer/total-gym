"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Loader2, Minus, Search, Check, Maximize2 } from "lucide-react";
import toast from "react-hot-toast";
import { muscleGroupsData, type MuscleGroup } from "@/lib/data/ejercicios";
import * as service from "@/lib/workout/service";
import type { NewExerciseDef } from "@/lib/workout/service";
import { useLanguage } from "@/lib/i18n";

interface WgerExercise {
  id: string;
  name: string;
  description: string;
  equipment: string;
  equipmentCategory: string;
  imageUrl: string | null;
}

interface CustomExercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  image_url: string | null;
}

interface AddExerciseModalProps {
  onClose: () => void;
  onAddExercises: (exercises: NewExerciseDef[]) => Promise<void>;
}

const EQUIPMENT_TABS = [
  { id: "all", label: "Todos" },
  { id: "barbell", label: "Barra" },
  { id: "dumbbell", label: "Mancuernas" },
  { id: "body weight", label: "Peso corporal" },
  { id: "personalizados", label: "Personalizados" },
  { id: "other", label: "Otros" },
];

export function AddExerciseModal({ onClose, onAddExercises }: AddExerciseModalProps) {
  const { t } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Record<string, WgerExercise[]>>({});
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [setCounts, setSetCounts] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);

  useEffect(() => {
    service.loadCustomExercises().then((custom) => {
      setCustomExercises(Array.isArray(custom) ? custom : []);
    }).catch(() => {
      toast.error("No se pudieron cargar los ejercicios personalizados");
    });
  }, []);

  const selectMuscle = async (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setSelectedEquipment("all");
    setSearchQuery("");
    setAddedIds(new Set());

    if (exercises[muscleId]) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("muscleGroup", muscleId);
      params.append("limit", "50");

      const res = await fetch(`/api/exercises?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setExercises(prev => ({ ...prev, [muscleId]: data.data }));
      }
    } catch (err) {
      console.error("Error fetching exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (exercise: WgerExercise | CustomExercise) => {
    const id = exercise.id;
    const count = setCounts[id] || 3;

    setAdding(true);
    await onAddExercises([{
      exerciseId: id,
      name: exercise.name,
      equipment: "equipment" in exercise ? exercise.equipment : (exercise as CustomExercise).equipment,
      imageUrl: "imageUrl" in exercise ? exercise.imageUrl ?? undefined : (exercise as CustomExercise).image_url ?? undefined,
      setsCount: count,
      muscleGroup: selectedMuscle || undefined,
    }]);
    setAdding(false);
    setAddedIds(prev => new Set(prev).add(id));
  };

  const getFilteredExercises = (): WgerExercise[] => {
    if (!selectedMuscle) return [];

    const muscleExercises = exercises[selectedMuscle] || [];
    const customGroup = customExercises
      .filter(c => c.muscle_group === selectedMuscle)
      .map(c => ({
        id: `custom_${c.id}`,
        name: c.name,
        description: "",
        equipment: c.equipment,
        equipmentCategory: c.equipment,
        imageUrl: c.image_url,
      }));

    const allExercises = [...muscleExercises, ...customGroup];

    let filtered = selectedEquipment === "all"
      ? allExercises
      : selectedEquipment === "personalizados"
        ? allExercises.filter(ex => ex.id.startsWith("custom_"))
        : allExercises.filter(ex =>
            !ex.id.startsWith("custom_") && ex.equipmentCategory === selectedEquipment
          );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      if (a.imageUrl && !b.imageUrl) return -1;
      if (!a.imageUrl && b.imageUrl) return 1;
      return 0;
    });

    return filtered;
  };

  const filteredExercises = getFilteredExercises();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card border border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border">
          <h2 className="text-lg font-bold text-white">Agregar ejercicio</h2>
          <button onClick={onClose} className="p-1 text-icon hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1.5 p-3 overflow-x-auto shrink-0 bg-background/50">
          {muscleGroupsData.map(m => (
            <button
              key={m.id}
              onClick={() => selectMuscle(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedMuscle === m.id
                  ? "bg-accent text-black"
                  : "bg-muted text-muted-foreground hover:bg-zinc-700"
              }`}
            >
              {t("muscleGroup." + m.id + ".name")}
            </button>
          ))}
        </div>

        {selectedMuscle && (
          <div className="px-3 pt-2 shrink-0">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full bg-muted text-white text-sm rounded-xl pl-9 pr-4 py-2 border border focus:border-accent outline-none"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {EQUIPMENT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedEquipment(tab.id); setAddedIds(new Set()); }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedEquipment === tab.id
                      ? "bg-accent text-black"
                      : "bg-muted text-muted-foreground hover:bg-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {!selectedMuscle ? (
            <div className="flex items-center justify-center py-12 text-icon text-sm">
              Selecciona un grupo muscular
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-icon text-sm">
              No hay ejercicios para este filtro
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredExercises.map(ex => {
                const id = ex.id;
                const isAdded = addedIds.has(id);
                const count = setCounts[id] || 3;

                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                      isAdded ? "bg-green-500/10" : "bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    {ex.imageUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExerciseImage(ex.imageUrl!); }}
                        className="relative block shrink-0"
                        title="Ver imagen"
                      >
                        <Image
                          src={ex.imageUrl}
                          alt={ex.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover w-10 h-10"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ex.name}</p>
                      <p className="text-icon text-[10px] truncate">{ex.equipment}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSetCounts(prev => ({ ...prev, [id]: Math.max(1, count - 1) }))}
                          disabled={count <= 1 || isAdded}
                          className="w-6 h-6 rounded-md bg-muted text-icon hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-xs font-medium w-4 text-center">{count}</span>
                        <button
                          onClick={() => setSetCounts(prev => ({ ...prev, [id]: count + 1 }))}
                          disabled={count >= 8 || isAdded}
                          className="w-6 h-6 rounded-md bg-muted text-icon hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleAdd(ex)}
                        disabled={adding || isAdded}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isAdded
                            ? "bg-green-500/20 text-green-500"
                            : "bg-accent text-black hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        {adding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {exerciseImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExerciseImage(null)}
        >
          <button
            onClick={() => setExerciseImage(null)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <Image
            src={exerciseImage}
            alt="Ejercicio"
            width={600}
            height={450}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

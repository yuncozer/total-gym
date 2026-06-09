"use client";

import Image from "next/image";
import { Check, Dumbbell, ArrowRight, FolderOpen } from "lucide-react";
import { type MuscleGroup } from "@/lib/data/ejercicios";

interface StepMuscleSelectionProps {
  muscleGroups: MuscleGroup[];
  selectedMuscles: string[];
  onToggleMuscle: (id: string) => Promise<void>;
  onContinue: () => void;
  onOpenTemplate: () => void;
  t: (key: string) => string;
}

export function StepMuscleSelection({
  muscleGroups, selectedMuscles, onToggleMuscle, onContinue, onOpenTemplate, t,
}: StepMuscleSelectionProps) {
  return (
    <>
      <div className="flex justify-start mb-4">
        <button
          onClick={onOpenTemplate}
          className="flex items-center gap-2 text-xs border border-border/50 hover:border-accent-secondary/30 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-accent-secondary transition-all cursor-pointer active:scale-[0.97]"
          title={t("train.loadTemplate")}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          {t("train.loadTemplate")}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-10 animate-step-slide-in">
        {muscleGroups.map((muscle, idx) => (
          <button
            key={muscle.id}
            onClick={() => onToggleMuscle(muscle.id)}
            style={{ animationDelay: (idx * 40) + "ms" }}
            className={`
              group relative h-44 rounded-2xl overflow-hidden border-2 transition-all duration-500 cursor-pointer text-left active:scale-[0.98]
              ${selectedMuscles.includes(muscle.id)
                ? "border-accent border-[3px] scale-[1.04] animate-pulse-glow"
                : "border hover:border-accent/50 active:border-accent/30 hover:scale-[1.02]"
              }
            `}
          >
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 group-active:scale-105">
              <Image
                src={muscle.image}
                alt={muscle.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${selectedMuscles.includes(muscle.id) ? "bg-gradient-to-t from-black/90 via-black/50 to-black/30" : "bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/70 group-active:from-black/60"}`} />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              {selectedMuscles.includes(muscle.id) && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center animate-bounce-check shadow-[0_0_12px_rgba(234,179,8,0.5)]">
                  <Check className="w-5 h-5 text-black" />
                </div>
              )}
              <h3
                className="font-bold text-lg text-white drop-shadow-lg"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {t("muscleGroup." + muscle.id + ".name")}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 drop-shadow-md">
                {t("muscleGroup." + muscle.id + ".desc")}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onContinue}
          disabled={selectedMuscles.length === 0}
          className={`
            group flex items-center justify-center gap-3 font-bold px-10 py-4 rounded-xl transition-all cursor-pointer
            ${selectedMuscles.length > 0
              ? "bg-accent hover:bg-accent-hover text-black hover:scale-105"
              : "bg-zinc-700 text-icon cursor-not-allowed"
            }
          `}
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          <Dumbbell className="w-5 h-5" />
          {t("train.pickExercises")}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {selectedMuscles.length === 0 && (
          <p className="text-icon mt-4 text-sm">
            {t("train.minSelection")}
          </p>
        )}
      </div>
    </>
  );
}

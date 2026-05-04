"use client";

import { Check } from "lucide-react";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: "principiante" | "intermedio" | "avanzado";
  equipment: string;
}

export interface ExerciseCardProps {
  exercise: Exercise;
  selected: boolean;
  onSelect: () => void;
}

export function ExerciseCard({ exercise, selected, onSelect }: ExerciseCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "principiante": return "text-green-400 bg-green-400/10 border-green-400/30";
      case "intermedio": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      case "avanzado": return "text-red-400 bg-red-400/10 border-red-400/30";
      default: return "text-gray-400";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "principiante": return "Principiante";
      case "intermedio": return "Intermedio";
      case "avanzado": return "Avanzado";
      default: return difficulty;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer
        ${selected
          ? "border-[#eab308] bg-[#eab308]/10"
          : "border-[#3f3f46] hover:border-[#eab308]/50 bg-[#0a0a0a]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0
            ${selected 
              ? "border-[#eab308] bg-[#eab308]" 
              : "border-[#3f3f46]"
            }
          `}>
            {selected && (
              <Check className="w-3 h-3 text-black" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg">{exercise.name}</h4>
            <p className="text-sm text-[#a1a1aa] mt-1">{exercise.description}</p>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`
                text-xs px-2 py-1 rounded-full border
                ${getDifficultyColor(exercise.difficulty)}
              `}>
                {getDifficultyLabel(exercise.difficulty)}
              </span>
              <span className="text-xs text-[#71717a]">
                {exercise.equipment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
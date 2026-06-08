"use client";

import Image from "next/image";
import { Check, Maximize2, Dumbbell } from "lucide-react";

export interface WgerExercise {
  id: string;
  uuid: string;
  name: string;
  description: string;
  category: string;
  categoryId: number;
  muscles: string[];
  muscleIds: number[];
  secondaryMuscles: string[];
  secondaryMuscleIds: number[];
  equipment: string;
  equipmentIds: number[];
  equipmentCategory: string;
  imageUrl: string | null;
  images: string[];
  variationGroup: string | null;
}

export interface ExerciseCardProps {
  exercise: WgerExercise;
  selected: boolean;
  onSelect: () => void;
  onImageClick: (imageUrl: string, description?: string) => void;
  lastWeight?: number;
}

function translateEquipment(equipment: string): string {
  if (!equipment) return "Peso corporal";
  
  const translations: [RegExp, string][] = [
    [/\bBarbell\b/gi, "Barra"],
    [/\bSZ-Bar\b/gi, "Barra EZ"],
    [/\bDumbbell\b/gi, "Mancuernas"],
    [/\bKettlebell\b/gi, "Pesa rusa"],
    [/\bCable\b/gi, "Polea"],
    [/\bMachine\b/gi, "Máquina"],
    [/\bBench\b/gi, "Banco"],
    [/\bIncline bench\b/gi, "Banco inclinado"],
    [/\bSwiss Ball\b/gi, "Balón suizo"],
    [/\bGym mat\b/gi, "Mat de gym"],
    [/\bPull-up bar\b/gi, "Barra fija"],
    [/\bResistance band\b/gi, "Banda elástica"],
    [/\bnone \(bodyweight exercise\)/gi, "Peso corporal"],
  ];
  
  let result = equipment;
  for (const [pattern, replacement] of translations) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

export function ExerciseCard({ exercise, selected, onSelect, onImageClick, lastWeight }: ExerciseCardProps) {
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exercise.imageUrl) {
      onImageClick(exercise.imageUrl, exercise.description);
    }
  };

  const translatedEquipment = translateEquipment(exercise.equipment);

  return (
    <button
      onClick={onSelect}
      className={`
        group w-full p-3 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer
        ${selected
          ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
          : "border hover:border-accent/50 bg-background hover:bg-muted/50"
        }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
            ${selected 
              ? "border-accent bg-accent scale-110" 
              : "border group-hover:border-accent/50"
            }
          `}>
            {selected && (
              <Check className="w-3 h-3 text-black animate-bounce-check" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-base leading-tight transition-colors duration-300 ${selected ? "text-accent" : "text-white"}`}>
                {exercise.name}
              </h4>
              {lastWeight && lastWeight > 0 && (
                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full whitespace-nowrap border border-green-500/20 animate-badge-pop">
                  Último: {lastWeight} kg
                </span>
              )}
            </div>
            
            {exercise.muscles.length > 0 && (
              <p className="text-sm text-accent/80 mt-1 truncate">
                {exercise.muscles.slice(0, 3).join(", ")}
              </p>
            )}
            
            {exercise.description && (
              <p className="text-xs text-icon mt-1 line-clamp-2">
                {exercise.description}
              </p>
            )}
            
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                <Dumbbell className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] text-cyan-400 font-medium">
                  {translatedEquipment}
                </span>
              </span>
            </div>
          </div>
        </div>

        {exercise.imageUrl && (
          <div 
            className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-card group/img cursor-pointer ring-1 ring-white/10 hover:ring-accent/30 transition-all duration-300"
            onClick={handleImageClick}
          >
            <Image
              src={exercise.imageUrl}
              alt={exercise.name}
              fill
              className="object-cover transition-all duration-500 group-hover/img:scale-125 group-hover/img:rotate-1"
              sizes="80px"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
              <Maximize2 className="w-5 h-5 text-white scale-90 group-hover/img:scale-100 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

interface ImageModalProps {
  imageUrl: string;
  exerciseName?: string;
  exerciseDescription?: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, exerciseName, exerciseDescription, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
      
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] bg-card rounded-2xl overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={exerciseName || "Exercise"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
        
        {exerciseDescription && (
          <div className="mt-3 px-1 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">
              {exerciseDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
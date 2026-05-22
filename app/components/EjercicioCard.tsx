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
  onImageClick: (imageUrl: string) => void;
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
      onImageClick(exercise.imageUrl);
    }
  };

  const translatedEquipment = translateEquipment(exercise.equipment);

  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-3 rounded-xl border-2 transition-all text-left cursor-pointer
        ${selected
          ? "border-accent bg-accent/10"
          : "border hover:border-accent/50 bg-background"
        }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${selected 
              ? "border-accent bg-accent" 
              : "border"
            }
          `}>
            {selected && (
              <Check className="w-3 h-3 text-black" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base leading-tight">
                {exercise.name}
              </h4>
              {lastWeight && lastWeight > 0 && (
                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
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
            
            <div className="flex items-center gap-1 mt-2">
              <Dumbbell className="w-3 h-3 text-cyan-500" />
              <span className="text-xs text-cyan-500 font-medium">
                Equipamiento:
              </span>
              <span className="text-xs text-cyan-600">
                {translatedEquipment}
              </span>
            </div>
          </div>
        </div>

        {exercise.imageUrl && (
          <div 
            className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-card group cursor-pointer"
            onClick={handleImageClick}
          >
            <Image
              src={exercise.imageUrl}
              alt={exercise.name}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="64px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
      
      <div 
        className="relative w-full max-w-3xl aspect-[4/3] bg-card rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt="Exercise"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>
    </div>
  );
}
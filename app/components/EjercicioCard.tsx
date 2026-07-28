"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Check, Maximize2, Dumbbell, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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

export function ExerciseCard({ exercise, selected, onSelect, onImageClick, lastWeight }: ExerciseCardProps) {
  const { t } = useLanguage();

  const translatedEquipment = (() => {
    const eq = exercise.equipment;
    if (!eq || eq === "none (bodyweight exercise)") return t("equipment.bodyweight");
    const map: Record<string, string> = {
      barbell: t("equipment.barbell"),
      "sz-bar": t("equipment.sz-bar"),
      dumbbell: t("equipment.dumbbell"),
      kettlebell: t("equipment.kettlebell"),
      cable: t("equipment.cable"),
      machine: t("equipment.machine"),
      bench: t("equipment.bench"),
      "incline bench": t("equipment.incline-bench"),
      "swiss ball": t("equipment.swiss-ball"),
      "gym mat": t("equipment.gym-mat"),
      "pull-up bar": t("equipment.pull-up-bar"),
      "resistance band": t("equipment.resistance-band"),
    };
    return eq.split(",").map(part => {
      const trimmed = part.trim().toLowerCase();
      return map[trimmed] || trimmed;
    }).join(", ");
  })();

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exercise.imageUrl) {
      onImageClick(exercise.imageUrl, exercise.description);
    }
  };

  return (
    <button type="button"
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-secondary/10 border border-accent-secondary/20">
                <Dumbbell className="w-3 h-3 text-accent-secondary" />
                <span className="text-[11px] text-accent-secondary font-medium">
                  {translatedEquipment}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div 
          className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-card group/img cursor-pointer ring-1 ring-white/10 hover:ring-accent-tertiary/40 transition-all duration-300"
          onClick={exercise.imageUrl ? handleImageClick : undefined}
        >
          {exercise.imageUrl ? (
            <Image
              src={exercise.imageUrl}
              alt={exercise.name}
              fill
              className="object-cover transition-all duration-500 group-hover/img:scale-125 group-hover/img:rotate-1"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
              <ImageOff className="w-6 h-6 text-zinc-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
            <Maximize2 className="w-5 h-5 text-white scale-90 group-hover/img:scale-100 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="w-full p-3 rounded-xl border-2 border animate-pulse bg-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-zinc-700 rounded w-48" />
              <div className="h-4 bg-zinc-700 rounded-full w-20" />
            </div>
            <div className="h-3 bg-zinc-700 rounded w-36" />
            <div className="h-3 bg-zinc-700 rounded w-full max-w-64" />
            <div className="w-20 h-5 bg-zinc-700 rounded-md" />
          </div>
        </div>
        <div className="w-24 h-24 rounded-xl bg-zinc-700 flex-shrink-0" />
      </div>
    </div>
  );
}

export interface GalleryItem {
  imageUrl: string;
  name: string;
  description?: string;
}

export interface ImageModalProps {
  imageUrl: string;
  exerciseName?: string;
  exerciseDescription?: string;
  gallery?: GalleryItem[];
  onClose: () => void;
}

export function ImageModal({ imageUrl, exerciseName, exerciseDescription, gallery, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!gallery) return -1;
    return gallery.findIndex(i => i.imageUrl === imageUrl);
  });
  const touchStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState(0);

  const current = gallery && currentIndex >= 0 ? gallery[currentIndex] : null;
  const displayUrl = current?.imageUrl ?? imageUrl;
  const displayName = current?.name ?? exerciseName ?? "";
  const displayDescription = current?.description ?? exerciseDescription;

  const goTo = useCallback((index: number) => {
    if (!gallery) return;
    if (index < 0 || index >= gallery.length) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [gallery, currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !gallery) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      goTo(currentIndex + (diff < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  }, [gallery, currentIndex, goTo]);

  const total = gallery?.length ?? 1;
  const currentPos = gallery ? (currentIndex + 1) : 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button type="button"
        className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>

      {gallery && currentIndex > 0 && (
        <button type="button"
          onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {gallery && currentIndex < gallery.length - 1 && (
        <button type="button"
          onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full aspect-[4/3] bg-card rounded-2xl overflow-hidden flex-shrink-0 touch-pan-y-pinch-zoom border border-accent-tertiary/20">
          <Image
            src={displayUrl}
            alt={displayName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="mt-3 px-1 space-y-1.5">
          {gallery && (
            <div className="flex items-center justify-center gap-1.5">
              {gallery.map((_, i) => (
                <button type="button"
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentIndex ? "bg-accent-tertiary w-3" : "bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-center text-xs text-zinc-500">
            {currentPos} / {total}
          </p>
          {displayDescription && (
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              {displayDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
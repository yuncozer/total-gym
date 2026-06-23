"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, ImageOff, FileText } from "lucide-react";

interface ReferenceSheetProps {
  imageUrl: string | null | undefined;
  exerciseName: string;
  description?: string;
  onClose: () => void;
}

export function ReferenceSheet({ imageUrl, exerciseName, description, onClose }: ReferenceSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-md bg-card border border-accent-tertiary/20 rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up shadow-2xl shadow-accent-tertiary/5"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-bold text-white truncate pr-2" style={{ fontFamily: "var(--font-oswald)" }}>
            Referencia: {exerciseName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-icon hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-accent-tertiary/10">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={exerciseName}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 448px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageOff className="w-8 h-8 text-zinc-600" />
                <span className="text-xs text-zinc-600">Sin imagen de referencia</span>
              </div>
            )}
          </div>

          {description && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 shrink-0 text-accent-tertiary/60" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                {description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

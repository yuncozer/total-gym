"use client";

import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaLightboxProps {
  item: { mediaType: "image" | "video"; url: string } | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  position?: { index: number; total: number };
}

const SWIPE_THRESHOLD = 50;

export function MediaLightbox({ item, onClose, onNext, onPrev, hasNext, hasPrev, position }: MediaLightboxProps) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext) onNext?.();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [item, onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!item) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0 && hasNext) onNext?.();
    else if (delta > 0 && hasPrev) onPrev?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 border border flex items-center justify-center text-white hover:text-accent transition-colors cursor-pointer"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      {onPrev && hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/80 border border flex items-center justify-center text-white hover:text-accent transition-colors cursor-pointer"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {onNext && hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/80 border border flex items-center justify-center text-white hover:text-accent transition-colors cursor-pointer"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {item.mediaType === "video" ? (
        <video
          src={item.url}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-full rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={item.url}
          alt=""
          className="max-w-full max-h-full rounded-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {position && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-card/80 border border rounded-full px-3 py-1">
          {position.index + 1} / {position.total}
        </p>
      )}
    </div>
  );
}

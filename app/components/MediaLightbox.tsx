"use client";

import { X } from "lucide-react";

interface MediaLightboxProps {
  item: { mediaType: "image" | "video"; url: string } | null;
  onClose: () => void;
}

export function MediaLightbox({ item, onClose }: MediaLightboxProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 border border flex items-center justify-center text-white hover:text-accent transition-colors cursor-pointer"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>
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
    </div>
  );
}

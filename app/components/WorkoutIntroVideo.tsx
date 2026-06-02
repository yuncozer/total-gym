"use client";

import { X } from "lucide-react";

interface Props {
  videoSrc: string;
  onComplete: () => void;
}

export default function WorkoutIntroVideo({ videoSrc, onComplete }: Props) {
  const handleClose = () => {
    onComplete();
  };

  const onVideoEnded = () => {
    setTimeout(handleClose, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <video
        src={videoSrc}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onEnded={onVideoEnded}
      />
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/80 text-sm hover:bg-white/30 hover:text-white transition cursor-pointer z-10"
      >
        <X className="w-4 h-4" />
        Saltar
      </button>
    </div>
  );
}

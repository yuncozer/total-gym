"use client";

import { Dumbbell, Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Dumbbell className="w-12 h-12 text-[#eab308] animate-pulse" />
        <Loader2 className="w-8 h-8 text-[#eab308] animate-spin" />
      </div>
    </div>
  );
}

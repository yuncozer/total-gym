"use client";

import { Dumbbell, Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Dumbbell className="w-12 h-12 text-accent animate-pulse" />
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    </div>
  );
}

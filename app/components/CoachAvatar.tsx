"use client";

import { Brain, Loader2 } from "lucide-react";

export function CoachAvatar({ thinking, pulse }: { thinking: boolean; pulse: boolean }) {
  return (
    <div className="flex justify-center mb-5">
      <div className={`w-20 h-20 relative`}>
        <div className={`absolute inset-0 rounded-full border border-accent/20 ${thinking ? "animate-coach-think" : pulse ? "animate-coach-pulse" : "animate-coach-idle"}`} />
        <div className={`absolute inset-2 rounded-full border border-accent/10 ${thinking ? "animate-coach-think-delayed" : pulse ? "animate-coach-pulse-delayed" : ""}`} />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center backdrop-blur-sm">
          {thinking ? (
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          ) : (
            <Brain className="w-6 h-6 text-accent" />
          )}
        </div>
      </div>
    </div>
  );
}

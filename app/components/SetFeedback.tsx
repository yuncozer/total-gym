"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

interface SetFeedbackProps {
  show: boolean;
  phrase: string;
  subPhrase: string;
  onDone: () => void;
  duration?: number;
}

export function SetFeedback({
  show,
  phrase,
  subPhrase,
  onDone,
  duration = 1300,
}: SetFeedbackProps) {
  useEffect(() => {
    if (!show) return;
    const done = setTimeout(onDone, duration);
    return () => clearTimeout(done);
  }, [show, duration, onDone]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
      style={{ top: "calc(5rem + env(safe-area-inset-top, 0px))" }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl border border-green-500/40 bg-card/95 px-5 py-3 shadow-lg shadow-green-500/10 backdrop-blur-sm animate-set-feedback"
        style={{ animationDuration: `${duration}ms` }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
          <Check className="h-5 w-5 text-black" strokeWidth={3} />
        </span>
        <span className="min-w-0">
          <span
            className="block truncate font-bold text-green-500"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {phrase}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{subPhrase}</span>
        </span>
      </div>
    </div>
  );
}

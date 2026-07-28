"use client";

import { useState, useCallback } from "react";
import { PartyPopper, UserPlus, ArrowRight, X } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { useLanguage } from "@/lib/i18n";

interface TrainerClientAddedCelebrationProps {
  clientName: string;
  clientCount: number;
  onViewClient: () => void;
  onAddAnother: () => void;
  onClose: () => void;
}

export function TrainerClientAddedCelebration({
  clientName,
  clientCount,
  onViewClient,
  onAddAnother,
  onClose,
}: TrainerClientAddedCelebrationProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const handleDismiss = useCallback((action: () => void) => {
    setVisible(false);
    setShowConfetti(false);
    setTimeout(action, 250);
  }, []);

  const milestoneText =
    clientCount === 1
      ? t("trainer.celebrationFirstClient")
      : t("trainer.celebrationCount").replace("{count}", String(clientCount));

  return (
    <>
      {showConfetti && <ConfettiCanvas />}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => handleDismiss(onClose)}
      >
        <div
          className="relative bg-card border border-accent/40 rounded-2xl p-8 mx-4 max-w-sm w-full text-center animate-[fade-in-up_0.4s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDismiss(onClose)}
            className="absolute top-3 right-3 text-icon hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <PartyPopper className="w-8 h-8 text-accent" />
          </div>

          <div className="inline-block bg-accent/10 border border-accent/30 rounded-full px-4 py-1 mb-3">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("trainer.celebrationBadge")}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 truncate" style={{ fontFamily: "var(--font-oswald)" }}>
            {clientName}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            {milestoneText}
          </p>

          <button
            onClick={() => handleDismiss(onViewClient)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl cursor-pointer transition-all active:scale-95"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {t("trainer.celebrationViewClient")}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDismiss(onAddAnother)}
            className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 text-accent hover:text-accent-hover font-semibold text-sm cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t("trainer.celebrationAddAnother")}
          </button>
        </div>
      </div>
    </>
  );
}

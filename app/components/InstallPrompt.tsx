"use client";

import { useInstallPrompt } from "@/lib/use-install-prompt";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";

export function InstallPrompt() {
  const { canInstall, installed, install, hasPrompt } = useInstallPrompt();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || installed || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:right-auto sm:left-6 sm:w-80">
      <div className="rounded-xl border border-yellow-600/25 bg-zinc-900/95 p-4 shadow-xl shadow-black/50">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-oswald text-sm font-semibold uppercase tracking-wider text-yellow-400">
              {t("home.pwa.banner.title")}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded-full">
                {t("home.pwa.banner.badgeFree")}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded-full">
                {t("home.pwa.banner.badgeSafe")}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-full">
                {t("home.pwa.banner.badgeNoVirus")}
              </span>
            </div>
          </div>
        </div>
        <p className="font-rajdhani text-xs text-zinc-400 leading-relaxed mb-3 pl-[52px]">
          {t("home.pwa.banner.desc")}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {t("home.pwa.banner.dismiss")}
          </button>
          <button
            onClick={async () => {
              if (!hasPrompt) {
                setDismissed(true);
                return;
              }
              await install();
            }}
            className="rounded-lg bg-yellow-500 px-4 py-1.5 text-xs font-bold text-black transition-all hover:bg-yellow-400 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ {t("home.pwa.banner.install")}
          </button>
        </div>
        {!hasPrompt && (
          <p className="text-[10px] text-zinc-600 text-right mt-2">
            {t("home.pwa.banner.fallback")}
          </p>
        )}
      </div>
    </div>
  );
}

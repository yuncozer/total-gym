"use client";

import { useEffect, useState } from "react";

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /Chrome|Edge\/|Chromium|Brave/.test(ua) && !/iPhone|iPad|iPod/.test(ua);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    if (isChromium) {
      setCanInstall(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setCanInstall(true);
    };

    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    (prompt as any).prompt();
    const result = await (prompt as any).userChoice;
    setPrompt(null);
    return result.outcome === "accepted";
  };

  return { canInstall, installed, install, hasPrompt: !!prompt };
}

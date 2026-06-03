"use client";

import { useEffect } from "react";

export function SplashScreen() {
  useEffect(() => {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    const timer = setTimeout(() => {
      splash.classList.add("splash-hidden");
      setTimeout(() => splash.remove(), 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

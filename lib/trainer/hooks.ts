"use client";

import { useState, useEffect } from "react";

export function useTrainer() {
  const [isTrainer, setIsTrainer] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrainer() {
      try {
        const res = await fetch("/api/trainer/me");
        if (!res.ok) {
          if (!cancelled) {
            setIsTrainer(false);
            setDisplayName(null);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setIsTrainer(data.isTrainer ?? false);
          setDisplayName(data.displayName ?? null);
        }
      } catch {
        if (!cancelled) {
          setIsTrainer(false);
          setDisplayName(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrainer();

    return () => { cancelled = true; };
  }, []);

  return { isTrainer, displayName, loading };
}

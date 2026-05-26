"use client";

import { useState, useEffect } from "react";
import type { SubscriptionResponse } from "./types";

export function usePremium() {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/user/subscription");
        if (!res.ok) throw new Error("Failed to fetch subscription");
        const data: SubscriptionResponse = await res.json();
        if (!cancelled) setSubscription(data);
      } catch {
        if (!cancelled) {
          setSubscription({
            plan: "free",
            status: "active",
            isPremium: false,
            daysLeft: null,
            periodEnd: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubscription();

    return () => { cancelled = true; };
  }, []);

  return {
    isPremium: subscription?.isPremium ?? false,
    plan: subscription?.plan ?? "free",
    daysLeft: subscription?.daysLeft ?? null,
    periodEnd: subscription?.periodEnd ?? null,
    loading,
  };
}

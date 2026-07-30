"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, X, Lock } from "lucide-react";
import { usePushNotifications, saveSubscription, updateNotificationSettings } from "@/lib/push";
import { useLanguage } from "@/lib/i18n";

export type NotificationBannerReason = "generic" | "trainerLinked" | "newClient";

interface NotificationBannerProps {
  reason?: NotificationBannerReason;
  onEnabled?: () => void;
}

const SNOOZE_KEY = "tg_push_banner_snoozed_until";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const REASON_FLAG_KEY = "tg_push_reason";

function isSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  const until = Number(localStorage.getItem(SNOOZE_KEY) || "0");
  return until > Date.now();
}

function detectReason(): NotificationBannerReason {
  if (typeof window === "undefined") return "generic";
  const flag = sessionStorage.getItem(REASON_FLAG_KEY);
  if (flag === "trainerLinked" || flag === "newClient") {
    sessionStorage.removeItem(REASON_FLAG_KEY);
    return flag;
  }
  return "generic";
}

export function NotificationBanner({ reason, onEnabled }: NotificationBannerProps) {
  const { t } = useLanguage();
  const [resolvedReason] = useState<NotificationBannerReason>(() => reason ?? detectReason());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [snoozed, setSnoozed] = useState(isSnoozed);
  const [error, setError] = useState<string | null>(null);
  const { supported, subscribe, loading: subLoading, permission } = usePushNotifications();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/push/status");
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.notify_enabled);
        }
      } catch (err) {
        console.error("Error checking notification status:", err);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleActivate = async () => {
    if (!supported || loading) return;
    setLoading(true);
    setError(null);
    try {
      const sub = await subscribe();
      if (!sub) {
        if (Notification.permission === "denied") return;
        throw new Error(t("notif.activateError"));
      }
      await saveSubscription(sub);
      await updateNotificationSettings(true);
      setEnabled(true);
      onEnabled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notif.activateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setSnoozed(true);
  };

  if (!supported || checking || enabled || snoozed) return null;

  const copy = {
    generic: { title: t("notif.reasonGenericTitle"), desc: t("notif.reasonGenericDesc") },
    trainerLinked: { title: t("notif.reasonTrainerLinkedTitle"), desc: t("notif.reasonTrainerLinkedDesc") },
    newClient: { title: t("notif.reasonNewClientTitle"), desc: t("notif.reasonNewClientDesc") },
  }[resolvedReason];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md">
      <div className="bg-card border border-accent/30 rounded-xl p-4 shadow-xl backdrop-blur-lg relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-icon hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {permission === "denied" ? (
          <div className="flex items-start gap-3 pr-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {t("notif.deniedTitle")}
              </p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                {t("notif.deniedSteps")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 pr-4">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {copy.title}
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {copy.desc}
              </p>
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
            <button
              onClick={handleActivate}
              disabled={loading || subLoading}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {loading || subLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  {t("notif.activate")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

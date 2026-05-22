"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { usePushNotifications, saveSubscription, updateNotificationSettings } from "@/lib/push";

interface NotificationBannerProps {
  userId: string;
  onEnabled?: () => void;
}

export function NotificationBanner({ userId, onEnabled }: NotificationBannerProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { supported, subscribe, loading: subLoading } = usePushNotifications();

  useEffect(() => {
    if (userId) {
      checkStatus();
    }
  }, [userId]);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/push/status");
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.notify_enabled);
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async () => {
    if (!supported || loading) return;

    setLoading(true);
    try {
      if (!enabled) {
        const sub = await subscribe();
        if (sub) {
          await saveSubscription(sub);
          setEnabled(true);
          onEnabled?.();
        }
      } else {
        await updateNotificationSettings(false);
        setEnabled(false);
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!supported || checking) return null;
  if (enabled) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md">
      <div className="bg-card border border-accent/30 rounded-xl p-4 shadow-xl backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
              Recordatorio vespertino
            </p>
            <p className="text-muted-foreground text-xs truncate">
              Te avisamos si no has entrenado
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading || subLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {loading || subLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Bell className="w-4 h-4" />
                ACTIVAR
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
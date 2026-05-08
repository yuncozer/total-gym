"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, X, Check, AlertCircle } from "lucide-react";
import { usePushNotifications, saveSubscription, updateNotificationSettings } from "@/lib/push";

interface NotificationButtonProps {
  userId: string;
}

export function NotificationButton({ userId }: NotificationButtonProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleActivate = async () => {
    if (!supported || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Starting subscription process...");
      
      const sub = await subscribe();
      console.log("Got subscription:", sub);
      console.log("Subscription keys:", sub ? (sub as any).keys : null);

      if (!sub) {
        throw new Error("No se pudo obtener la suscripción del navegador");
      }

      console.log("Saving subscription to backend...");
      await saveSubscription(sub);
      console.log("Subscription saved successfully!");
      
      setEnabled(true);
      setSuccess(true);
      setExpanded(false);
    } catch (err: any) {
      console.error("Error activating notifications:", err);
      setError(err.message || err.error || "Error al activar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!supported || loading) return;

    setLoading(true);
    try {
      await updateNotificationSettings(false);
      setEnabled(false);
      setExpanded(false);
    } catch (error) {
      console.error("Error deactivating notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!supported || checking) return null;

  if (enabled) return null;

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 z-[100] bg-[#eab308] hover:bg-[#ca9a04] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all cursor-pointer"
        title="Activar recordatorio"
      >
        <Bell className="w-6 h-6 text-black" />
      </button>

      {expanded && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setExpanded(false)} />
          <div className="relative bg-[#18181b] border border-[#eab308]/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 text-[#71717a] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#eab308]" />
              </div>
              <h2 
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                RECORDATORIO DIARIO
              </h2>
              <p className="text-[#a1a1aa] mt-2">
                Te avisaremos a las 18:00 si no has entrenado hoy
              </p>
              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleActivate}
              disabled={loading || subLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#eab308] hover:bg-[#ca9a04] disabled:bg-[#3f3f46] disabled:cursor-not-allowed cursor-pointer text-black font-bold py-4 rounded-xl transition-all"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {loading || subLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  ACTIVAR NOTIFICACIONES
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
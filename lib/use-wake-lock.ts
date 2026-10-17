"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mantiene la pantalla encendida mientras `active` sea true.
 *
 * El navegador suelta el bloqueo solo cada vez que la pestaña deja de ser
 * visible (cambiar de app, bloquear el móvil), así que hay que volver a
 * pedirlo al regresar. La API no existe en Safari antiguo ni en contextos sin
 * HTTPS, y puede rechazar la petición sin avisar: todo va envuelto en
 * try/catch y la pantalla simplemente se comporta como hasta ahora.
 */
export function useWakeLock(active: boolean): { supported: boolean; held: boolean } {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [held, setHeld] = useState(false);
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  useEffect(() => {
    if (!active || !supported) return;

    let cancelled = false;

    const release = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      setHeld(false);
      if (sentinel) sentinel.release().catch(() => {});
    };

    const request = async () => {
      if (cancelled || sentinelRef.current || document.visibilityState !== "visible") return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setHeld(true);
        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
            setHeld(false);
          }
        });
      } catch {
        setHeld(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void request();
      } else {
        release();
      }
    };

    void request();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      release();
    };
  }, [active, supported]);

  return { supported, held };
}

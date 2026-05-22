"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => window.location.reload();

  if (!offline && !justReconnected) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md animate-fade-in-up">
      {offline ? (
        <div className="bg-card border border-accent/30 rounded-xl p-4 shadow-xl backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                Sin conexión
              </p>
              <p className="text-muted-foreground text-xs truncate">
                Los datos pueden no estar actualizados
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 flex-shrink-0"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <RefreshCw className="w-4 h-4" />
              REINTENTAR
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-green-500/30 rounded-xl p-4 shadow-xl backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                ¡De vuelta en línea!
              </p>
              <p className="text-muted-foreground text-xs truncate">
                La conexión se ha restablecido
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading: authLoading, authenticated } = useAuth(true);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) return;

    fetch("/api/admin/stats")
      .then((res) => {
        if (res.ok) {
          setIsAdmin(true);
        } else if (res.status === 403) {
          setIsAdmin(false);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false));
  }, [authLoading, authenticated]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground mb-6">No tienes permisos de administrador.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

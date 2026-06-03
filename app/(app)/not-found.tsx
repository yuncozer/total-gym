"use client";

import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-zinc-400">404</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Esta sección no existe dentro de tu entrenamiento.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/entrenamiento"
            className="px-6 py-3 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Ir a entrenar
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

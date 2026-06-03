"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-zinc-400">404</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

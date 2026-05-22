"use client";

import Link from "next/link";
import { X, AlertTriangle, LogIn, UserPlus, Database, History, Trophy } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-icon hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <h2 
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            CREA TU CUENTA
          </h2>
        </div>

        <p className="text-muted-foreground text-center mb-6">
          Necesitas una cuenta para guardar tu progreso y consultar tu historial de entrenamiento.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <Database className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <span className="text-white font-medium block">Tus datos siempre seguros</span>
              <span className="text-icon text-sm">Puedes continuar entrenando desde cualquier dispositivo</span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <History className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <span className="text-white font-medium block">Consulta tu historial</span>
              <span className="text-icon text-sm">Revisa cuánto levantaste la última vez que hiciste cada ejercicio</span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <Trophy className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <span className="text-white font-medium block">Tu progreso queda registrado</span>
              <span className="text-icon text-sm">Ve tu evolución workout tras workout</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-red-500/30 rounded-xl p-3 mb-6">
          <p className="text-red-500 text-sm">
            <span className="font-medium">Sin cuenta:</span> tus datos se perderán al cerrar esta página y no podrás recuperarlos.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold rounded-xl transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <UserPlus className="w-5 h-5" />
            CREAR CUENTA
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 bg-muted border border hover:border-accent text-white font-bold rounded-xl transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <LogIn className="w-5 h-5" />
            YA TENGO CUENTA
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { X, AlertTriangle, ArrowRight, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export function AuthModal({ isOpen, onClose, onContinueAsGuest }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#18181b] border border-[#3f3f46] rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#eab308]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#eab308]" />
          </div>
          <h2 
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            IMPORTANTE
          </h2>
        </div>

        <p className="text-[#a1a1aa] text-center mb-6">
          Para mantener tus datos y consultarlos en el futuro, necesitas crear una cuenta.
        </p>

        <div className="bg-[#27272a] rounded-xl p-4 mb-6">
          <h3 className="text-white font-medium mb-3">Si continuas sin registrarte:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <span className="text-[#22c55e]">✓</span>
              <span className="text-[#a1a1aa]">Podrás crear tu rutina de entrenamiento</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-[#22c55e]">✓</span>
              <span className="text-[#a1a1aa]">Podrás registrar series, repeticiones y peso</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-[#ef4444]">✗</span>
              <span className="text-[#a1a1aa]">Los datos se PERDERÁN al cerrar la página</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-[#ef4444]">✗</span>
              <span className="text-[#a1a1aa]">No podrás consultarlos más adelante</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#eab308] hover:bg-[#ca9a04] text-black font-bold rounded-xl transition-colors"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <UserPlus className="w-5 h-5" />
            CREAR CUENTA
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#27272a] border border-[#3f3f46] hover:border-[#eab308] text-white font-bold rounded-xl transition-colors"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <LogIn className="w-5 h-5" />
            INICIAR SESIÓN
          </Link>
          
          <button
            onClick={onContinueAsGuest}
            className="flex items-center justify-center gap-2 w-full py-3 text-[#71717a] hover:text-white font-medium rounded-xl transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            CONTINUAR COMO INVITADO
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
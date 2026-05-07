"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, X, CheckCircle2, Loader2, Lock, Calendar, TrendingUp, Smartphone } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function RegisterModal({ isOpen, onClose, onLoginSuccess }: RegisterModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!visible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );

      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        }
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Error al crear usuario");
        setMode("login");
        setError(null);
        setPassword("");
        setConfirmPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
        router.refresh();
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative z-10 w-full max-w-md mx-4 p-6 sm:p-8 rounded-2xl bg-[#18181b] border border-[#3f3f46] shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Dumbbell className="w-10 h-10 text-[#eab308]" />
          </div>
          
          <h2 
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {mode === "login" ? (
              <>BIENVENIDO DE <span className="text-[#eab308]">VUELTA</span></>
            ) : (
              <>CREA TU <span className="text-[#eab308]">CUENTA</span></>
            )}
          </h2>
          
          <p className="text-[#a1a1aa] text-sm sm:text-base">
            {mode === "login" 
              ? "Inicia sesión para continuar tu entrenamiento" 
              : "Crea una cuenta gratis para no perder tu entrenamiento"}
          </p>
        </div>

        {mode === "register" && (
          <div className="grid grid-cols-1 gap-3 mb-8">
            {[
              { icon: CheckCircle2, text: "Guarda tu progreso ejercicio por ejercicio" },
              { icon: Calendar, text: "Historial completo de todos tus workouts" },
              { icon: TrendingUp, text: "Estadísticas, rachas y series totales" },
              { icon: Smartphone, text: "Accede desde cualquier dispositivo" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-sm sm:text-base">
                <Icon className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
                <span className="text-[#d4d4d8]">{text}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-2">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={mode === "register"}
                minLength={6}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] disabled:bg-[#71717a] text-black font-bold text-lg rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              <>
                <Lock className="w-5 h-5" />
                INICIAR SESIÓN
              </>
            ) : (
              "CREAR CUENTA"
            )}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); setPassword(""); setConfirmPassword(""); }}
              className="w-full py-3 border border-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-xl transition-colors cursor-pointer text-sm"
            >
              Crear cuenta
            </button>
          )}
        </form>

        <div className="text-center">
          {mode === "login" ? (
            <p className="text-[#71717a] text-sm">
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => { setMode("register"); setError(null); setPassword(""); setConfirmPassword(""); }}
                className="text-[#eab308] hover:text-[#ca9a04] font-bold cursor-pointer"
              >
                Crea una gratis
              </button>
            </p>
          ) : (
            <p className="text-[#71717a] text-sm">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); setPassword(""); setConfirmPassword(""); }}
                className="text-[#eab308] hover:text-[#ca9a04] font-bold cursor-pointer"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, UserPlus, ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { signInWithGoogle } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "">("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);

  useEffect(() => {
    async function initSupabase() {
      const { createBrowserClient } = await import("@supabase/ssr");
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );
      setSupabase(client);
    }
    initSupabase();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      if (result.data.session) {
router.push("/login");
      }
    });
  }, [router, supabase]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    if (confirmPassword.length > 0 && passwordMatch === false) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (!sexo) {
      setError("Por favor selecciona tu sexo");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear cuenta");
        setLoading(false);
        return;
      }

      router.push("/entrenamiento");
    } catch (err) {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#3f3f46]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">VOLVER</span>
          </Link>
          <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-[#eab308]">GYM</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              CREAR <span className="text-[#eab308]">CUENTA</span>
            </h1>
            <p className="text-[#a1a1aa]">
              Regístrate para guardar tu progreso
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (confirmPassword.length > 0) {
                      setPasswordMatch(e.target.value === confirmPassword);
                    }
                  }}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value.length > 0) {
                      setPasswordMatch(e.target.value === password);
                    } else {
                      setPasswordMatch(null);
                    }
                  }}
                  placeholder="Repite tu contraseña"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white placeholder-[#71717a] focus:outline-none focus:border-[#eab308] transition-colors"
                />
                {passwordMatch !== null && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {passwordMatch ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Sexo *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSexo("M")}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                    sexo === "M" 
                      ? "bg-[#eab308] text-black" 
                      : "bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] hover:border-[#eab308]"
                  }`}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  HOMBRE
                </button>
                <button
                  type="button"
                  onClick={() => setSexo("F")}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                    sexo === "F" 
                      ? "bg-[#eab308] text-black" 
                      : "bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] hover:border-[#eab308]"
                  }`}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  MUJER
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl text-[#ef4444]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (confirmPassword.length > 0 && passwordMatch === false)}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#eab308] hover:bg-[#ca9a04] disabled:bg-[#3f3f46] disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {loading ? (
                <span className="animate-pulse">CREANDO CUENTA...</span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  CREAR CUENTA
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#3f3f46] w-full" />
              <span className="absolute px-3 bg-[#0a0a0a] text-[#71717a] text-xs">o</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center justify-center gap-3 w-full py-4 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed cursor-pointer text-gray-800 font-bold rounded-xl transition-colors"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {googleLoading ? (
                <span className="animate-pulse">REDIRIGIENDO...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  REGISTRARSE CON GOOGLE
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#71717a]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#eab308] hover:underline font-medium cursor-pointer">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
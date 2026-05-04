"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Flame, Zap, Trophy, ArrowRight, Calendar, User, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { AuthModal } from "@/app/components/AuthModal";
import { UserHeader } from "@/app/components/UserHeader";
import type { Session } from "@supabase/supabase-js";

const motivationalQuotes = [
  "El dolor que sientes hoy es la fuerza que sentirás mañana.",
  "No.pares cuando estés fatigued. Para cuando hayas terminado.",
  "La grandeza se construye en el gimnasio, pero se forja en la mente.",
  "Cada repetición te acerca más a tu mejor versión.",
  "No hay secretos. Solo entrenamiento consistencia.",
  "Tu único límite eres tú mismo.",
  "El cuerpo logra lo que la mente cree.",
  "Levanta pesado. Sueña grande.",
  "La disciplina es el puente entre tus sueños y tus logros.",
  "Hoy sudas, mañana brillas.",
  "El gimnasio no perdona ignorancia, pero premia dedicación.",
  "Transforma el dolor en poder.",
  "Cada día es una oportunidad de ser más fuerte.",
  "No busques atajos, busca resultados.",
  "La motivación te abre la puerta, la disciplina te hace entrar.",
  "El hierro no miente, las excusas sí.",
  "Entrena como si fuera tu último día.",
  "El champion se hace cuando nadie mira.",
  "Tu único competidor eres tú.",
  "La fuerza no viene del cuerpo, viene del corazón.",
  "Sudor hoy, gloria mañana.",
  "No te rindas cuando parezca difícil.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Levantate, entrena, repítelo.",
  "La metas se cumplen con acción.",
  "Haz que cada repetición compte.",
  "El gym es tu therapy.",
  "La única manera de fallar es no intentarlo.",
  "Perseverancia vence talento.",
  "Tu tiempo es ahora.",
  "El dolor es temporal, el orgullo es eterno.",
];

export function getDailyQuote(): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}

export function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Home() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [pendingWorkout, setPendingWorkout] = useState<{ id: string; date: string; completed: number; total: number } | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);

  const quote = getDailyQuote();
  const dateStr = getFormattedDate();

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
      if (result.data.session?.user) {
        setUser({ email: result.data.session.user.email || "" });
        checkPendingWorkout(supabase, result.data.session.user.id);
      }
    });
  }, [supabase]);

  const checkPendingWorkout = async (supabaseClient: typeof supabase, userId: string) => {
    setCheckingPending(true);
    
    const { data: pending } = await supabaseClient
      .from("workouts")
      .select("id, date, started_at, status")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (pending) {
      const startedAt = new Date(pending.started_at).getTime();
      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000;

      if (now - startedAt > threeHours) {
        await supabaseClient
          .from("workouts")
          .update({ status: "completed" })
          .eq("id", pending.id);
        setPendingWorkout(null);
      } else {
        const { data: setsData } = await supabaseClient
          .from("workout_sets")
          .select("id, is_completed")
          .eq("workout_id", pending.id);
        
        const completed = setsData?.filter((s: { is_completed: boolean }) => s.is_completed).length || 0;
        const total = setsData?.length || 0;
        
        if (completed === total && total > 0) {
          await supabaseClient
            .from("workouts")
            .update({ status: "completed" })
            .eq("id", pending.id);
          setPendingWorkout(null);
        } else {
          setPendingWorkout({ 
            id: pending.id, 
            date: pending.date,
            completed,
            total 
          });
        }
      }
    }
    
    setCheckingPending(false);
  };

  const handleStartTraining = () => {
    if (pendingWorkout) {
      router.push(`/workout/${pendingWorkout.id}`);
    } else if (user) {
      router.push("/entrenamiento");
    } else {
      setShowAuthModal(true);
    }
  };

  const handleContinueAsGuest = () => {
    setShowAuthModal(false);
    router.push("/entrenamiento");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <UserHeader />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <main className="pt-20">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#18181b] opacity-90" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-[#eab308]/10 border border-[#eab308]/30 rounded-full px-4 py-2 mb-8">
              <Calendar className="w-4 h-4 text-[#eab308]" />
              <span className="text-sm text-[#eab308] uppercase tracking-wider" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {dateStr}
              </span>
            </div>

            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 animate-fade-in-up"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-[#eab308]">CADA DÍA</span> <br />
              UNA NUEVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#eab308]">OPORTUNIDAD</span>
            </h1>

            <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-2xl p-8 md:p-12 mb-10 backdrop-blur-sm animate-pulse-glow">
              <Flame className="w-8 h-8 text-[#eab308] mx-auto mb-4" />
              <p 
                className="text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {checkingPending ? (
                <button 
                  disabled
                  className="flex items-center justify-center gap-3 bg-[#27272a] text-[#71717a] font-bold px-8 py-4 rounded-xl w-full sm:w-auto cursor-wait"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  VERIFICANDO...
                </button>
              ) : pendingWorkout ? (
                <button 
                  onClick={() => router.push(`/workout/${pendingWorkout.id}`)}
                  className="group flex items-center justify-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Play className="w-5 h-5" />
                  CONTINUAR ENTRENAMIENTO
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={handleStartTraining}
                  className="group flex items-center justify-center gap-3 bg-[#eab308] hover:bg-[#ca9a04] text-black font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Zap className="w-5 h-5" />
                  COMENZAR RUTINA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button 
                className="flex items-center justify-center gap-3 border-2 border-[#3f3f46] hover:border-[#eab308] text-white font-bold px-8 py-4 rounded-xl transition-all hover:bg-[#eab308]/10 cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <Trophy className="w-5 h-5" />
                VER PROGRAMAS
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#18181b]">
          <div className="max-w-6xl mx-auto px-4">
            <h2 
              className="text-3xl md:text-4xl font-bold text-center mb-16"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              ¿POR QUÉ <span className="text-[#eab308]">ELEGIRNOS?</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Dumbbell className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  EQUIPAMIENTO PREMIUM
                </h3>
                <p className="text-[#a1a1aa]">
                  Las mejores marcas y equipos de última generación para tu entrenamiento.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Flame className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  ENTRENADORES EXPERTOS
                </h3>
                <p className="text-[#a1a1aa]">
                  Profesionales certificados que te guia hacia tus metas.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#3f3f46] rounded-2xl p-8 text-center hover:border-[#eab308] transition-colors group">
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <Trophy className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                  RESULTADOS REALES
                </h3>
                <p className="text-[#a1a1aa]">
                  Metodología probada para transformations visibles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-[#3f3f46] py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#eab308] rounded flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
              TOTAL<span className="text-[#eab308]">GYM</span>
            </span>
          </div>
          <p className="text-[#a1a1aa] text-sm">
            © 2026 TOTAL GYM. Entrena como un campeón.
          </p>
        </div>
      </footer>
    </div>
  );
}
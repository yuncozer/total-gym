"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Flame, Zap, Trophy, ArrowRight, Calendar, User, Loader2, Play, Smartphone, History, Timer } from "lucide-react";
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

<section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #eab308 1px, transparent 1px), radial-gradient(circle at 75% 75%, #eab308 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-white">POR QUÉ </span>
              <span className="text-[#eab308]">ELEGIRNOS</span>
            </h2>
            <p className="text-[#71717a] text-center text-lg mb-16 max-w-2xl mx-auto">
              Esto no es una app más. Es tu weapon para transformar tu físico.
            </p>
             
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              <div className="group bg-[#18181b] border border-[#3f3f46] rounded-xl p-8 hover:border-[#eab308] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#eab308]/5 rounded-bl-full group-hover:bg-[#eab308]/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#eab308]/10 rounded-xl flex items-center justify-center group-hover:bg-[#eab308]/20 group-hover:scale-110 transition-all duration-300">
                      <Smartphone className="w-8 h-8 text-[#eab308]" />
                    </div>
                    <div className="w-px h-16 bg-[#3f3f46]" />
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        TU GYM
                      </h3>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                        EN EL BOLSILLO
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#a1a1aa] text-lg leading-relaxed pl-20">
                    Una webapp que te acompaña ANTES, DURANTE y DESPUÉS de cada entrenamiento. 
                    <span className="text-white font-medium block mt-2">Llévatela a everywhere. Sin excusas.</span>
                  </p>
                </div>
              </div>
              
              <div className="group bg-[#18181b] border border-[#3f3f46] rounded-xl p-8 hover:border-[#eab308] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#eab308]/5 rounded-bl-full group-hover:bg-[#eab308]/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#eab308]/10 rounded-xl flex items-center justify-center group-hover:bg-[#eab308]/20 group-hover:scale-110 transition-all duration-300">
                      <History className="w-8 h-8 text-[#eab308]" />
                    </div>
                    <div className="w-px h-16 bg-[#3f3f46]" />
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        CONTROL TOTAL
                      </h3>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                        DE TU HISTORIAL
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#a1a1aa] text-lg leading-relaxed pl-20">
                    Cada serie, cada repetición, cada kilogramo queda registrado. 
                    <span className="text-white font-medium block mt-2">Mira cuánto levantaste y SUPERA ese número.</span>
                  </p>
                </div>
              </div>
              
              <div className="group bg-[#18181b] border border-[#3f3f46] rounded-xl p-8 hover:border-[#eab308] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#eab308]/5 rounded-bl-full group-hover:bg-[#eab308]/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#eab308]/10 rounded-xl flex items-center justify-center group-hover:bg-[#eab308]/20 group-hover:scale-110 transition-all duration-300">
                      <User className="w-8 h-8 text-[#eab308]" />
                    </div>
                    <div className="w-px h-16 bg-[#3f3f46]" />
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        TU GYMBRO
                      </h3>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                        DIGITAL
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#a1a1aa] text-lg leading-relaxed pl-20">
                    Tu compañero entrenando CONTIGO. Lleva la cuenta de tu disciplina 
                    <span className="text-white font-medium block mt-2">y te exige romper tus propios RÉCORDS.</span>
                  </p>
                </div>
              </div>
              
              <div className="group bg-[#18181b] border border-[#3f3f46] rounded-xl p-8 hover:border-[#eab308] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#eab308]/5 rounded-bl-full group-hover:bg-[#eab308]/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#eab308]/10 rounded-xl flex items-center justify-center group-hover:bg-[#eab308]/20 group-hover:scale-110 transition-all duration-300">
                      <Timer className="w-8 h-8 text-[#eab308]" />
                    </div>
                    <div className="w-px h-16 bg-[#3f3f46]" />
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        CRONÓMETRO
                      </h3>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#eab308]" style={{ fontFamily: "var(--font-oswald)" }}>
                        INTEGRADO
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#a1a1aa] text-lg leading-relaxed pl-20">
                    Descansa BETWEEN series. El timer corre automatically. 
                    <span className="text-white font-medium block mt-2">Enfócate en LO QUE IMPORTA: entrenar DURO.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-28 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#18181b] to-[#0a0a0a]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#eab308]/5 rounded-full blur-[120px]" />
          </div>
          
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-[#eab308]/10 border border-[#eab308]/30 rounded-full px-6 py-2 mb-6">
                <span className="w-2 h-2 bg-[#eab308] rounded-full animate-pulse" />
                <span className="text-[#eab308] text-sm font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                  NO ES SOLO OTRA WEB
                </span>
              </div>
              <h2 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <span className="text-white">LLEVA</span>
                <span className="text-[#eab308]"> </span>
                <span className="text-white">TU GYM</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#eab308] to-[#ca9a04]">EN EL BOLSILLO</span>
              </h2>
              <p className="text-[#71717a] text-xl md:text-2xl max-w-2xl mx-auto mt-6">
                Instálala en tu home screen y <span className="text-white font-bold">úsala como app native</span>. 
                Sin stores, sin downloads, sin BS.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#eab308] to-[#ca9a04] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500" />
                <div className="relative bg-[#18181b] border border-[#3f3f46] rounded-2xl p-8 hover:border-[#eab308] transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#eab308]/10 to-transparent rounded-bl-2xl" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#eab308] to-[#ca9a04] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                      <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85c-.3-.16-.69-.04-.85.26l-1.83 3.18c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.7c-.15-.31-.55-.42-.85-.26c-.31.15-.42.54-.26.85l1.83 3.18c-2.86 1.21-6.08 1.21-8.94 0L2.53 5.7c-.15-.31-.55-.42-.85-.26c-.31.15-.42.54-.26.85l1.84 3.18C1.22 9.37.01 10.83.01 12.37c0 2.22 1.21 4.22 3.05 5.34L2.53 19.5c-.15.31-.04.69.26.85.3.16.69.04.85-.26l1.83-3.18c2.86 1.21 6.08 1.21 8.94 0l1.83 3.18c.15.31.55.42.85.26.31-.15.42-.54.26-.85l-1.53-1.84c1.84-1.12 3.05-3.12 3.05-5.34c0-1.54-1.21-3-3.05-4.03zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                        <span className="text-white">ANDROID</span>
                      </h3>
                      <p className="text-[#71717a] text-sm">Chrome</p>
                    </div>
                  </div>

                  <div className="space-y-0">
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">1</span>
                      <span className="text-[#a1a1aa]">Abre <span className="text-white font-bold">Chrome</span> → totalgym.life</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">2</span>
                      <span className="text-[#a1a1aa]">Toca <span className="text-white font-bold">⋮</span> (menú)</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">3</span>
                      <span className="text-[#a1a1aa]"><span className="text-white font-bold">Instalar app</span></span>
                    </div>
                    <div className="flex items-center gap-4 py-3">
                      <span className="w-8 h-8 bg-[#22c55e] text-black font-bold rounded-lg flex items-center justify-center text-sm">✓</span>
                      <span className="text-[#22c55e] font-bold">LISTO EN SEGUNDOS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[#eab308] to-[#ca9a04] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500" />
                <div className="relative bg-[#18181b] border border-[#3f3f46] rounded-2xl p-8 hover:border-[#eab308] transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#eab308]/10 to-transparent rounded-bl-2xl" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#eab308] to-[#ca9a04] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                      <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47 1.34-.03 2.99-.92 3.42-2.04-.89-.83-2.22-1.49-3.5-1.49-2.72 0-4.93 2.2-4.93 4.93 0 .38.03.76.1 1.12-4.11-.2-7.76-2.18-10.2-5.18-2.26 3.9-3.59 8.39-1.32 12.3 1.03 1.33 2.33 2.4 4.41 3-1.74-.05-3.37-.53-4.77-1.31-.16.3-.29.61-.29.97 0 1.73 1.25 3.14 2.92 3.14-.23.2-.44.44-.61.68-.47.66-1.35 1.32-2.31 1.31-.18-.01-.35-.01-.52-.01 1.07 1.95 3.24 3.08 5.71 3.08-3.54 2.77-8.07 2.78-8.07 2.78h-.18c2.76 0 5.26-1.12 7.37-3.1 1.88-1.76 2.96-4.3 2.96-7.46 0-.61-.05-1.21-.16-1.79zM12.65 2.09c1.31 0 2.36 1.06 2.36 2.36s-1.06 2.36-2.36 2.36-2.36-1.06-2.36-2.36 1.06-2.36 2.36-2.36z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                        <span className="text-white">iPHONE</span>
                      </h3>
                      <p className="text-[#71717a] text-sm">Safari</p>
                    </div>
                  </div>

                  <div className="space-y-0">
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">1</span>
                      <span className="text-[#a1a1aa]">Abre <span className="text-white font-bold">Safari</span> → totalgym.life</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">2</span>
                      <span className="text-[#a1a1aa]">Toca <span className="text-white font-bold">Compartir</span> (□)</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border-[#3f3f46]/50">
                      <span className="w-8 h-8 bg-[#eab308] text-black font-bold rounded-lg flex items-center justify-center text-sm">3</span>
                      <span className="text-[#a1a1aa]"><span className="text-white font-bold">Agregar a inicio</span></span>
                    </div>
                    <div className="flex items-center gap-4 py-3">
                      <span className="w-8 h-8 bg-[#22c55e] text-black font-bold rounded-lg flex items-center justify-center text-sm">✓</span>
                      <span className="text-[#22c55e] font-bold">LISTO EN SEGUNDOS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-[#18181b]/50 border border-[#3f3f46] rounded-xl hover:border-[#eab308] transition-colors group">
                <div className="w-14 h-14 bg-[#eab308]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#eab308]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>SIN WAITING</h4>
                <p className="text-[#71717a] text-sm">Abre instant. No download, no install lag.</p>
              </div>
              <div className="text-center p-6 bg-[#18181b]/50 border border-[#3f3f46] rounded-xl hover:border-[#eab308] transition-colors group">
                <div className="w-14 h-14 bg-[#eab308]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#eab308]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H0m0 0h9.75m0 0l3 3m-3-3l3-3M9 5v.01M9 10v.01M9 15v.01M9 20v.01" />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>AUTO-UPDATE</h4>
                <p className="text-[#71717a] text-sm">Always latest version. Ningún manual update.</p>
              </div>
              <div className="text-center p-6 bg-[#18181b]/50 border border-[#3f3f46] rounded-xl hover:border-[#eab308] transition-colors group">
                <div className="w-14 h-14 bg-[#eab308]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#eab308]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>FEELS NATIVE</h4>
                <p className="text-[#71717a] text-sm">Full screen, sin Browser chrome BS.</p>
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
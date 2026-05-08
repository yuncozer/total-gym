"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Flame, Zap, ArrowRight, Calendar, User, Loader2, Play, Smartphone, History, Timer, ChevronDown, Activity, TrendingUp, Target } from "lucide-react";
import { AuthModal } from "@/app/components/AuthModal";
import { UserHeader } from "@/app/components/UserHeader";
import { GuestCarousel } from "@/app/components/GuestCarousel";
import { NotificationBanner } from "@/app/components/NotificationBanner";
import type { Session } from "@supabase/supabase-js";
import { getDailyQuote } from "@/lib/data/quote";
import { getDashboardStats, type DashboardStats } from "@/lib/workout/service";

export function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
      <span className="text-[#71717a] text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-oswald)" }}>
        Descubre más
      </span>
      <ChevronDown className="w-6 h-6 text-[#eab308]" />
    </div>
  );
}

function UserDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full max-w-4xl mx-auto">
      <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-xl p-3 sm:p-4 text-center hover:border-[#eab308] transition-colors">
        <Activity className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2" style={{ color: stats?.todayWorkout ? "#22c55e" : "#eab308" }} />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.todayWorkout ? "Sí" : "No"}
        </div>
        <div className="text-[#71717a] text-xs sm:text-sm">Entrenó</div>
      </div>
      <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-xl p-3 sm:p-4 text-center hover:border-[#eab308] transition-colors">
        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#eab308] mx-auto mb-1 sm:mb-2" />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.streak || 0}
        </div>
        <div className="text-[#71717a] text-xs sm:text-sm">Racha (días)</div>
      </div>
      <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-xl p-3 sm:p-4 text-center hover:border-[#eab308] transition-colors">
        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#eab308] mx-auto mb-1 sm:mb-2" />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.totalWorkouts || 0}
        </div>
        <div className="text-[#71717a] text-xs sm:text-sm">Workouts</div>
      </div>
      <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-xl p-3 sm:p-4 text-center hover:border-[#eab308] transition-colors">
        <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-[#eab308] mx-auto mb-1 sm:mb-2" />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.totalSets || 0}
        </div>
        <div className="text-[#71717a] text-xs sm:text-sm">Series</div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [pendingWorkout, setPendingWorkout] = useState<{ id: string; date: string; completed: number; total: number } | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const quote = getDailyQuote();
  const dateStr = getFormattedDate();

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch("/api/dashboard-stats");
      const dashboardStats = await response.json();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const checkPendingWorkout = async (supabaseClient: typeof supabase, userId: string) => {
    setCheckingPending(true);
    
    const { data: pending, error } = await supabaseClient
      .from("workouts")
      .select("id, date, started_at, status")
      .eq("user_id", userId)
      .neq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !pending) {
      setCheckingPending(false);
      return;
    }
    
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
    
    setCheckingPending(false);
  };

  useEffect(() => {
    async function initSupabase() {
      try {
        const { createBrowserClient } = await import("@supabase/ssr");
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
        );
        setSupabase(client);
      } catch (error) {
        console.error("Error initializing Supabase:", error);
        setAuthLoading(false);
      }
    }
    initSupabase();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      setAuthLoading(false);
      if (result.data.session?.user) {
        const userData = { 
          email: result.data.session.user.email || "", 
          id: result.data.session.user.id 
        };
        setUser(userData);
        checkPendingWorkout(supabase, result.data.session.user.id);
        loadStats();
      } else {
        setUser(null);
        setPendingWorkout(null);
        setStats(null);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setPendingWorkout(null);
        setStats(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const userData = { 
          email: session.user.email || "", 
          id: session.user.id 
        };
        setUser(userData);
        checkPendingWorkout(supabase, session.user.id);
        loadStats();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleStartTraining = () => {
    if (pendingWorkout) {
      router.push(`/workout/${pendingWorkout.id}`);
    } else if (user) {
      router.push("/entrenamiento");
    } else {
      router.push("/entrenamiento");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {authLoading && (
        <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <Dumbbell className="w-12 h-12 text-[#eab308] animate-pulse" />
            <Loader2 className="w-8 h-8 text-[#eab308] animate-spin" />
          </div>
        </div>
      )}

      <UserHeader />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <main className="pt-20">
        {!user && (
          <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6">
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

            <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
              <GuestCarousel onAuth={() => setShowAuthModal(true)} />
            </div>
            <ScrollIndicator />
          </section>
        )}

        <section id="daily-section" className={`relative ${!user ? 'py-20' : 'min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center'} overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#18181b] opacity-95" />
          {user && (
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          {!user && (
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#eab308]/5 rounded-full blur-[120px]" />
            </div>
          )}
          
          <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center ${user ? 'py-12' : ''}`}>
            {user && <UserDashboard stats={stats} loading={loadingStats} />}
            
            <div className="inline-flex items-center gap-2 bg-[#eab308]/10 border border-[#eab308]/30 rounded-full px-4 py-2 mb-6 sm:mb-8">
              <Calendar className="w-4 h-4 text-[#eab308]" />
              <span className="text-sm text-[#eab308] uppercase tracking-wider" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {dateStr}
              </span>
            </div>

            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-[#eab308]">CADA DÍA</span> <br />
              UNA NUEVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#eab308]">OPORTUNIDAD</span>
            </h1>

            <div className="bg-[#18181b]/80 border border-[#3f3f46] rounded-2xl p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 backdrop-blur-sm">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-[#eab308] mx-auto mb-3 sm:mb-4" />
              <p 
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
              {checkingPending ? (
                <button 
                  disabled
                  className="flex items-center justify-center gap-2 sm:gap-3 bg-[#27272a] text-[#71717a] font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl w-full sm:w-auto cursor-wait"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  VERIFICANDO...
                </button>
              ) : pendingWorkout ? (
                <button 
                  onClick={() => router.push(`/workout/${pendingWorkout.id}`)}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  CONTINUAR ({pendingWorkout.completed}/{pendingWorkout.total})
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={handleStartTraining}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-[#eab308] hover:bg-[#ca9a04] text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  COMENZAR RUTINA
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {user && !loadingStats && stats && !stats.todayWorkout && (
              <div className="mt-6">
                <NotificationBanner userId={user.id} />
              </div>
            )}
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
                      <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="5" y="2" width="14" height="20" rx="2" stroke="black"/>
                        <line x1="12" y1="6" x2="12" y2="6.01" strokeWidth="2"/>
                        <circle cx="12" cy="18" r="1"/>
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
                      <svg className="w-10 h-10 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C9.243 2 7 4.243 7 7v10c0 2.757 2.243 5 5 5s5-2.243 5-5V7c0-2.757-2.243-5-5-5z" fill="none" stroke="black"/>
                        <circle cx="12" cy="18" r="2" fill="black"/>
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
                  <svg className="w-7 h-7 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentModel">
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
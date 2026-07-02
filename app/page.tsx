"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Dumbbell, Flame, Zap, ArrowRight, Calendar, User, Loader2, Play, Smartphone, History, Timer, ChevronDown, Activity, TrendingUp, Target, RefreshCw, Sparkles, Brain } from "lucide-react";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { AuthModal } from "@/app/components/AuthModal";
import { UserHeader } from "@/app/components/UserHeader";
import { GuestCarousel } from "@/app/components/GuestCarousel";
import { NotificationButton } from "@/app/components/NotificationButton";
import { SmartCoach } from "@/app/components/SmartCoach";
import { CoachMarks } from "@/app/components/CoachMarks";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { useLanguage, strings, type StringKey, type Lang } from "@/lib/i18n";
import type { Session } from "@supabase/supabase-js";
import { getDailyQuote } from "@/lib/data/quote";
import { getDashboardStats, type DashboardStats } from "@/lib/workout/service";

export function getFormattedDate(lang: string): string {
  const now = new Date();
  return now.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ScrollIndicator() {
  const { t } = useLanguage();
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
      <span className="text-icon text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-oswald)" }}>
        {t("home.hero.subtitle")}
      </span>
      <ChevronDown className="w-6 h-6 text-accent" />
    </div>
  );
}

function getGreeting(lang: string): string {
  const hour = new Date().getHours();
  const key = hour < 12 ? "home.greeting.morning" : hour < 18 ? "home.greeting.afternoon" : "home.greeting.evening";
  return strings[key as StringKey]?.[lang as Lang] ?? key;
}

function getNameFromEmail(email: string): string {
  return email.split("@")[0] || "";
}

function UserDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full max-w-4xl mx-auto">
      <div className={`bg-card/80 border rounded-xl p-3 sm:p-4 text-center transition-all duration-300 hover:scale-105 ${stats?.todayWorkout ? "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]" : "border hover:border-accent"}`}>
        <Activity className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 ${stats?.todayWorkout ? "text-green-500" : "text-icon"}`} />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.todayWorkout ? t("home.stats.trainedYes") : t("home.stats.trainedNo")}
        </div>
        <div className="text-icon text-xs sm:text-sm">{t("home.stats.trainedLabel")}</div>
      </div>
      <div className={`bg-card/80 border rounded-xl p-3 sm:p-4 text-center transition-all duration-300 hover:scale-105 ${
        stats?.streak && stats.streak > 0
          ? "border-orange-500/40 shadow-[0_0_25px_rgba(249,115,22,0.2)] animate-[glowPulse_2s_ease-in-out_infinite]"
          : "border hover:border-accent"
      }`}>
        {stats?.streak && stats.streak > 0 ? (
          <div className="relative mx-auto w-6 h-6 sm:w-7 sm:h-7 mb-1 sm:mb-2">
            <Flame className="w-full h-full text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)] animate-bounce-check" />
            <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-lg animate-pulse" />
          </div>
        ) : (
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-icon" />
        )}
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.streak || 0}
        </div>
        <div className="text-icon text-xs sm:text-sm">
          {stats?.streak && stats.streak >= 7 ? "🔥 Imparable"
            : stats?.streak && stats.streak >= 3 ? "🔥 En racha"
            : stats?.streak && stats.streak > 0 ? "🔥 Racha activa"
            : t("home.stats.streakLabel")}
        </div>
      </div>
      <div className="bg-card/80 border border rounded-xl p-3 sm:p-4 text-center hover:border-accent transition-all duration-300 hover:scale-105">
        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent mx-auto mb-1 sm:mb-2" />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.totalWorkouts || 0}
        </div>
        <div className="text-icon text-xs sm:text-sm">{t("home.stats.workoutsLabel")}</div>
      </div>
      <div className="bg-card/80 border border rounded-xl p-3 sm:p-4 text-center hover:border-accent transition-all duration-300 hover:scale-105">
        <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-accent mx-auto mb-1 sm:mb-2" />
        <div className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
          {loading ? "..." : stats?.totalSets || 0}
        </div>
        <div className="text-icon text-xs sm:text-sm">{t("home.stats.setsLabel")}</div>
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
  const [showSmartCoach, setShowSmartCoach] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [receivedShares, setReceivedShares] = useState<any[]>([]);
  const [showSharesModal, setShowSharesModal] = useState(false);
  const modalShownRef = useRef(false);

  const { canInstall, installed, install } = useInstallPrompt();
  const { t, lang } = useLanguage();
  const quote = getDailyQuote();
  const dateStr = getFormattedDate(lang);

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
      .eq("status", "pendiente")
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

  useEffect(() => {
    if (!stats || !user) return;
    const seen = localStorage.getItem("totalgym_coach_seen");
    if (!seen && stats.totalWorkouts === 0) {
      const timer = setTimeout(() => setShowCoach(true), 800);
      return () => clearTimeout(timer);
    }
  }, [stats, user]);

  useEffect(() => {
    if (!user || modalShownRef.current) return;
    fetch("/api/friends/shares")
      .then(r => r.json())
      .then(data => {
        const received = data.received || [];
        setReceivedShares(received);
        if (received.length > 0) {
          modalShownRef.current = true;
          const timer = setTimeout(() => setShowSharesModal(true), 600);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});
  }, [user]);

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
    <div className="min-h-screen bg-background text-white">
      {authLoading && <LoadingScreen />}

      <UserHeader />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <main className="pt-20">
        {!user && (
          <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden px-4 sm:px-6">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card opacity-90" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

            <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
              <GuestCarousel onAuth={() => setShowAuthModal(true)} />
            </div>
            <ScrollIndicator />
          </section>
        )}

        <section id="daily-section" className={`relative ${!user ? 'py-20' : 'min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center'} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card opacity-95" />
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
            </div>
          )}

          <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center ${user ? 'py-12' : ''}`}>
            {user && <UserDashboard stats={stats} loading={loadingStats} />}

            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-6 sm:mb-8">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent uppercase tracking-wider" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {dateStr}
              </span>
            </div>

            {user && (
                <p className="text-accent text-lg sm:text-xl mb-2 font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {getGreeting(lang)}, {getNameFromEmail(user.email)}
              </p>
            )}

            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {user ? (
                <>{t("home.hero.loggedPart1") && <>{t("home.hero.loggedPart1")} </>}<span className="text-accent">{t("home.hero.loggedPart2")}</span></>
              ) : (
                <>
                  <span className="text-accent">{t("home.hero.guestPart1")}</span> <br />
                  <>{t("home.hero.guestPart2")} </><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-accent">{t("home.hero.guestPart3")}</span>
                </>
              )}
            </h1>

            <div className={`bg-card/80 border border-accent/20 backdrop-blur-sm animate-[fadeInUp_0.6s_ease-out] ${user ? "rounded-xl p-6 sm:p-8 mb-6 sm:mb-8 max-w-2xl mx-auto shadow-[0_0_40px_rgba(234,179,8,0.06)] hover:shadow-[0_0_60px_rgba(234,179,8,0.12)] transition-shadow duration-500" : "rounded-2xl p-6 sm:p-8 md:p-10 mb-6 sm:mb-8"}`}>
              <p
                className={`font-semibold leading-relaxed text-white ${user ? "text-lg sm:text-xl" : "text-lg sm:text-xl md:text-2xl lg:text-3xl"}`}
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-5 justify-center items-center w-full">
              {checkingPending ? (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 sm:gap-3 bg-muted text-icon font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl w-full sm:w-auto cursor-wait"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  {t("home.cta.verifying")}
                </button>
              ) : pendingWorkout ? (
                <button
                  onClick={() => router.push(`/workout/${pendingWorkout.id}`)}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-green-500 hover:bg-green-600 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("home.cta.continue")} ({pendingWorkout.completed}/{pendingWorkout.total})
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : user && stats && (stats.totalWorkouts ?? 0) === 0 ? (
                <>
                  <button
                    onClick={() => setShowSmartCoach(true)}
                    className="group relative w-full max-w-sm bg-gradient-to-b from-accent to-amber-500 text-black font-bold px-8 py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-accent/30 animate-[glowPulse_3s_ease-in-out_infinite] overflow-hidden"
                    style={{ fontFamily: "var(--font-oswald)", fontSize: "1.1rem" }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span className="animate-ia-sparkle">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      MI PRIMERA RUTINA
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-bold tracking-wider text-accent ring-1 ring-accent/40 shadow-sm animate-ia-badge">
                        ✦ IA
                      </span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
                  </button>
                  <button
                    onClick={handleStartTraining}
                    className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer py-1"
                  >
                    Elegir yo mismo <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              ) : user ? (
                <>
                  <button
                    onClick={handleStartTraining}
                    className="group flex items-center justify-center gap-3 w-full max-w-sm bg-gradient-to-b from-accent to-accent-hover text-black font-bold px-8 py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40"
                    style={{ fontFamily: "var(--font-oswald)", fontSize: "1.05rem" }}
                  >
                    <Zap className="w-5 h-5" />
                    {t("home.cta.start")}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setShowSmartCoach(true)}
                    className="group relative w-full max-w-sm bg-gradient-to-b from-accent/90 to-amber-600/90 text-white font-bold px-6 py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-lg shadow-accent/20 overflow-hidden animate-ia-gradient"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span className="animate-ia-sparkle">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      RUTINA SMART
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-bold tracking-wider text-accent ring-1 ring-accent/40 shadow-sm animate-ia-badge">
                        ✦ IA
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartTraining}
                  className="group flex items-center justify-center gap-2 sm:gap-3 bg-accent hover:bg-accent-hover text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all hover:scale-105 cursor-pointer w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("home.cta.start")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {user && !pendingWorkout && !checkingPending && stats && !stats.todayWorkout && stats.totalWorkouts > 0 && (
              <p className="text-icon text-xs sm:text-sm mt-3">
                {t("home.cta.notTrainedToday")}
              </p>
            )}
          </div>
        </section>

        <section className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, var(--accent) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--accent) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-white">{t("home.features.title1")} </span>
              <span className="text-accent">{t("home.features.title2")}</span>
            </h2>
            <p className="text-icon text-center text-lg mb-16 max-w-2xl mx-auto">
              {t("home.features.subtitle")}
            </p>

            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              <div className="group bg-card border border rounded-xl p-8 hover:border-accent hover:shadow-accent/15 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-accent/5 rounded-br-full group-hover:bg-accent/10 transition-colors" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <Smartphone className="w-8 h-8 text-accent" />
                </div>
                <div className="w-px h-16 bg-zinc-700" />
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card1.title1")}
                  </h3>
                  <h3 className="text-2xl md:text-3xl font-bold text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card1.title2")}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pl-20">
                {t("feature.card1.desc1")}
                <span className="text-white font-medium block mt-2">{t("feature.card1.desc2")}</span>
              </p>
            </div>
          </div>

          <div className="group bg-card border border rounded-xl p-8 hover:border-accent hover:shadow-accent/15 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full group-hover:bg-accent/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-4 flex-row-reverse">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <History className="w-8 h-8 text-accent" />
                </div>
                <div className="w-px h-16 bg-zinc-700" />
                <div className="flex-1 text-right">
                  <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card2.title1")}
                  </h3>
                  <h3 className="text-2xl md:text-3xl font-bold text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card2.title2")}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pr-20 text-right">
                {t("feature.card2.desc1")}
                <span className="text-white font-medium block mt-2">{t("feature.card2.desc2")}</span>
              </p>
            </div>
          </div>

          <div className="group bg-card border border rounded-xl p-8 hover:border-accent hover:shadow-accent/15 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-accent/5 rounded-br-full group-hover:bg-accent/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <div className="w-px h-16 bg-zinc-700" />
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card3.title1")}
                  </h3>
                  <h3 className="text-2xl md:text-3xl font-bold text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card3.title2")}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pl-20">
                {t("feature.card3.desc1")}
                <span className="text-white font-medium block mt-2">{t("feature.card3.desc2")}</span>
              </p>
            </div>
          </div>

          <div className="group bg-card border border rounded-xl p-8 hover:border-accent hover:shadow-accent/15 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full group-hover:bg-accent/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-4 flex-row-reverse">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <Timer className="w-8 h-8 text-accent" />
                </div>
                <div className="w-px h-16 bg-zinc-700" />
                <div className="flex-1 text-right">
                  <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card4.title1")}
                  </h3>
                  <h3 className="text-2xl md:text-3xl font-bold text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                    {t("feature.card4.title2")}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pr-20 text-right">
                {t("feature.card4.desc1")}
                <span className="text-white font-medium block mt-2">{t("feature.card4.desc2")}</span>
              </p>
            </div>
          </div>
            </div>
          </div>
        </section>

        <section className="py-28 bg-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/5 rounded-full blur-[130px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2.5 bg-accent/10 border border-accent/30 rounded-full px-5 py-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-accent text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                  RUTINA SMART
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-[10px] font-bold text-accent tracking-wider border border-accent/30">
                  ✦ IA
                </span>
              </div>
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              <span className="text-white">Tu coach con </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-400">Inteligencia Artificial</span>
            </h2>
            <p className="text-muted-foreground text-center text-lg mb-16 max-w-2xl mx-auto">
              Dile qué quieres lograr, cuánto tiempo tienes y qué músculos trabajar.
              El coach IA analiza más de <span className="text-white font-semibold">120 ejercicios curados</span> y arma la rutina perfecta al instante.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-16">
              {[
                { icon: Target, label: "Objetivo", desc: "Fuerza, hipertrofia, resistencia o general", color: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/10" },
                { icon: Timer, label: "Duración", desc: "15, 30, 45 o 60 minutos exactos", color: "text-red-500", border: "border-red-500/30", bg: "bg-red-500/10" },
                { icon: Dumbbell, label: "Músculos", desc: "Elige uno o varios grupos musculares", color: "text-accent", border: "border-accent/30", bg: "bg-accent/10" },
                { icon: Brain, label: "IA genera", desc: "Selección inteligente de ejercicios", color: "text-green-500", border: "border-green-500/30", bg: "bg-green-500/10" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="group relative">
                    <div className={`absolute -inset-0.5 ${item.bg} rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`relative bg-card border ${item.border} rounded-2xl p-5 md:p-6 text-center hover:border-white/20 transition-all duration-300`}>
                      <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <h3 className="text-white font-bold text-sm md:text-base mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                        {item.label}
                      </h3>
                      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto p-6 md:p-8 bg-card border border-accent/10 rounded-2xl">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 md:gap-8">
                {[
                  { value: "122", label: "Ejercicios curados", color: "text-accent" },
                  { value: "9", label: "Grupos musculares", color: "text-accent" },
                  { value: "4", label: "Objetivos", color: "text-accent" },
                  { value: "Patrones", label: "de movimiento", color: "text-icon" },
                ].map((stat, i) => (
                  <div key={i} className="text-center md:text-left">
                    <div className={`text-2xl md:text-3xl font-bold ${stat.color}`} style={{ fontFamily: "var(--font-oswald)" }}>
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">{stat.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSmartCoach(true)}
                className="group relative flex items-center justify-center gap-2.5 shrink-0 w-full md:w-auto bg-gradient-to-b from-accent to-amber-500 hover:to-amber-400 text-black font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-[0.97] cursor-pointer shadow-lg shadow-accent/30 overflow-hidden"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  <span className="animate-ia-sparkle">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  PRUEBA RUTINA SMART
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
              </button>
            </div>
          </div>
        </section>

        {!installed && (
        <section className="py-28 bg-background relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
          </div>

            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-full px-6 py-2 mb-6">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-accent text-sm font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                  {t("home.pwa.badge")}
                </span>
              </div>
              <h2
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                <span className="text-white">{t("home.pwa.title1")}</span>
                <span className="text-accent"> </span>
                <span className="text-white">{t("home.pwa.title2")}</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">{t("home.pwa.title3")}</span>
              </h2>
              <p className="text-icon text-xl md:text-2xl max-w-2xl mx-auto mt-6">
                {t("home.pwa.subtitle")}
              </p>
            </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative flex">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent to-accent-hover rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500" />
                <div className="relative flex flex-col bg-card border border rounded-2xl p-8 hover:border-accent transition-all duration-300 w-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-2xl" />

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Image src="/images/icons/android.png" alt="Android" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                        <span className="text-white">{t("home.pwa.android")}</span>
                      </h3>
                      <p className="text-icon text-sm">Chrome</p>
                    </div>
                  </div>

                  {canInstall ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                      <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-5 py-2 mb-5">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <span className="text-accent text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                          {t("home.pwa.oneClick")}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-base leading-relaxed mb-6">
                        {t("home.pwa.bannerCta")}
                      </p>
                      <button
                        onClick={install}
                        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 cursor-pointer"
                        style={{ fontFamily: "var(--font-oswald)" }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t("home.pwa.installBtn")}
                      </button>
                      <p className="text-zinc-600 text-xs mt-4">
                        {t("home.pwa.fallback")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-4 py-3 border-b border/50">
                        <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">1</span>
                        <span className="text-muted-foreground">{t("home.pwa.step1")}</span>
                      </div>
                      <div className="flex items-center gap-4 py-3 border-b border/50">
                        <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">2</span>
                        <span className="text-muted-foreground">{t("home.pwa.step2Android")}</span>
                      </div>
                      <div className="flex items-center gap-4 py-3 border-b border/50">
                        <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">3</span>
                        <span className="text-muted-foreground"><span className="text-white font-bold">{t("home.pwa.step3Android")}</span></span>
                      </div>
                      <div className="flex items-center gap-4 py-3">
                      <span className="w-8 h-8 bg-green-500 text-black font-bold rounded-lg flex items-center justify-center text-sm">✓</span>
                      <span className="text-green-500 font-bold">{t("home.pwa.done")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="group relative flex">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-accent to-accent-hover rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500" />
                <div className="relative flex flex-col bg-card border border rounded-2xl p-8 hover:border-accent transition-all duration-300 w-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-2xl" />

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Image src="/images/icons/apple.png" alt="iPhone" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--font-oswald)" }}>
                        <span className="text-white">{t("home.pwa.iphone")}</span>
                      </h3>
                      <p className="text-icon text-sm">Safari</p>
                    </div>
                  </div>

                  <div className="space-y-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-4 py-3 border-b border/50">
                      <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">1</span>
                      <span className="text-muted-foreground">{t("home.pwa.step1iOS")}</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border/50">
                      <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">2</span>
                      <span className="text-muted-foreground">{t("home.pwa.step2iOS")}</span>
                    </div>
                    <div className="flex items-center gap-4 py-3 border-b border/50">
                      <span className="w-8 h-8 bg-accent text-black font-bold rounded-lg flex items-center justify-center text-sm">3</span>
                      <span className="text-muted-foreground"><span className="text-white font-bold">{t("home.pwa.step3iOS")}</span></span>
                    </div>
                    <div className="flex items-center gap-4 py-3">
                    <span className="w-8 h-8 bg-green-500 text-black font-bold rounded-lg flex items-center justify-center text-sm">✓</span>
                    <span className="text-green-500 font-bold">{t("home.pwa.done")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-card/50 border border rounded-xl hover:border-accent transition-colors group">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>{t("home.mini.waiting")}</h4>
                <p className="text-icon text-sm">{t("home.mini.waitingDesc")}</p>
              </div>
              <div className="text-center p-6 bg-card/50 border border rounded-xl hover:border-accent transition-colors group">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <RefreshCw className="w-7 h-7 text-accent" />
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>{t("home.mini.update")}</h4>
                <p className="text-icon text-sm">{t("home.mini.updateDesc")}</p>
              </div>
              <div className="text-center p-6 bg-card/50 border border rounded-xl hover:border-accent transition-colors group">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>{t("home.mini.native")}</h4>
                <p className="text-icon text-sm">{t("home.mini.nativeDesc")}</p>
              </div>
            </div>
          </div>
        </section>
        )}
      </main>

      {user && !loadingStats && stats && !stats.todayWorkout && (
        <div className="mt-6">
          <NotificationButton userId={user.id} />
        </div>
      )}
      {showSmartCoach && (
        <SmartCoach
          onClose={() => setShowSmartCoach(false)}
          userName={user ? getNameFromEmail(user.email) : undefined}
        />
      )}
      {showCoach && (
        <CoachMarks onDone={() => {
          setShowCoach(false);
          if (stats?.totalWorkouts === 0) {
            setShowSmartCoach(true);
          }
        }} />
      )}
      {showSharesModal && receivedShares.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSharesModal(false)}>
          <div className="w-full max-w-sm bg-card border border rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📩</span>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
                  {receivedShares.length === 1 ? "Recibiste una rutina" : `Recibiste ${receivedShares.length} rutinas`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {receivedShares.length === 1 ? "Un amigo compartió una rutina con vos" : "Tus amigos compartieron rutinas con vos"}
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {receivedShares.map((share: any) => (
                <div key={share.id} className="flex items-center gap-3 px-3 py-2.5 bg-muted rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                      {(share.senderEmail || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{share.senderEmail}</p>
                    <p className="text-xs text-icon truncate">{share.workoutName}</p>
                  </div>
                  <Link
                    href={`/shared-friend/${share.workoutId}`}
                    onClick={() => setShowSharesModal(false)}
                    className="bg-accent hover:bg-accent-hover text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSharesModal(false)}
              className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-white bg-muted rounded-xl transition-colors cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
      <footer className="bg-background border-t border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 mb-10">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Image
                  src="/logo.png"
                  alt="TOTAL GYM"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
                  TOTAL<span className="text-accent">GYM</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto md:mx-0">
                {t("footer.description")}
              </p>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                {t("footer.navigation")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-muted-foreground text-sm hover:text-white transition-colors">{t("footer.home")}</Link>
                </li>
                <li>
                  <Link href="/entrenamiento" className="text-muted-foreground text-sm hover:text-white transition-colors">{t("footer.training")}</Link>
                </li>
                <li>
                  <Link href="/historial" className="text-muted-foreground text-sm hover:text-white transition-colors">{t("footer.history")}</Link>
                </li>
                <li>
                  <Link href="/progreso" className="text-muted-foreground text-sm hover:text-white transition-colors">{t("footer.progress")}</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-center">
            <p className="text-muted-foreground text-xs">
              © 2026 TOTAL GYM. {t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
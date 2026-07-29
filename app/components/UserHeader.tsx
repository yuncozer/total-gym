"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, LogIn, ChevronDown, User, History, TrendingUp, Shield, Loader2, BarChart3, Globe, Users, Dumbbell, Bell } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { useTrainer } from "@/lib/trainer/hooks";
import { TrainerPendingInvitesModal } from "./TrainerPendingInvitesModal";

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
}

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function UserHeader({ showBack = false, backHref = "/" }: UserHeaderProps) {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { isTrainer } = useTrainer();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadShares, setUnreadShares] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    supabase.auth.getSession().then((result: { data: { session: { user: { email: string } } | null } }) => {
      if (result.data.session) {
        setUser({ email: result.data.session.user.email });
      }
      setLoading(false);
    });
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    async function fetchPending() {
      try {
        const [friendsRes, sharesRes, invitesRes] = await Promise.all([
          fetch("/api/friends"),
          fetch("/api/friends/shares"),
          isTrainer ? fetch("/api/trainer/pending-invites") : Promise.resolve(new Response('{"count": 0}')),
        ]);
        if (friendsRes.ok) {
          const data = await friendsRes.json();
          setPendingRequests(data.incoming?.length || 0);
        }
        if (sharesRes.ok) {
          const sharesData = await sharesRes.json();
          setUnreadShares(sharesData.received?.length || 0);
        }
        if (invitesRes.ok) {
          const invitesData = await invitesRes.json();
          setPendingInvites(invitesData.count || 0);
        }
      } catch {}
    }
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [user, isTrainer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setSigningOut(false);
    router.refresh();
  };

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="w-[36px] h-[36px] bg-muted animate-pulse rounded-lg" />
          <div className="w-28 h-8 bg-muted animate-pulse rounded" />
          <div className="w-[36px] h-[36px] bg-muted animate-pulse rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 w-[140px]">
          {showBack ? (
            <Link 
              href={backHref}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              <span className="text-sm font-medium">{t("header.back")}</span>
            </Link>
          ) : (
            <Link href="/">
              <Image
                src="/logo.png"
                alt="TOTAL GYM"
                width={36}
                height={36}
                className="object-contain"
              />
            </Link>
          )}
        </div>

        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-accent">GYM</span>
          </span>
          <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase mt-0.5">Beta Version</span>
        </div>

        <div className="flex items-center gap-2 justify-end" ref={dropdownRef}>
          {user ? (
            <>
              {isTrainer && (
                <button
                  onClick={() => setShowPendingModal(true)}
                  className={`relative flex items-center justify-center sm:gap-2 w-9 h-9 sm:w-auto sm:pl-2.5 sm:pr-3.5 bg-gradient-to-b from-card to-[#0e0e10] border rounded-full transition-all duration-300 cursor-pointer group ${
                    pendingInvites > 0
                      ? "border-accent/40"
                      : "border hover:border-accent/50 hover:shadow-[0_0_14px_rgba(234,179,8,0.2)]"
                  }`}
                >
                  <Bell className="w-4 h-4 text-icon group-hover:text-accent transition-colors duration-300" />
                  <span className="hidden sm:inline text-xs font-semibold text-muted-foreground group-hover:text-white transition-colors duration-300" style={{ fontFamily: "var(--font-oswald)", letterSpacing: "0.05em" }}>
                    {t("trainer.invites") || "Invitaciones"}
                  </span>
                  {pendingInvites > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-black text-[10px] font-bold rounded-full px-1 leading-none animate-[friends-pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                      {pendingInvites > 9 ? "9+" : pendingInvites}
                    </span>
                  )}
                </button>
              )}
              <Link
                href="/amigos"
                className={`relative flex items-center justify-center sm:gap-2 w-9 h-9 sm:w-auto sm:pl-2.5 sm:pr-3.5 bg-gradient-to-b from-card to-[#0e0e10] border rounded-full transition-all duration-300 cursor-pointer group ${
                  pendingRequests > 0 || unreadShares > 0
                    ? "border-accent/40"
                    : "border hover:border-accent/50 hover:shadow-[0_0_14px_rgba(234,179,8,0.2)]"
                }`}
              >
                <Users className="w-4 h-4 text-icon group-hover:text-accent transition-colors duration-300" />
                <span className="hidden sm:inline text-xs font-semibold text-muted-foreground group-hover:text-white transition-colors duration-300" style={{ fontFamily: "var(--font-oswald)", letterSpacing: "0.05em" }}>
                  {t("header.friends")}
                </span>
                {pendingRequests > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-black text-[10px] font-bold rounded-full px-1 leading-none animate-[friends-pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                    {pendingRequests > 9 ? "9+" : pendingRequests}
                  </span>
                )}
                {unreadShares > 0 && !pendingRequests && (
                  <span className="absolute -bottom-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full px-1 leading-none shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                    {unreadShares > 9 ? "9+" : unreadShares}
                  </span>
                )}
                {unreadShares > 0 && pendingRequests > 0 && (
                  <>
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-black text-[10px] font-bold rounded-full px-1 leading-none animate-[friends-pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                      {pendingRequests > 9 ? "9+" : pendingRequests}
                    </span>
                    <span className="absolute -bottom-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full px-1 leading-none shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                      {unreadShares > 9 ? "9+" : unreadShares}
                    </span>
                  </>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 py-1.5 pl-1.5 pr-3 bg-gradient-to-b from-card to-[#0e0e10] border rounded-full transition-all duration-300 cursor-pointer group ${
                    showDropdown
                      ? "border-accent/60 shadow-[0_0_16px_rgba(234,179,8,0.25)]"
                      : "border hover:border-accent/50 hover:shadow-[0_0_14px_rgba(234,179,8,0.2)]"
                  }`}
                >
                  <div className="relative w-7 h-7 rounded-full bg-[#0a0a0b] border-2 border-accent/80 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:border-accent group-hover:shadow-[0_0_10px_rgba(234,179,8,0.35)]">
                    <span className="text-accent font-bold text-[11px] leading-none" style={{ fontFamily: "var(--font-oswald)" }}>
                      {getInitials(user.email)}
                    </span>
                    {showDropdown && (
                      <span className="absolute inset-0 rounded-full animate-[medallion-pulse_2s_ease-in-out_infinite]" />
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-all duration-300 ${showDropdown ? 'rotate-180 text-accent' : 'group-hover:text-white'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-card to-[#0e0e10] border border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                  <div className="px-4 py-3 border-b border">
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/historial"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <History className="w-4 h-4" />
                      <span className="text-sm">{t("header.historial")}</span>
                    </Link>
                    <Link
                      href="/progreso"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">{t("header.progreso")}</span>
                    </Link>
                    <Link
                      href="/estadisticas"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">{t("header.estadisticas")}</span>
                    </Link>
                    <Link
                      href="/amigos"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{t("header.friends")}</span>
                    </Link>
                    {isTrainer && (
                      <Link
                        href="/entrenador"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                      >
                        <Dumbbell className="w-4 h-4" />
                        <span className="text-sm">{t("header.trainer")}</span>
                      </Link>
                    )}
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">{t("header.admin")}</span>
                    </Link>
                    <Link
                      href="/perfil"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-gradient-to-r hover:from-accent/5 hover:to-transparent hover:text-white transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-accent/40"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">{t("header.perfil")}</span>
                    </Link>
                    <div className="border-t border my-1" />
                    <div className="px-4 py-2">
                      <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">{t("header.language")}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setLang("es")}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                            lang === "es"
                              ? "bg-accent text-black"
                              : "bg-muted text-muted-foreground hover:text-white"
                          }`}
                        >
                          ES
                        </button>
                        <button
                          onClick={() => setLang("en")}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                            lang === "en"
                              ? "bg-accent text-black"
                              : "bg-muted text-muted-foreground hover:text-white"
                          }`}
                        >
                          EN
                        </button>
                      </div>
                    </div>
                    <div className="border-t border my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-500 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{t("header.signOut")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("header.login")}</span>
            </Link>
          )}
        </div>
      </div>

      {signingOut && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-white font-medium">{t("header.signingOut")}</p>
          </div>
        </div>
      )}

      <TrainerPendingInvitesModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        onRefresh={() => {
          setPendingInvites((prev) => Math.max(0, prev - 1));
        }}
      />
    </header>
  );
}
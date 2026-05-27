"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, ChevronDown, User, History, TrendingUp, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
}

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function UserHeader({ showBack = false, backHref = "/" }: UserHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
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
          <div className="w-20 h-8 bg-muted animate-pulse rounded" />
          <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-accent">GYM</span>
          </span>
          <div className="w-20 h-8 bg-muted animate-pulse rounded" />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link 
              href={backHref}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              <span className="text-sm font-medium">VOLVER</span>
            </Link>
          )}
        </div>
        
        <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
          TOTAL<span className="text-accent">GYM</span>
        </span>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 py-1 pr-1.5 bg-card border border rounded-full hover:border-accent hover:shadow-[0_0_12px_rgba(234,179,8,0.3)] transition-all duration-200 cursor-pointer"
              >
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-[10px] leading-none">{getInitials(user.email)}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-icon transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border">
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/historial"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <History className="w-4 h-4" />
                      <span className="text-sm">Historial</span>
                    </Link>
                    <Link
                      href="/progreso"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Progreso</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Admin</span>
                    </Link>
                    <Link
                      href="/perfil"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Mi Perfil</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-500 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>LOGIN</span>
            </Link>
          )}
        </div>
      </div>

      {signingOut && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-white font-medium">Cerrando sesión...</p>
          </div>
        </div>
      )}
    </header>
  );
}
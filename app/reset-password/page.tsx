"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Save, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseClient, updatePassword } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Status = "verifying" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [status, setStatus] = useState<Status>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const supabase = getSupabaseClient();
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      if (url.searchParams.get("error") || hash.get("error")) {
        if (!cancelled) setStatus("invalid");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setStatus(error ? "invalid" : "ready");
        window.history.replaceState({}, "", url.pathname);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelled) setStatus(data.session ? "ready" : "invalid");
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("reset.tooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("reset.mismatch"));
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/entrenamiento"), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/login"
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t("login.back")}</span>
          </Link>
          <span className="text-xl font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-accent">GYM</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("reset.title").replace(t("reset.titlePart2"), "").trim()}{" "}
              <span className="text-accent">{t("reset.titlePart2")}</span>
            </h1>
            <p className="text-muted-foreground">{t("reset.subtitle")}</p>
          </div>

          {status === "verifying" && (
            <p className="text-center text-muted-foreground animate-pulse">{t("reset.verifying")}</p>
          )}

          {status === "invalid" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t("reset.invalidLink")}</span>
              </div>
              <Link
                href="/recuperar"
                className="flex items-center justify-center gap-2 w-full py-4 border-2 border-accent/50 text-accent hover:bg-accent/10 font-bold rounded-xl transition-colors"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {t("reset.requestNew")}
              </Link>
            </div>
          )}

          {status === "ready" && (
            success ? (
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t("reset.success")}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    {t("reset.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-card border border rounded-xl text-white placeholder-icon focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    {t("reset.confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3 bg-card border border rounded-xl text-white placeholder-icon focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  {loading ? (
                    <span className="animate-pulse">{t("reset.saving")}</span>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t("reset.submit")}
                    </>
                  )}
                </button>
              </form>
            )
          )}
        </div>
      </main>
    </div>
  );
}

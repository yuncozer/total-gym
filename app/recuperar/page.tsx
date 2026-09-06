"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function RecuperarPage() {
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await sendPasswordResetEmail(email.trim());

    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
              {t("forgot.title").replace(t("forgot.titlePart2"), "").trim()}{" "}
              <span className="text-accent">{t("forgot.titlePart2")}</span>
            </h1>
            <p className="text-muted-foreground">{t("forgot.subtitle")}</p>
          </div>

          {sent ? (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{t("forgot.sent")}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("forgot.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    required
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
                  <span className="animate-pulse">{t("forgot.sending")}</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("forgot.submit")}
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-accent hover:underline font-medium cursor-pointer">
              {t("forgot.backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

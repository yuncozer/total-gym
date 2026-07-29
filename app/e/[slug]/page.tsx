"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Loader2, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

interface PublicTrainer {
  displayName: string;
  bio: string | null;
  specialty: string | null;
  activeClientCount: number;
}

export default function PublicTrainerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [trainer, setTrainer] = useState<PublicTrainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ alreadyRequested?: boolean; alreadyClient?: boolean; inviteToken?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/trainers/${slug}`)
      .then(async (res) => {
        if (!res.ok) return;
        setTrainer(await res.json());
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/trainers/${slug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar tu solicitud");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar tu solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
        <p className="text-white font-medium mb-2">Entrenador no encontrado</p>
        <Link href="/" className="text-accent text-sm hover:underline">Ir a TOTAL GYM</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Salir</span>
          </Link>
          <span className="text-base font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-oswald)" }}>
            TOTAL<span className="text-accent">GYM</span>
          </span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-16">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#0a0a0b] border-2 border-accent/70 flex items-center justify-center mx-auto mb-4 shadow-[0_0_28px_rgba(234,179,8,0.25)]">
            <span className="text-3xl font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
              {trainer.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
            {trainer.displayName}
          </h1>
          {trainer.specialty && (
            <p className="text-sm text-accent font-semibold">{trainer.specialty}</p>
          )}
          {trainer.activeClientCount > 0 && (
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
              <Users className="w-3.5 h-3.5" />
              {trainer.activeClientCount} {trainer.activeClientCount === 1 ? "persona entrena" : "personas entrenan"} con {trainer.displayName.split(" ")[0]}
            </p>
          )}
        </div>

        {trainer.bio && (
          <div className="bg-card/60 border border rounded-xl p-4 mb-6">
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{trainer.bio}</p>
          </div>
        )}

        {result ? (
          <div className="bg-card border border-accent/30 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-3" />
            {result.alreadyClient ? (
              <p className="text-sm text-white">Ya eres cliente de {trainer.displayName}. Abre la app e inicia sesión para ver tu progreso.</p>
            ) : result.inviteToken ? (
              <>
                <p className="text-sm text-white mb-4">
                  {result.alreadyRequested
                    ? `Ya habías enviado tu solicitud a ${trainer.displayName}. Si ya tienes cuenta, inicia sesión para vincularte; si no, crea una.`
                    : `¡Listo! Crea tu cuenta (o inicia sesión si ya tienes una) para que ${trainer.displayName} pueda armar tu plan.`}
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/register?invite=${result.inviteToken}`}
                    className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    CREAR MI CUENTA
                  </Link>
                  <Link
                    href={`/login?invite=${result.inviteToken}`}
                    className="inline-flex items-center justify-center gap-2 text-accent hover:text-accent-hover text-sm font-semibold px-6 py-2 transition-colors cursor-pointer"
                  >
                    Ya tengo cuenta, iniciar sesión
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-white">Ya enviaste tu solicitud a {trainer.displayName}. Te contactará pronto.</p>
            )}
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="bg-card border border rounded-2xl p-5 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
              disabled={submitting}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              required
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
              disabled={submitting}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar solicitud"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold py-4 rounded-xl transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <Sparkles className="w-5 h-5" />
            QUIERO ENTRENAR CONTIGO
          </button>
        )}

        <p className="text-[10px] text-icon/40 text-center mt-6">
          Impulsado por TOTAL GYM
        </p>
      </main>
    </div>
  );
}

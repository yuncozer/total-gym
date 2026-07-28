"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { UserPlus, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { TrainerClientAddedCelebration } from "@/app/components/TrainerClientAddedCelebration";

export default function NewTrainerClientPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; displayName: string; clientCount: number } | null>(null);

  const resetForm = () => {
    setDisplayName("");
    setEmail("");
    setPhone("");
    setGoal("");
    setCreated(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError(t("trainer.nameRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/trainer/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          goal: goal.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("trainer.createError"));
      }

      const data = await res.json();

      let clientCount = 1;
      try {
        const listRes = await fetch("/api/trainer/clients");
        if (listRes.ok) {
          const listData = await listRes.json();
          clientCount = (listData.clients || []).length || 1;
        }
      } catch {}

      setCreated({ id: data.client.id, displayName: data.client.displayName, clientCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("trainer.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {created && (
        <TrainerClientAddedCelebration
          clientName={created.displayName}
          clientCount={created.clientCount}
          onViewClient={() => router.push(`/entrenador/clientes/${created.id}`)}
          onAddAnother={resetForm}
          onClose={() => router.push(`/entrenador/clientes/${created.id}`)}
        />
      )}

      <main className="max-w-lg mx-auto px-4 py-8 pt-24">
        <button
          onClick={() => router.push("/entrenador")}
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("trainer.back")}
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("trainer.newClientTitle")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border rounded-2xl p-5 space-y-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("trainer.newClientNamePlaceholder")}
            className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
            disabled={submitting}
          />

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("trainer.newClientEmailPlaceholder")}
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
              disabled={submitting}
            />
            <p className="text-icon text-xs mt-1.5">{t("trainer.newClientEmailHint")}</p>
          </div>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("trainer.newClientPhonePlaceholder")}
            className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
            disabled={submitting}
          />

          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t("trainer.newClientGoalPlaceholder")}
            className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
            disabled={submitting}
          />

          {error && (
            <p className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !displayName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("trainer.creating")}
              </>
            ) : (
              t("trainer.create")
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

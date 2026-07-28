"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, ArrowUp, ArrowDown, Minus, Loader2, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface CheckinResult {
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
}

interface CheckinDeltas {
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
}

const FIELDS: { key: keyof CheckinResult; labelKey: string; unit: string }[] = [
  { key: "weightKg", labelKey: "checkin.weight", unit: "kg" },
  { key: "waistCm", labelKey: "checkin.waist", unit: "cm" },
  { key: "chestCm", labelKey: "checkin.chest", unit: "cm" },
  { key: "armCm", labelKey: "checkin.arm", unit: "cm" },
  { key: "thighCm", labelKey: "checkin.thigh", unit: "cm" },
];

function DeltaBadge({ value, unit }: { value: number | null; unit: string }) {
  if (value == null || value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-icon">
        <Minus className="w-3 h-3" />
        {value === 0 ? `0 ${unit}` : ""}
      </span>
    );
  }
  const isUp = value > 0;
  return (
    <span className="flex items-center gap-1 text-xs text-accent font-semibold">
      {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value)} {unit}
    </span>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ checkin: CheckinResult; previous: CheckinResult | null; deltas: CheckinDeltas } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, number | string | undefined> = { notes: notes.trim() || undefined };
    for (const field of FIELDS) {
      const raw = values[field.key];
      if (raw && raw.trim() !== "") {
        const parsed = parseFloat(raw.replace(",", "."));
        if (!isNaN(parsed)) payload[field.key] = parsed;
      }
    }

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("checkin.saveError"));
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-md mx-auto px-4 py-8 pt-24">
          <div className="bg-card border border-accent/30 rounded-2xl p-6 text-center mb-6">
            <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("checkin.savedTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("checkin.savedSubtitle")}</p>
          </div>

          <div className="bg-card/60 border border rounded-xl p-4 space-y-3 mb-6">
            {FIELDS.map((field) => {
              const value = result.checkin[field.key];
              if (value == null) return null;
              return (
                <div key={field.key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(field.labelKey)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold text-sm">{value} {field.unit}</span>
                    {result.previous && <DeltaBadge value={result.deltas[field.key]} unit={field.unit} />}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {t("checkin.backHome")}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-4 py-8 pt-24">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors mb-6 cursor-pointer text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("trainer.back")}
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Scale className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
            {t("checkin.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("checkin.subtitle")}</p>

        <form onSubmit={handleSubmit} className="bg-card border border rounded-2xl p-5 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                {t(field.labelKey)} ({field.unit})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={values[field.key] || ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || /^\d*[.,]?\d*$/.test(raw)) {
                    setValues((prev) => ({ ...prev, [field.key]: raw }));
                  }
                }}
                placeholder="0"
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
                disabled={submitting}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {t("checkin.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("checkin.notesPlaceholder")}
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors resize-none"
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("checkin.submit")}
          </button>
        </form>
      </main>
    </div>
  );
}

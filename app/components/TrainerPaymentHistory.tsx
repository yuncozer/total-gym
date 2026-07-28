"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string;
  method: string | null;
  sessionsIncluded: number | null;
  notes: string | null;
}

interface TrainerPaymentHistoryProps {
  clientId: string;
}

const FIXED_CURRENCY_METHODS: Record<string, string> = {
  zelle: "USD",
  binance: "USD",
  bancolombia_nequi: "COP",
  pago_movil: "BS",
};

function paymentMethodLabel(method: string | null, t: (key: string) => string): string {
  switch (method) {
    case "zelle": return t("trainer.paymentMethodZelle");
    case "binance": return t("trainer.paymentMethodBinance");
    case "bancolombia_nequi": return t("trainer.paymentMethodBancolombiaNequi");
    case "pago_movil": return t("trainer.paymentMethodPagoMovil");
    case "efectivo": return t("trainer.paymentMethodEfectivo");
    default: return method || "";
  }
}

export function TrainerPaymentHistory({ clientId }: TrainerPaymentHistoryProps) {
  const { t, lang } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessionsUsed, setSessionsUsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [method, setMethod] = useState("");
  const [cashCurrency, setCashCurrency] = useState("USD");
  const [sessionsIncluded, setSessionsIncluded] = useState("");

  const load = () => {
    fetch(`/api/trainer/clients/${clientId}/payments`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setPayments(data.payments || []);
        setSessionsUsed(data.sessionsUsed ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [clientId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", year: "numeric" });

  const currency = method === "efectivo" ? cashCurrency : (FIXED_CURRENCY_METHODS[method] || "USD");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !method) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trainer/clients/${clientId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          currency,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          method,
          sessionsIncluded: sessionsIncluded ? Number(sessionsIncluded) : undefined,
        }),
      });
      if (res.ok) {
        setAmount("");
        setPeriodStart("");
        setPeriodEnd("");
        setMethod("");
        setCashCurrency("USD");
        setSessionsIncluded("");
        setShowForm(false);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const latestPackage = payments.find((p) => p.sessionsIncluded != null);

  return (
    <div className="bg-card/60 border border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("trainer.paymentsTitle")}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("trainer.paymentRegister")}
        </button>
      </div>

      {latestPackage && sessionsUsed != null && (
        <div className="bg-background rounded-lg px-3 py-2 mb-3 flex items-center justify-between text-xs">
          <span className="text-icon">{t("trainer.paymentSessionsUsed")}</span>
          <span className="text-white font-semibold">{sessionsUsed} / {latestPackage.sessionsIncluded}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 mb-3 pb-3 border-b border">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("trainer.paymentAmount")}
              required
              className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              disabled={submitting}
            />
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              required
              className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              disabled={submitting}
            >
              <option value="">{t("trainer.paymentMethodPlaceholder")}</option>
              <option value="zelle">{t("trainer.paymentMethodZelle")}</option>
              <option value="binance">{t("trainer.paymentMethodBinance")}</option>
              <option value="bancolombia_nequi">{t("trainer.paymentMethodBancolombiaNequi")}</option>
              <option value="pago_movil">{t("trainer.paymentMethodPagoMovil")}</option>
              <option value="efectivo">{t("trainer.paymentMethodEfectivo")}</option>
            </select>
          </div>
          {method === "efectivo" && (
            <div>
              <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.paymentCashCurrency")}</label>
              <select
                value={cashCurrency}
                onChange={(e) => setCashCurrency(e.target.value)}
                className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                disabled={submitting}
              >
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.paymentPeriodStart")}</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="text-[10px] text-icon uppercase tracking-wider block mb-1">{t("trainer.paymentPeriodEnd")}</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                disabled={submitting}
              />
            </div>
          </div>
          <input
            type="number"
            min={1}
            value={sessionsIncluded}
            onChange={(e) => setSessionsIncluded(e.target.value)}
            placeholder={t("trainer.paymentSessionsIncluded")}
            className="w-full bg-background border border rounded-lg text-white px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !amount || !method}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer text-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("trainer.paymentSave")}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-icon" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-xs text-icon py-2">{t("trainer.paymentsEmpty")}</p>
      ) : (
        <div className="space-y-1.5">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <div>
                <span className="text-white font-medium">{p.currency} {p.amount}</span>
                {p.method && <span className="text-icon"> · {paymentMethodLabel(p.method, t)}</span>}
              </div>
              <span className="text-icon">
                {p.periodEnd ? `${t("trainer.paymentUntil")} ${formatDate(p.periodEnd)}` : formatDate(p.paidAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

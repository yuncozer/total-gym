"use client";

import { useState, useEffect } from "react";
import { Scale, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Checkin {
  id: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  notes: string | null;
  createdAt: string;
}

interface TrainerCheckinHistoryProps {
  clientId: string;
}

export function TrainerCheckinHistory({ clientId }: TrainerCheckinHistoryProps) {
  const { t, lang } = useLanguage();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trainer/clients/${clientId}/checkins`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setCheckins(data.checkins || []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="bg-card/60 border border rounded-xl p-4 mb-4 flex justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-icon" />
      </div>
    );
  }

  if (checkins.length === 0) return null;

  return (
    <div className="bg-card/60 border border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("trainer.checkinHistory")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-icon uppercase tracking-wider border-b border">
              <th className="text-left py-2 pr-2">{t("trainer.checkinDate")}</th>
              <th className="text-right py-2 px-2">{t("checkin.weight")}</th>
              <th className="text-right py-2 px-2">{t("checkin.waist")}</th>
              <th className="text-right py-2 px-2">{t("checkin.chest")}</th>
              <th className="text-right py-2 px-2">{t("checkin.arm")}</th>
              <th className="text-right py-2 pl-2">{t("checkin.thigh")}</th>
            </tr>
          </thead>
          <tbody>
            {checkins.map((c) => (
              <tr key={c.id} className="border-b border/50 last:border-0">
                <td className="py-2 pr-2 text-white">{formatDate(c.createdAt)}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{c.weightKg ?? "—"}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{c.waistCm ?? "—"}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{c.chestCm ?? "—"}</td>
                <td className="py-2 px-2 text-right text-muted-foreground">{c.armCm ?? "—"}</td>
                <td className="py-2 pl-2 text-right text-muted-foreground">{c.thighCm ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

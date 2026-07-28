"use client";

import { useState, useEffect } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface UpcomingSession {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  trainerName: string | null;
}

export function UpcomingSessionBanner() {
  const { t, lang } = useLanguage();
  const [upcoming, setUpcoming] = useState<UpcomingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions/upcoming")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setUpcoming(data.upcoming);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !upcoming) return null;

  const date = new Date(upcoming.scheduledAt);
  const dateStr = date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "long", day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-3 bg-card/80 border border-accent/20 rounded-xl p-4 mb-6 sm:mb-8 max-w-2xl mx-auto text-left">
      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
        <CalendarClock className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{t("trainer.upcomingSessionTitle")}</p>
        <p className="text-white text-sm font-medium truncate">
          {dateStr} · {timeStr}
          {upcoming.trainerName ? ` — ${upcoming.trainerName}` : ""}
        </p>
        {upcoming.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {upcoming.location}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Check, X as XIcon, Loader2, User } from "lucide-react";
import { TrainerSubnav } from "@/app/components/TrainerSubnav";

interface AgendaSession {
  id: string;
  clientId: string;
  clientName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  location: string | null;
  notes: string | null;
}

interface ClientOption {
  id: string;
  displayName: string;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const STATUS_STYLE: Record<AgendaSession["status"], string> = {
  scheduled: "bg-accent/15 text-accent border-accent/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  no_show: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-zinc-600/20 text-zinc-400 border-zinc-500/30",
};

export default function TrainerAgendaPage() {
  const { t, lang } = useLanguage();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [sessions, setSessions] = useState<AgendaSession[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("18:00");
  const [formDuration, setFormDuration] = useState("60");
  const [formLocation, setFormLocation] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    const weekEnd = addDays(weekStart, 7);
    fetch(`/api/trainer/sessions?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setSessions(data.sessions || []);
      })
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    fetch("/api/trainer/clients")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setClients((data.clients || []).map((c: { id: string; displayName: string }) => ({ id: c.id, displayName: c.displayName })));
      })
      .catch(() => {});
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const sessionsByDay = (day: Date) => {
    const dayStr = day.toDateString();
    return sessions
      .filter((s) => new Date(s.scheduledAt).toDateString() === dayStr)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formDate || !formTime) return;
    setCreating(true);
    try {
      const scheduledAt = new Date(`${formDate}T${formTime}:00`).toISOString();
      const res = await fetch("/api/trainer/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formClientId,
          scheduledAt,
          durationMinutes: Number(formDuration) || 60,
          location: formLocation.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormClientId("");
        setFormLocation("");
        loadSessions();
      }
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: AgendaSession["status"]) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/trainer/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (status: AgendaSession["status"]) => {
    switch (status) {
      case "scheduled": return t("trainer.agendaScheduled");
      case "completed": return t("trainer.agendaCompleted");
      case "no_show": return t("trainer.agendaNoShow");
      case "cancelled": return t("trainer.agendaCancelled");
    }
  };

  const formatDay = (day: Date) => day.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short", day: "numeric", month: "short" });
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const isToday = (day: Date) => day.toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
        <TrainerSubnav />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("trainer.agendaTitle")}
            </h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover transition-colors cursor-pointer text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("trainer.agendaNewSession")}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-card border border rounded-2xl p-5 space-y-3 mb-6">
            <select
              value={formClientId}
              onChange={(e) => setFormClientId(e.target.value)}
              required
              className="w-full bg-background border border rounded-xl text-white px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">{t("trainer.agendaSelectClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
              />
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                required
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={15}
                step={15}
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder={t("trainer.agendaDuration")}
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors"
              />
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder={t("trainer.agendaLocation")}
                className="w-full bg-background border border rounded-xl text-white px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !formClientId}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("trainer.agendaSave")}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="p-2 text-icon hover:text-white transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-xs font-semibold text-accent hover:underline cursor-pointer">
            {t("trainer.agendaToday")}
          </button>
          <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="p-2 text-icon hover:text-white transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const daySessions = sessionsByDay(day);
              return (
                <div key={day.toISOString()}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isToday(day) ? "text-accent" : "text-icon"}`}>
                    {formatDay(day)}{isToday(day) ? ` · ${t("trainer.agendaToday")}` : ""}
                  </p>
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-icon/50 pb-2">—</p>
                  ) : (
                    <div className="space-y-2">
                      {daySessions.map((s) => (
                        <div key={s.id} className="bg-card/60 border border rounded-xl p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{s.clientName}</p>
                              <div className="flex items-center gap-3 text-[10px] text-icon">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(s.scheduledAt)} · {s.durationMinutes} min
                                </span>
                                {s.location && (
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {s.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-1 rounded-full border shrink-0 ${STATUS_STYLE[s.status]}`}>
                              {statusLabel(s.status)}
                            </span>
                          </div>
                          {s.status === "scheduled" && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border/50">
                              <button
                                onClick={() => updateStatus(s.id, "completed")}
                                disabled={busyId === s.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {t("trainer.agendaMarkAttended")}
                              </button>
                              <button
                                onClick={() => updateStatus(s.id, "no_show")}
                                disabled={busyId === s.id}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                                {t("trainer.agendaMarkNoShow")}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

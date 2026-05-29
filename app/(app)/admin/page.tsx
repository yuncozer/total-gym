"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  Users,
  Dumbbell,
  TrendingUp,
  Crown,
  Activity,
  Loader2,
  Shield,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { LoadingScreen } from "@/app/components/LoadingScreen";
interface Stats {
  totalUsers: number;
  totalWorkouts: number;
  totalSetsCompleted: number;
  premiumUsers: number;
  activeUsers30d: number;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  totalWorkouts: number;
  lastActivity: string | null;
  subscription: { plan: string; status: string; current_period_end: string | null };
}

interface TopExercise {
  exerciseId: string;
  name: string;
  count: number;
}

interface AdminEntry {
  userId: string;
  email: string;
  createdAt: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, usersRes, exercisesRes, adminsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/exercises-top"),
        fetch("/api/admin/admins"),
      ]);

      if (!statsRes.ok) throw new Error("Failed to load admin data");

      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setTopExercises(await exercisesRes.json());
      setAdmins(await adminsRes.json());
    } catch (err) {
      setError(t("admin.error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAddingAdmin(true);
    setAddError(null);
    setAddSuccess(false);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("admin.addError"));
      }

      setAddSuccess(true);
      setNewAdminEmail("");
      loadData();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;

    setDeletingAdminId(userId);

    try {
      await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAdminId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-black">
            <main className="max-w-4xl mx-auto px-4 py-8 pt-24">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
              {t("admin.title")}
            </h1>
            <p className="text-icon text-sm">{t("admin.subtitle")}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 text-red-400 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <div className="bg-card rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-icon mt-0.5">{t("admin.totalUsers")}</p>
            </div>
            <div className="bg-card rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                <Dumbbell className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
              <p className="text-xs text-icon mt-0.5">{t("admin.workoutsCompleted")}</p>
            </div>
            <div className="bg-card rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalSetsCompleted.toLocaleString()}</p>
              <p className="text-xs text-icon mt-0.5">{t("admin.setsCompleted")}</p>
            </div>
            <div className="bg-card rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <Crown className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.premiumUsers}</p>
              <p className="text-xs text-icon mt-0.5">{t("admin.premiumUsers")}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 col-span-2 lg:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.activeUsers30d}</p>
              <p className="text-xs text-icon mt-0.5">{t("admin.activeUsers")}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              {t("admin.recentUsers")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-icon text-xs uppercase tracking-wider border-b border">
                    <th className="text-left py-2 pr-2">{t("admin.email")}</th>
                    <th className="text-center py-2 px-2">{t("admin.workouts")}</th>
                    <th className="text-center py-2 px-2">{t("admin.plan")}</th>
                    <th className="text-right py-2 pl-2">{t("admin.lastActivity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 20).map((user) => (
                    <tr key={user.id} className="border-b border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-2 text-white truncate max-w-[140px] sm:max-w-none">
                        {user.email}
                      </td>
                      <td className="py-2.5 px-2 text-center text-white">{user.totalWorkouts}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.subscription.plan === "premium"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-zinc-700/50 text-zinc-400"
                        }`}>
                          {user.subscription.plan === "premium" ? t("admin.premium") : t("admin.free")}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 text-right text-icon text-xs">
                        {formatDate(user.lastActivity)}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-icon">
                        {t("admin.noUsers")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              {t("admin.topExercises")}
            </h2>
            {topExercises.length === 0 ? (
              <p className="text-icon text-sm py-4 text-center">{t("admin.noExercises")}</p>
            ) : (
              <div className="space-y-2">
                {topExercises.map((ex, i) => (
                  <div
                    key={ex.exerciseId}
                    className="flex items-center gap-3 py-2 border-b border/50 last:border-0"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < 3 ? "bg-accent/20 text-accent" : "bg-muted text-icon"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-white text-sm truncate">{ex.name}</span>
                    <span className="text-icon text-sm font-medium">{ex.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              {t("admin.administrators")}
            </h2>

            <div className="space-y-2 mb-4">
              {admins.map((admin) => (
                <div
                  key={admin.userId}
                  className="flex items-center justify-between py-2 border-b border/50 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm">{admin.email}</p>
                    <p className="text-icon text-xs">{t("admin.since")} {formatDate(admin.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin.userId)}
                    disabled={deletingAdminId === admin.userId}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title={t("admin.deleteAdmin")}
                  >
                    {deletingAdminId === admin.userId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
              {admins.length === 0 && (
                <p className="text-icon text-sm py-2">{t("admin.noAdmins")}</p>
              )}
            </div>

            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => { setNewAdminEmail(e.target.value); setAddError(null); setAddSuccess(false); }}
                placeholder={t("admin.newAdminPlaceholder")}
                className="flex-1 bg-muted text-white rounded-xl px-4 py-2.5 text-sm border border focus:border-accent outline-none"
                disabled={addingAdmin}
              />
              <button
                type="submit"
                disabled={addingAdmin || !newAdminEmail.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
              >
                {addingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t("admin.addAdmin")}
              </button>
            </form>

            {addError && (
              <p className="flex items-center gap-1 text-red-400 text-xs mt-2">
                <AlertCircle className="w-3 h-3" />{addError}
              </p>
            )}
            {addSuccess && (
              <p className="flex items-center gap-1 text-green-400 text-xs mt-2">
                <CheckCircle2 className="w-3 h-3" />{t("admin.addSuccess")}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

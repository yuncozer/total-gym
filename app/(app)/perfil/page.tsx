"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Scale, Ruler, Target, Loader2, Save, AlertCircle, Bell, BellOff } from "lucide-react";
import { usePushNotifications, updateNotificationSettings, saveSubscription } from "@/lib/push";
import { useAuth } from "@/lib/useAuth";
import { LoadingScreen } from "@/app/components/LoadingScreen";

interface ProfileData {
  email: string;
  gender: string;
  height_cm: number | null;
  weight_kg: number | null;
  level: string;
  goal: string;
  notify_enabled: boolean;
}

export default function PerfilPage() {
  const router = useRouter();
  const { loading: authLoading, authenticated } = useAuth(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@supabase/ssr").createBrowserClient> | null>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    gender: "",
    height_cm: null,
    weight_kg: null,
    level: "",
    goal: "",
    notify_enabled: false,
  });

  const { supported, subscribe, unsubscribe, loading: subLoading } = usePushNotifications();

  useEffect(() => {
    if (authLoading) return;
    
    async function initSupabase() {
      const { createBrowserClient } = await import("@supabase/ssr");
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );
      setSupabase(client);
      
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        setProfile(prev => ({ ...prev, email: session.user.email || "" }));
        
        const { data: profileData } = await client
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profileData) {
          setProfile(prev => ({
            ...prev,
            gender: profileData.gender || "",
            height_cm: profileData.height_cm || null,
            weight_kg: profileData.weight_kg || null,
            level: profileData.level || "",
            goal: profileData.goal || "",
            notify_enabled: profileData.notify_enabled || false,
          }));
        }
      }
      setLoading(false);
    }
    if (authenticated) {
      initSupabase();
    }
  }, [authenticated, authLoading]);

  const handleSave = async () => {
    if (!supabase) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        level: profile.level?.trim(),
        goal: profile.goal?.trim(),
      })
      .eq("id", session.user.id);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    
    setSaving(false);
  };

  const handleNotifyToggle = async () => {
    if (!supported || notifyLoading) return;

    setNotifyLoading(true);
    try {
      if (!profile.notify_enabled) {
        const sub = await subscribe();
        if (sub) {
          await saveSubscription(sub);
          setProfile(p => ({ ...p, notify_enabled: true }));
        }
      } else {
        await updateNotificationSettings(false);
        setProfile(p => ({ ...p, notify_enabled: false }));
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setNotifyLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-white">
            
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              MI <span className="text-accent">PERFIL</span>
            </h1>
            <p className="text-muted-foreground">
              Actualiza tus datos personales
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500">
              <span className="text-sm">Datos guardados correctamente</span>
            </div>
          )}



          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-muted border border rounded-xl text-icon cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Sexo
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, gender: "M" }))}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                    profile.gender === "M" 
                      ? "bg-accent text-black" 
                      : "bg-card border border text-muted-foreground hover:border-accent"
                  }`}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  HOMBRE
                </button>
                <button
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, gender: "F" }))}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                    profile.gender === "F" 
                      ? "bg-accent text-black" 
                      : "bg-card border border text-muted-foreground hover:border-accent"
                  }`}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  MUJER
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Altura (cm)
              </label>
              <div className="relative">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                  <input
                  type="number"
                  value={profile.height_cm || ""}
                  onChange={(e) => setProfile(p => ({ ...p, height_cm: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="170"
                  className="w-full pl-12 pr-4 py-3 bg-card border border rounded-xl text-white placeholder-icon focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              
              <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Peso (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-icon" />
                  <input
                  type="number"
                  value={profile.weight_kg || ""}
                  onChange={(e) => setProfile(p => ({ ...p, weight_kg: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="70"
                  className="w-full pl-12 pr-4 py-3 bg-card border border rounded-xl text-white placeholder-icon focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nivel de experiencia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "principiante", label: "Principiante" },
                  { value: "intermedio", label: "Intermedio" },
                  { value: "avanzado", label: "Avanzado" }
                ].map((nivel) => (
                  <button
                    key={nivel.value}
                    type="button"
                    onClick={() => setProfile(p => ({ ...p, level: nivel.value }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      profile.level === nivel.value
                        ? "bg-accent text-black"
                        : "bg-card border border text-muted-foreground hover:border-accent"
                    }`}
                  >
                    {nivel.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Objetivo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "ganar_musculo", label: "Ganar músculo" },
                  { value: "perder_grasa", label: "Perder grasa" },
                  { value: "mantener", label: "Mantener" }
                ].map((obj) => (
                  <button
                    key={obj.value}
                    type="button"
                    onClick={() => setProfile(p => ({ ...p, goal: obj.value }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      profile.goal === obj.value
                        ? "bg-accent text-black"
                        : "bg-card border border text-muted-foreground hover:border-accent"
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-4 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed cursor-pointer text-black font-bold rounded-xl transition-colors"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GUARDANDO...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  GUARDAR CAMBIOS
                </>
              )}
            </button>

            <div className="bg-card border border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    {profile.notify_enabled ? (
                      <Bell className="w-5 h-5 text-accent" />
                    ) : (
                      <BellOff className="w-5 h-5 text-icon" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium" style={{ fontFamily: "var(--font-rajdhani)" }}>
                      Recordatorio Diario
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {profile.notify_enabled ? "Activado" : "Desactivado"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (notifyLoading) return;
                    const newValue = !profile.notify_enabled;
                    setNotifyLoading(true);
                    try {
                      await updateNotificationSettings(newValue);
                      setProfile(p => ({ ...p, notify_enabled: newValue }));
                      setSuccess(true);
                      setTimeout(() => setSuccess(false), 3000);
                    } catch (err) {
                      setError("Error al actualizar notificaciones");
                    } finally {
                      setNotifyLoading(false);
                    }
                  }}
                  disabled={notifyLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    profile.notify_enabled
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-accent text-black hover:bg-accent-hover"
                  }`}
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  {notifyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.notify_enabled ? (
                    "DESACTIVAR"
                  ) : (
                    "ACTIVAR"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
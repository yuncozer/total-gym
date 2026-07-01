"use client";

import { useState, useEffect } from "react";
import { X, Link2, ImageIcon, Copy, Check, Share2, Loader2, Clock, ChevronLeft, Users, UserPlus } from "lucide-react";
import { WorkoutPhotoOverlay } from "./WorkoutPhotoOverlay";
import type { ExerciseInWorkout } from "@/lib/workout/types";

interface ShareSheetProps {
  workoutId: string;
  workoutName: string | null | undefined;
  exercises: ExerciseInWorkout[];
  completedAt?: string | null;
  workoutDate?: string;
  onClose: () => void;
  onRename?: (name: string) => void;
  /** Si se pasa, se muestra el tab de imagen (WorkoutPhotoOverlay). Sino, solo enlace. */
  hideImageTab?: boolean;
}

type Tab = "link" | "photo";

export function ShareSheet({
  workoutId,
  workoutName,
  exercises,
  completedAt,
  workoutDate,
  onClose,
  onRename,
}: ShareSheetProps) {
  const [step, setStep] = useState<"naming" | "share">(workoutName?.trim() ? "share" : "naming");
  const [name, setName] = useState(workoutName || "");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("link");
  const [linkData, setLinkData] = useState<{ token: string; url: string; expires_at: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [friends, setFriends] = useState<{ id: string; email: string }[]>([]);
  const [sharingToFriend, setSharingToFriend] = useState<string | null>(null);
  const [sharedToFriend, setSharedToFriend] = useState(false);

  useEffect(() => {
    if (step === "share" && !linkData) {
      generateLink();
    }
  }, [step]);

  const handleSaveName = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim().slice(0, 40) }),
      });
      if (!res.ok) throw new Error();
      onRename?.(name.trim());
      setStep("share");
    } catch {
      setError("Error al guardar el nombre");
    } finally {
      setSaving(false);
    }
  };

  const generateLink = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/workouts/${workoutId}/share`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al generar enlace");
      }
      const data = await res.json();
      setLinkData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!linkData) return;
    try {
      await navigator.clipboard.writeText(linkData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar el enlace");
    }
  };

  const handleNativeShare = async () => {
    if (!linkData) return;
    try {
      await navigator.share({
        title: "Rutina TOTAL GYM",
        text: "Mirá mi rutina de entrenamiento",
        url: linkData.url,
      });
    } catch {}
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysUntilExpiry = linkData ? getDaysUntilExpiry(linkData.expires_at) : 0;

  const handleRevoke = async () => {
    try {
      await fetch(`/api/workouts/${workoutId}/share`, { method: "DELETE" });
      setLinkData(null);
      setCopied(false);
    } catch {}
  };

  useEffect(() => {
    if (!showFriendPicker) return;
    fetch("/api/friends")
      .then(r => r.json())
      .then(data => setFriends(data.friends || []))
      .catch(() => {});
  }, [showFriendPicker]);

  const handleShareToFriend = async (receiverId: string) => {
    setSharingToFriend(receiverId);
    try {
      const res = await fetch(`/api/workouts/${workoutId}/share-to-friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      if (!res.ok) return;
      setSharedToFriend(true);
      setTimeout(() => setSharedToFriend(false), 2000);
    } catch {}
    setSharingToFriend(null);
  };

  if (showPhotoOverlay) {
    return (
      <WorkoutPhotoOverlay
        exercises={exercises}
        workoutName={workoutName || name.trim() || undefined}
        completedAt={completedAt}
        workoutDate={workoutDate}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div
          className="relative w-full max-w-sm bg-card border border rounded-2xl overflow-hidden animate-fade-in-up mx-4 mb-4 sm:mb-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-oswald)" }}>
              {step === "naming" ? "PONLE NOMBRE" : "COMPARTIR RUTINA"}
            </h2>
            <button onClick={onClose} className="text-icon hover:text-white p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "naming" ? (
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-4">
                Dale un nombre a tu rutina antes de compartirla
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Push Pull A, Full Body..."
                maxLength={40}
                className="w-full bg-zinc-800/80 border border rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
              />
              {error && (
                <p className="text-red-400 text-xs mt-2">{error}</p>
              )}
              <button
                onClick={handleSaveName}
                disabled={!name.trim() || saving}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl mt-4 transition-all"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "GUARDAR Y COMPARTIR"
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex border-b border">
                <button
                  onClick={() => setTab("link")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                    tab === "link"
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Enlace
                </button>
                <button
                  onClick={() => setShowPhotoOverlay(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                    tab === "photo"
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Imagen
                </button>
              </div>

              <div className="p-5">
                {generating ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Generando enlace...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-6">
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <button
                      onClick={generateLink}
                      className="text-accent text-sm font-semibold hover:underline cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : linkData ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-800/60 border border rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{linkData.url}</p>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors shrink-0 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-500">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={handleRevoke}
                        className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Revocar enlace
                      </button>
                    </div>

                    {"share" in navigator && (
                      <button
                        onClick={handleNativeShare}
                        className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent font-semibold py-3 rounded-xl border border-accent/20 transition-all cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        Compartir vía...
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const text = `💪 Mirá mi rutina en TOTAL GYM: ${linkData.url}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold py-2.5 rounded-xl border border-green-600/20 text-sm transition-all cursor-pointer"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          const text = `💪 Mirá mi rutina en TOTAL GYM: ${linkData.url}`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(linkData.url)}&text=${encodeURIComponent("Mirá mi rutina en TOTAL GYM")}`, "_blank");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 font-semibold py-2.5 rounded-xl border border-sky-600/20 text-sm transition-all cursor-pointer"
                      >
                        Telegram
                      </button>
                    </div>

                    <div className="border-t border pt-4 mt-4">
                      {!showFriendPicker ? (
                        <button
                          onClick={() => setShowFriendPicker(true)}
                          className="w-full flex items-center justify-center gap-2 bg-card hover:bg-muted text-muted-foreground hover:text-white font-semibold py-3 rounded-xl border border transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          Compartir con un amigo
                        </button>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Tus amigos
                            </span>
                            <button
                              onClick={() => setShowFriendPicker(false)}
                              className="text-xs text-icon hover:text-white transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                          {friends.length === 0 ? (
                            <p className="text-xs text-icon text-center py-4">No tenés amigos para compartir</p>
                          ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {friends.map((friend) => (
                                <button
                                  key={friend.id}
                                  onClick={() => handleShareToFriend(friend.id)}
                                  disabled={sharingToFriend === friend.id || sharedToFriend}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                                      {friend.email.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm text-left text-white flex-1 truncate">{friend.email}</span>
                                  {sharingToFriend === friend.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
                                  ) : sharedToFriend ? (
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                  ) : (
                                    <UserPlus className="w-4 h-4 text-icon shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n";
import { UserPlus, Users, Mail, Clock, UserMinus, Check, X, Search, Loader2, UserCheck, Ban, ChevronRight, Trophy, Flame, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Tab = "friends" | "requests" | "search" | "leaderboard";

interface Friend {
  id: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  friendSince: string;
}

interface IncomingRequest {
  requestId: string;
  senderId: string;
  email: string;
  level: number;
  xp: number;
  createdAt: string;
}

interface OutgoingRequest {
  requestId: string;
  receiverId: string;
  email: string;
  createdAt: string;
}

interface SearchUser {
  id: string;
  email: string;
  level: number | null;
  xp: number | null;
  isFriend: boolean;
  requestStatus: string | null;
}

function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Principiante", 2: "Aprendiz", 3: "Constante",
    4: "Dedicado", 5: "Forjado", 6: "Guerrero",
    7: "Titanio", 8: "Élite", 9: "Leyenda",
  };
  return titles[level] || "TOTAL GYM";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AmigosPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [receivedShares, setReceivedShares] = useState<any[]>([]);
  const [showSharesBanner, setShowSharesBanner] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [deleteConfirmFriend, setDeleteConfirmFriend] = useState<Friend | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) return;
      const data = await res.json();
      setFriends(data.friends || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFriends();
    fetchShares();
  }, [loadFriends]);

  const fetchShares = async () => {
    setSharesLoading(true);
    try {
      const res = await fetch("/api/friends/shares");
      if (!res.ok) return;
      const data = await res.json();
      setReceivedShares(data.received || []);
    } catch {
    } finally {
      setSharesLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch {
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (receiverId: string) => {
    setActionLoading(receiverId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error");
        return;
      }
      toast.success(t("friends.requestSent"));
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === receiverId ? { ...u, requestStatus: "pending" } : u
        )
      );
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) return;
      toast.success(t("friends.requestAccepted"));
      loadFriends();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) return;
      toast.success(t("friends.requestDeclined"));
      loadFriends();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
      if (!res.ok) return;
      toast.success(t("friends.friendRemoved"));
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string, receiverId: string) => {
    try {
      const res = await fetch(`/api/friends/${receiverId}`, { method: "DELETE" });
      if (!res.ok) return;
      setOutgoing((prev) => prev.filter((r) => r.requestId !== requestId));
      toast.success(t("friends.cancel"));
    } catch {
      toast.error("Error de conexión");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "friends", label: t("friends.tabFriends") },
    { id: "leaderboard", label: t("friends.tabLeaderboard") },
    { id: "requests", label: t("friends.tabRequests") },
    { id: "search", label: t("friends.tabSearch") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-24 pb-24">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "var(--font-oswald)" }}>
          {t("friends.title")}
        </h1>

        {receivedShares.length > 0 && (
          <div className="mb-4 border border-accent/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSharesBanner(!showSharesBanner)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📩</span>
                <span className="text-sm font-semibold text-white">
                  {receivedShares.length} {receivedShares.length === 1 ? "amigo compartió" : "amigos compartieron"} rutinas contigo
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-icon transition-transform ${showSharesBanner ? "rotate-180" : ""}`} />
            </button>
            {showSharesBanner && (
              <div className="divide-y divide border-t border-accent/10">
                {receivedShares.map((share: any) => (
                  <div key={share.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                        {(share.senderEmail || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{share.senderEmail}</p>
                      <p className="text-xs text-icon truncate">{share.workoutName}</p>
                    </div>
                    <div className="text-[10px] text-icon shrink-0">{share.workoutDate ? formatDate(share.workoutDate) : ""}</div>
                    <Link
                      href={`/shared-friend/${share.workoutId}`}
                      className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex border-b border mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                tab === t.id
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {t.id === "friends" && <Users className="w-4 h-4" />}
              {t.id === "leaderboard" && <Trophy className="w-4 h-4" />}
              {t.id === "requests" && <Mail className="w-4 h-4" />}
              {t.id === "search" && <Search className="w-4 h-4" />}
              {t.label}
              {t.id === "requests" && incoming.length > 0 && (
                <span className="bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {incoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-icon mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">{t("friends.noFriends")}</p>
              <p className="text-icon text-sm mt-1">{t("friends.noFriendsDesc")}</p>
              <button
                onClick={() => setTab("search")}
                className="mt-4 bg-accent text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-accent-hover transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {t("friends.tabSearch")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/amigos/${friend.id}`}
                  className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.1)] transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                      {friend.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{friend.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-icon mt-0.5">
                        <span>Nvl {friend.level} · {getLevelTitle(friend.level)}</span>
                        {friend.streak > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-accent">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C12 2 7 8 7 13C7 17 9 21 12 21C15 21 17 17 17 13C17 8 12 2 12 2Z" />
                              </svg>
                              {friend.streak}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(friend.friendSince)}
                        </span>
                      </div>
                    </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmFriend(friend); }}
                    disabled={actionLoading === friend.id}
                    className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer disabled:opacity-30 shrink-0"
                    title={t("friends.remove")}
                  >
                    {actionLoading === friend.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4" />
                    )}
                  </button>
                  <ChevronRight className="w-4 h-4 text-icon/40 group-hover:text-icon transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )
        ) : tab === "requests" ? (
          <div className="space-y-6">
            {incoming.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("friends.incomingRequests")}
                </h3>
                <div className="space-y-2">
                  {incoming.map((req) => (
                    <div
                      key={req.requestId}
                      className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                          {req.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{req.email}</p>
                        <p className="text-[10px] text-icon mt-0.5">
                          Nvl {req.level} · {getLevelTitle(req.level)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(req.requestId)}
                          disabled={actionLoading === req.requestId}
                          className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center hover:bg-green-500/25 transition-colors cursor-pointer disabled:opacity-30"
                          title={t("friends.accept")}
                        >
                          {actionLoading === req.requestId ? (
                            <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                          ) : (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDecline(req.requestId)}
                          disabled={actionLoading === req.requestId}
                          className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center hover:bg-red-500/25 transition-colors cursor-pointer disabled:opacity-30"
                          title={t("friends.decline")}
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outgoing.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("friends.sentTitle")}
                </h3>
                <div className="space-y-2">
                  {outgoing.map((req) => (
                    <div
                      key={req.requestId}
                      className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-zinc-500" style={{ fontFamily: "var(--font-oswald)" }}>
                          {req.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{req.email}</p>
                        <p className="text-[10px] text-icon mt-0.5">{t("friends.pending")}</p>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(req.requestId, req.receiverId)}
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      >
                        {t("friends.cancel")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="text-center py-16">
                <Mail className="w-12 h-12 text-icon mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">{t("friends.noRequests")}</p>
              </div>
            )}
          </div>
        ) : tab === "leaderboard" ? (
          friends.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-icon mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">{t("friends.noFriends")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {[...friends]
                .sort((a, b) => b.xp - a.xp)
                .map((friend, index) => (
                  <Link
                    key={friend.id}
                    href={`/amigos/${friend.id}`}
                    className="bg-card/60 border border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent/30 hover:shadow-[0_0_12px_rgba(234,179,8,0.1)] transition-all duration-200 cursor-pointer group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      index === 0 ? "bg-accent/20 border border-accent/40" :
                      index === 1 ? "bg-zinc-600/20 border border-zinc-500/30" :
                      index === 2 ? "bg-amber-800/20 border border-amber-700/30" :
                      "bg-muted border border"
                    }`}>
                      <span className={`text-sm font-black ${
                        index === 0 ? "text-accent" :
                        index === 1 ? "text-zinc-300" :
                        index === 2 ? "text-amber-500" :
                        "text-icon"
                      }`} style={{ fontFamily: "var(--font-oswald)" }}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#0a0a0b] border-2 border-accent/40 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                        {friend.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{friend.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-icon mt-0.5">
                        <span>Nvl {friend.level}</span>
                        <span>·</span>
                        <span>{friend.xp.toLocaleString()} XP</span>
                        {friend.streak > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-accent">
                              <Flame className="w-3 h-3" />
                              {friend.streak}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-icon/40 group-hover:text-icon transition-colors shrink-0" />
                  </Link>
                ))}
            </div>
          )
        ) : (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("friends.searchPlaceholderExact")}
                className="w-full bg-zinc-800/80 border border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent" />
              )}
            </div>

            {!searchQuery ? (
              <div className="text-center py-16">
                <UserPlus className="w-12 h-12 text-icon mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground text-sm">{t("friends.searchMinChars")}</p>
              </div>
            ) : searchResults.length === 0 && !searching ? (
              <div className="text-center py-16">
                <Ban className="w-12 h-12 text-icon mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground text-sm">{t("friends.searchNoResults")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="bg-card/60 border border rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-accent" style={{ fontFamily: "var(--font-oswald)" }}>
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      {user.isFriend && user.level !== null && (
                        <p className="text-[10px] text-icon mt-0.5">
                          Nvl {user.level} · {getLevelTitle(user.level)}
                        </p>
                      )}
                    </div>
                    {user.isFriend ? (
                      <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                        Amigo
                      </span>
                    ) : user.requestStatus === "pending" ? (
                      <span className="text-[11px] text-amber-400 font-medium shrink-0">
                        {t("friends.pending")}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        disabled={actionLoading === user.id}
                        className="flex items-center gap-1 bg-accent hover:bg-accent-hover disabled:bg-zinc-700 disabled:cursor-not-allowed text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        {t("friends.addFriend")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirmFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111113] border border rounded-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <UserMinus className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-oswald)" }}>
                ELIMINAR AMIGO
              </h2>
              <p className="text-sm text-icon">
                ¿Seguro que quieres eliminar a{" "}
                <span className="text-white font-medium">{deleteConfirmFriend.email}</span>
                {" "}de tus amigos?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmFriend(null)}
                className="flex-1 py-3 rounded-xl border border text-sm font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  const id = deleteConfirmFriend.id;
                  setDeleteConfirmFriend(null);
                  handleRemove(id);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

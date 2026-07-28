"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  authorName: string | null;
}

interface SessionCommentsProps {
  workoutId: string;
}

function formatTime(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleString(lang === "es" ? "es-ES" : "en-US", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function SessionComments({ workoutId }: SessionCommentsProps) {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/workouts/${workoutId}/comments`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setComments(data.comments || []);
      })
      .finally(() => setLoading(false));
  }, [workoutId]);

  const handleSend = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/workouts/${workoutId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setText("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-card/60 border border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("sessionComments.title")}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-icon" />
        </div>
      ) : (
        <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-xs text-icon text-center py-4">{t("sessionComments.empty")}</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className={`flex ${c.isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                c.isMine
                  ? "bg-accent text-black rounded-br-sm"
                  : "bg-zinc-800/80 text-white rounded-bl-sm"
              }`}>
                {!c.isMine && c.authorName && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-0.5">{c.authorName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{c.body}</p>
                <p className={`text-[10px] mt-1 ${c.isMine ? "text-black/60" : "text-icon"}`}>
                  {formatTime(c.createdAt, lang)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder={t("sessionComments.placeholder")}
          maxLength={1000}
          className="flex-1 bg-background border border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors"
          disabled={posting}
        />
        <button
          onClick={handleSend}
          disabled={posting || !text.trim()}
          className="w-10 h-10 flex items-center justify-center bg-accent text-black rounded-xl hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

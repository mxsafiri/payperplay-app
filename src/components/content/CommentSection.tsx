"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: {
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(name: string | null, handle: string) {
  return (name || handle).slice(0, 2).toUpperCase();
}

function isHttpUrl(url: string | null): url is string {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

export function CommentSection({ contentId }: { contentId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/content/${contentId}/comments`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setComments(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contentId]);

  const handlePost = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/content/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data, ...prev]);
        setBody("");
      } else {
        setError(data.error || "Failed to post comment");
      }
    } catch {
      setError("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2 pb-6">
      {/* Compose */}
      {session ? (
        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            maxLength={500}
            className="w-full border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-500/40 transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost(); }}
          />
          {error && <p className="text-[10px] font-mono text-red-400 uppercase tracking-wider">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{body.length}/500</span>
            <button
              onClick={handlePost}
              disabled={!body.trim() || posting}
              className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] font-mono text-white/30 text-center py-2 uppercase tracking-wider">
          <a href="/login" className="text-amber-500/70 hover:text-amber-400 transition-colors">Sign in</a> to leave a comment
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 bg-white/5 border border-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 bg-white/5" />
                <div className="h-2.5 w-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] font-mono text-white/20 text-center py-4 uppercase tracking-widest">
          No comments yet — be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden bg-amber-500/10 border border-amber-500/20">
                {isHttpUrl(c.user.avatarUrl) ? (
                  <Image src={c.user.avatarUrl} alt={c.user.handle} fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-mono font-bold text-amber-400">
                    {getInitials(c.user.displayName, c.user.handle)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-semibold text-white/80">
                    {c.user.displayName || `@${c.user.handle}`}
                  </span>
                  <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[12px] font-mono text-white/50 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

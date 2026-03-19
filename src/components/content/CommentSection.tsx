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
            className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
            }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{body.length}/500</span>
            <button
              onClick={handlePost}
              disabled={!body.trim() || posting}
              className="px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary-400 transition-colors"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          <a href="/login" className="text-primary underline">Sign in</a> to leave a comment
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet — be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
                {isHttpUrl(c.user.avatarUrl) ? (
                  <Image src={c.user.avatarUrl} alt={c.user.handle} fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                    {getInitials(c.user.displayName, c.user.handle)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold">
                    {c.user.displayName || `@${c.user.handle}`}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

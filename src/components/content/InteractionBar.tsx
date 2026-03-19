"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

interface Props {
  contentId: string;
  initialLikeCount: number;
  initialCommentCount: number;
  showComments: boolean;
  onCommentToggle: () => void;
  onTipClick: () => void;
  hasAccess: boolean;
}

export function InteractionBar({
  contentId,
  initialLikeCount,
  initialCommentCount,
  showComments,
  onCommentToggle,
  onTipClick,
  hasAccess,
}: Props) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetch(`/api/content/${contentId}/like`)
      .then((r) => r.json())
      .then((d) => {
        if (d.likeCount !== undefined) setLikeCount(d.likeCount);
        if (d.isLiked !== undefined) setIsLiked(d.isLiked);
      })
      .catch(() => {});
  }, [contentId]);

  const handleLike = async () => {
    if (!session) return;
    setLiking(true);
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    try {
      const res = await fetch(`/api/content/${contentId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isLiked);
      } else {
        // Revert on error
        setIsLiked(wasLiked);
        setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
      }
    } catch {
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    } finally {
      setLiking(false);
    }
  };

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

  return (
    <div className="flex items-center gap-1 py-3 border-b border-border">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={!session || liking}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
          isLiked
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } ${!session ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        title={session ? (isLiked ? "Unlike" : "Like") : "Sign in to like"}
      >
        <span className={`text-lg transition-transform ${liking ? "scale-125" : ""}`}>
          {isLiked ? "❤️" : "🤍"}
        </span>
        <span>{fmt(likeCount)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onCommentToggle}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          showComments
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span className="text-lg">💬</span>
        <span>{fmt(initialCommentCount)}</span>
      </button>

      {/* Tip — only if user has access and is logged in */}
      {hasAccess && session && (
        <button
          onClick={onTipClick}
          className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-400 active:scale-95 transition-all shadow-sm shadow-primary-500/20"
        >
          <span className="text-base">💰</span>
          <span>Tip Creator</span>
        </button>
      )}
    </div>
  );
}

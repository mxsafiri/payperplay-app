"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Heart, MessageCircle, Coins } from "lucide-react";

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
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await fetch(`/api/content/${contentId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isLiked);
      } else {
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
    <div className="flex items-center gap-2 py-3 border-b border-white/10">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={!session || liking}
        title={session ? (isLiked ? "Unlike" : "Like") : "Sign in to like"}
        className={`flex items-center gap-1.5 px-3 py-2 border text-[11px] font-mono font-semibold uppercase tracking-wider transition-all active:scale-95 ${
          isLiked
            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-white/10 text-white/40 hover:border-white/25 hover:text-white"
        } ${!session ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <Heart className={`w-3.5 h-3.5 transition-transform ${liking ? "scale-125" : ""} ${isLiked ? "fill-current" : ""}`} />
        <span>{fmt(likeCount)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onCommentToggle}
        className={`flex items-center gap-1.5 px-3 py-2 border text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${
          showComments
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
            : "border-white/10 text-white/40 hover:border-white/25 hover:text-white"
        }`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>{fmt(initialCommentCount)}</span>
      </button>

      {/* Tip */}
      {hasAccess && session && (
        <button
          onClick={onTipClick}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all"
        >
          <Coins className="w-3.5 h-3.5" />
          Tip Creator
        </button>
      )}
    </div>
  );
}

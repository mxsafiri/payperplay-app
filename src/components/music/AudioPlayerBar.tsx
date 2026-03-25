"use client";

import { useAudioPlayer } from "./AudioPlayerContext";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  X, Loader2, Music,
} from "lucide-react";

function fmtTime(secs: number): string {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-3.5 w-4">
      {[70, 100, 45, 85].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-amber-400"
          style={{
            height: playing ? `${h}%` : "35%",
            animation: playing ? `eqBounce 0.6s ease-in-out infinite alternate` : "none",
            animationDelay: `${i * 120}ms`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </span>
  );
}

export function AudioPlayerBar() {
  const { track, isPlaying, currentTime, duration, volume, loading, pause, resume, seek, setVolume, next, prev, close, queue } = useAudioPlayer();
  const progressRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveringProgress, setHoveringProgress] = useState(false);

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const queueIdx = queue.findIndex((q) => q.id === track.id);
  const hasPrev = queueIdx > 0;
  const hasNext = queueIdx >= 0 && queueIdx < queue.length - 1;

  const getSeekPct = (clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    seek(getSeekPct(e.clientX) * duration);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    seek(getSeekPct(e.clientX) * duration);
    const onMove = (ev: MouseEvent) => seek(getSeekPct(ev.clientX) * duration);
    const onUp = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const onMove = (ev: TouchEvent) => seek(getSeekPct(ev.touches[0].clientX) * duration);
    const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    seek(getSeekPct(e.touches[0].clientX) * duration);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
  };

  return (
    <>
      <style>{`@keyframes eqBounce { from { height: 25%; } to { height: 100%; } }`}</style>
      <div className="fixed bottom-0 left-0 right-0 z-50 select-none">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-2xl border-t border-white/8" />
        {track.coverUrl && isPlaying && (
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
            <Image src={track.coverUrl} alt="" fill className="object-cover blur-3xl scale-150" />
          </div>
        )}

        {/* Seek bar */}
        <div
          ref={progressRef}
          className="relative w-full cursor-pointer group/bar"
          style={{ height: hoveringProgress || dragging ? "6px" : "3px", transition: "height 0.15s ease" }}
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onMouseEnter={() => setHoveringProgress(true)}
          onMouseLeave={() => setHoveringProgress(false)}
        >
          <div className="absolute inset-0 bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          {(hoveringProgress || dragging) && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50 ring-2 ring-amber-300/30"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          )}
        </div>

        {/* Main bar */}
        <div className="relative flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 max-w-screen-xl mx-auto">

          {/* ── Left: Art + Info ── */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Album art */}
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-1 ring-white/10 ${isPlaying ? "shadow-lg shadow-amber-500/20" : ""}`}>
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music className="w-5 h-5 text-amber-400/60" />
                  </div>
                )}
              </div>
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                  <EqBars playing={isPlaying} />
                </div>
              )}
            </div>

            {/* Title + artist */}
            <div className="min-w-0 flex-1">
              <Link href={`/content/${track.id}`} className="text-sm font-semibold truncate block text-white/90 hover:text-amber-400 transition-colors leading-tight">
                {track.title}
              </Link>
              <p className="text-xs text-white/40 truncate mt-0.5">{track.creatorName}</p>
            </div>
          </div>

          {/* ── Center: Controls ── */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={prev} disabled={!hasPrev} aria-label="Previous"
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={isPlaying ? pause : resume} disabled={loading} aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={next} disabled={!hasNext} aria-label="Next"
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* ── Right: Time + Volume + Close ── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Time — hidden on small screens */}
            <div className="hidden sm:block text-[11px] text-white/35 tabular-nums whitespace-nowrap">
              <span className="text-white/60">{fmtTime(currentTime)}</span>
              <span className="mx-0.5">/</span>
              {fmtTime(duration)}
            </div>

            {/* Volume — desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 1)} aria-label="Toggle mute"
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-all"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-amber-500 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Close */}
            <button
              onClick={close} aria-label="Close player"
              className="p-2 rounded-full text-white/30 hover:text-white/80 hover:bg-white/8 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

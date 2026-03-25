"use client";

import { useAudioPlayer } from "./AudioPlayerContext";
import Image from "next/image";
import Link from "next/link";
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

export function AudioPlayerBar() {
  const { track, isPlaying, currentTime, duration, volume, loading, pause, resume, seek, setVolume, next, prev, close, queue } = useAudioPlayer();

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const queueIdx = queue.findIndex((q) => q.id === track.id);
  const hasPrev = queueIdx > 0;
  const hasNext = queueIdx >= 0 && queueIdx < queue.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
      {/* Progress bar */}
      <div className="relative h-1 bg-muted cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seek(pct * duration);
        }}
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 max-w-screen-xl mx-auto">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/content/${track.id}`} className="text-sm font-medium truncate block hover:text-primary transition-colors">
              {track.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">{track.creatorName}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={!hasPrev}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
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
            onClick={next}
            disabled={!hasNext}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground tabular-nums hidden sm:block">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setVolume(volume > 0 ? 0 : 1)} className="p-1.5 hover:bg-muted rounded transition-colors">
            {volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
          </button>
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-primary cursor-pointer"
          />
        </div>

        {/* Close */}
        <button onClick={close} className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from "lucide-react";

interface Props {
  src: string;
  title: string;
  artist: string;
  albumArt?: string | null;
}

function fmt(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioPlayer({ src, title, artist, albumArt }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else void audio.play();
  }, [playing]);

  const skip = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
  }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  }, []);

  const changeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    audio.muted = next;
  }, [muted]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div className="overflow-hidden bg-black border border-white/10">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Layout: album art left, controls right on sm+; stacked on mobile */}
      <div className="flex flex-col sm:flex-row">

        {/* Album art */}
        <div className="relative sm:w-56 sm:flex-shrink-0 aspect-square sm:aspect-auto bg-neutral-900 border-b sm:border-b-0 sm:border-r border-white/10">
          {albumArt ? (
            <Image
              src={albumArt}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 224px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center">
                <Music className="w-7 h-7 text-amber-500/40" />
              </div>
            </div>
          )}
          {/* Bottom gradient so track info doesn't clash if art is light */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
        </div>

        {/* Controls panel */}
        <div className="flex-1 flex flex-col justify-between p-5 gap-5">

          {/* Track info */}
          <div>
            <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-1">Now Playing</div>
            <h3 className="text-base font-bold font-mono text-white leading-snug line-clamp-2">{title}</h3>
            <p className="text-[11px] font-mono text-white/35 uppercase tracking-wider mt-1">{artist}</p>
          </div>

          {/* Seek bar */}
          <div className="space-y-1.5">
            <div className="relative h-1 bg-white/10 cursor-pointer group">
              {/* Filled track */}
              <div
                className="absolute inset-y-0 left-0 bg-amber-500 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
              {/* Thumb indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-500 border border-amber-300/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${progress}% - 5px)` }}
              />
              {/* Invisible range input for interaction */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.5}
                value={currentTime}
                onChange={seek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: "20px", top: "-10px" }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-white/25 tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-7">
            <button
              onClick={() => skip(-15)}
              title="Back 15s"
              className="flex flex-col items-center gap-0.5 group"
            >
              <SkipBack className="w-5 h-5 text-white/30 group-hover:text-white transition-colors fill-white/30 group-hover:fill-white" />
              <span className="text-[8px] font-mono text-white/20 group-hover:text-white/50 transition-colors">15</span>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
            >
              {playing
                ? <Pause className="w-6 h-6 text-black fill-black" />
                : <Play className="w-6 h-6 text-black fill-black ml-0.5" />
              }
            </button>

            <button
              onClick={() => skip(15)}
              title="Forward 15s"
              className="flex flex-col items-center gap-0.5 group"
            >
              <SkipForward className="w-5 h-5 text-white/30 group-hover:text-white transition-colors fill-white/30 group-hover:fill-white" />
              <span className="text-[8px] font-mono text-white/20 group-hover:text-white/50 transition-colors">15</span>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleMute}
              className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
            >
              {muted || volume === 0
                ? <VolumeX className="w-3.5 h-3.5" />
                : <Volume2 className="w-3.5 h-3.5" />
              }
            </button>
            <div className="relative flex-1 h-px bg-white/10">
              <div
                className="absolute inset-y-0 left-0 bg-white/25 pointer-events-none"
                style={{ width: `${effectiveVolume * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={effectiveVolume}
                onChange={changeVolume}
                className="absolute w-full opacity-0 cursor-pointer"
                style={{ height: "16px", top: "-8px", left: 0 }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

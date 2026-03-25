"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

export interface PlayerTrack {
  id: string;          // content id
  title: string;
  creatorName: string;
  coverUrl: string | null;
  priceTzs: number;
  hasAccess: boolean;  // entitlement granted
}

interface AudioPlayerState {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
}

interface AudioPlayerActions {
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  close: () => void;
}

const AudioPlayerContext = createContext<(AudioPlayerState & AudioPlayerActions) | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadTrack = useCallback(async (t: PlayerTrack) => {
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    const audio = audioRef.current;
    audio.pause();

    // Fetch presigned stream URL from existing stream endpoint
    let url = "";
    try {
      const res = await fetch(`/api/content/${t.id}/stream`);
      if (res.ok) {
        const d = await res.json();
        url = d.streamUrl;
      }
    } catch {
      setLoading(false);
      return;
    }
    if (!url) { setLoading(false); return; }
    audio.src = url;
    audio.load();

    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.ondurationchange = () => setDuration(audio.duration || 0);
    audio.onended = () => {
      setIsPlaying(false);
      // Auto-advance queue
      setQueue((q) => {
        const idx = q.findIndex((x) => x.id === t.id);
        if (idx >= 0 && idx < q.length - 1) {
          const next = q[idx + 1];
          setTrack(next);
          loadTrack(next);
          return q;
        }
        return q;
      });
    };
    audio.oncanplay = () => setLoading(false);
    audio.onerror = () => setLoading(false);

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    setLoading(false);
  }, [volume]);

  const play = useCallback((t: PlayerTrack, q?: PlayerTrack[]) => {
    setTrack(t);
    if (q) setQueue(q);
    loadTrack(t);
  }, [loadTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const next = useCallback(() => {
    if (!track) return;
    const idx = queue.findIndex((x) => x.id === track.id);
    if (idx >= 0 && idx < queue.length - 1) {
      const t = queue[idx + 1];
      setTrack(t);
      loadTrack(t);
    }
  }, [track, queue, loadTrack]);

  const prev = useCallback(() => {
    if (!track) return;
    if (currentTime > 3) { seek(0); return; }
    const idx = queue.findIndex((x) => x.id === track.id);
    if (idx > 0) {
      const t = queue[idx - 1];
      setTrack(t);
      loadTrack(t);
    }
  }, [track, queue, currentTime, seek, loadTrack]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      track, queue, isPlaying, currentTime, duration, volume, loading,
      play, pause, resume, seek, setVolume, next, prev, close,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  return ctx;
}

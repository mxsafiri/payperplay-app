"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FanShell } from "@/components/fan/FanShell";
import { useAudioPlayer, type PlayerTrack } from "@/components/music/AudioPlayerContext";
import {
  Music, Play, Disc3, Lock,
  Loader2, Mic2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface MusicMeta {
  genre: string | null;
  durationSeconds: number | null;
  explicit: boolean;
}

interface Song {
  id: string;
  title: string;
  priceTzs: number;
  viewCount: number;
  creator: { id: string; handle: string; displayName: string | null; avatarUrl: string | null };
  media: { id: string; mediaType: string; storageKey: string | null; url: string | null }[];
  musicMetadata: MusicMeta | null;
}

interface Album {
  id: string;
  title: string;
  releaseType: "album" | "ep" | "single";
  coverImageUrl: string | null;
  creator: { id: string; handle: string; displayName: string | null; avatarUrl: string | null };
  items: { id: string; position: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const GENRES = ["All", "afrobeat", "bongo flava", "gospel", "hip-hop", "r&b", "pop", "reggae", "dancehall"];
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

function mediaUrl(key: string | null | undefined, url?: string | null): string | null {
  if (url && url.startsWith("http")) return url;
  if (!key) return null;
  return R2_PUBLIC ? `${R2_PUBLIC}/${key}` : null;
}

function fmtDuration(secs: number | null | undefined): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function songToTrack(song: Song): PlayerTrack {
  const thumb = song.media.find((m) => m.mediaType === "thumbnail");
  return {
    id: song.id,
    title: song.title,
    creatorName: song.creator.displayName || song.creator.handle,
    coverUrl: mediaUrl(thumb?.storageKey, thumb?.url),
    priceTzs: song.priceTzs,
    hasAccess: song.priceTzs === 0,
  };
}

// ── Equalizer bars ─────────────────────────────────────────────────────────
function EqBars() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3.5 w-3.5">
      {[70, 100, 45, 85].map((h, i) => (
        <span key={i} className="w-[2.5px] rounded-sm bg-amber-400"
          style={{ height: `${h}%`, animation: "eqBounce 0.6s ease-in-out infinite alternate", animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  );
}

// ── Song Row ───────────────────────────────────────────────────────────────
function SongRow({ song, index, allSongs }: { song: Song; index: number; allSongs: Song[] }) {
  const { play, track, isPlaying } = useAudioPlayer();
  const thumb = song.media.find((m) => m.mediaType === "thumbnail");
  const coverSrc = mediaUrl(thumb?.storageKey, thumb?.url);
  const isActive = track?.id === song.id;
  const isPaid = song.priceTzs > 0;

  const handlePlay = () => {
    if (isPaid) { window.location.href = `/content/${song.id}`; return; }
    play(songToTrack(song), allSongs.map(songToTrack));
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150 border ${
        isActive
          ? "bg-amber-500/10 border-amber-500/25"
          : "border-transparent hover:bg-white/[0.04] hover:border-white/8"
      }`}
      onClick={handlePlay}
    >
      {/* Index / eq indicator */}
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        {isActive && isPlaying ? (
          <EqBars />
        ) : (
          <span className={`text-xs tabular-nums ${isActive ? "text-amber-400 font-semibold" : "text-white/30 group-hover:opacity-0 transition-opacity"}`}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Cover art */}
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden bg-white/5 border border-white/8">
        {coverSrc ? (
          <Image src={coverSrc} alt={song.title} width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
            <Music className="w-5 h-5 text-amber-400/50" />
          </div>
        )}
        {/* Play overlay on hover (when not active) */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 bg-amber-500 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-black text-black translate-x-px" />
            </div>
          </div>
        )}
        {/* Lock overlay for paid */}
        {isPaid && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/70" />
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`font-semibold text-sm truncate leading-tight ${isActive ? "text-amber-400" : "text-white"}`}>
            {song.title}
          </span>
          {song.musicMetadata?.explicit && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/40 font-bold flex-shrink-0 leading-none">E</span>
          )}
        </div>
        <Link
          href={`/creator/${song.creator.handle}`}
          className="text-xs text-white/40 hover:text-amber-400 transition-colors truncate block mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {song.creator.displayName || song.creator.handle}
        </Link>
      </div>

      {/* Genre pill */}
      {song.musicMetadata?.genre && (
        <span className="hidden sm:block text-[11px] text-white/40/60 capitalize px-2 py-0.5 rounded-full bg-white/5 border border-white/8 flex-shrink-0">
          {song.musicMetadata.genre}
        </span>
      )}

      {/* Duration */}
      {song.musicMetadata?.durationSeconds && (
        <span className="text-xs text-white/40/50 tabular-nums hidden sm:block flex-shrink-0">
          {fmtDuration(song.musicMetadata.durationSeconds)}
        </span>
      )}

      {/* Price */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {isPaid ? (
          <Link href={`/content/${song.id}`}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20">
            {song.priceTzs.toLocaleString()} TZS
          </Link>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Free
          </span>
        )}
      </div>
    </div>
  );
}

// ── Album Card ─────────────────────────────────────────────────────────────
function AlbumCard({ album }: { album: Album }) {
  const coverSrc = album.coverImageUrl
    ? (album.coverImageUrl.startsWith("http") ? album.coverImageUrl : R2_PUBLIC ? `${R2_PUBLIC}/${album.coverImageUrl}` : null)
    : null;

  return (
    <Link href={`/music/${album.id}`}
      className="bg-neutral-950 border border-white/10 overflow-hidden hover:border-amber-500/30 transition-all group">
      <div className="aspect-square bg-neutral-900 relative overflow-hidden">
        {coverSrc ? (
          <Image src={coverSrc} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white uppercase tracking-wider">
            {album.releaseType}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{album.title}</h3>
        <p className="text-xs text-white/40 mt-0.5 truncate">
          {album.creator.displayName || album.creator.handle}
        </p>
        <p className="text-xs text-white/40 mt-1">{album.items.length} track{album.items.length !== 1 ? "s" : ""}</p>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
type ViewTab = "songs" | "releases";

export default function MusicPage() {
  const [tab, setTab] = useState<ViewTab>("songs");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("All");

  useEffect(() => {
    fetchData();
  }, [genre]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "songs", limit: "40" });
      if (genre !== "All") params.set("genre", genre);

      const [songsRes, albumsRes] = await Promise.all([
        fetch(`/api/music?${params}`),
        fetch("/api/music?type=albums&limit=20"),
      ]);

      if (songsRes.ok) setSongs((await songsRes.json()).songs || []);
      if (albumsRes.ok) setAlbums((await albumsRes.json()).albums || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FanShell title="Music">
      <style>{`@keyframes eqBounce { from { height: 25%; } to { height: 100%; } }`}</style>
      <div className="space-y-5">

        {/* ── Genre filter ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`flex-shrink-0 px-3.5 py-1.5 text-sm font-mono font-medium transition-all capitalize border ${
                genre === g
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/8"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex gap-0 border border-white/10 w-fit">
          {(["songs", "releases"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${
                tab === t
                  ? "bg-amber-500/10 text-amber-400 border-r border-white/10 last:border-r-0"
                  : "text-white/30 hover:text-white"
              }`}
            >
              {t === "releases" ? "Albums & EPs" : "Songs"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
              <p className="text-sm text-white/40">Loading tracks…</p>
            </div>
          </div>
        ) : tab === "songs" ? (
          songs.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <div className="w-16 h-16 bg-white/5 border border-white/8 flex items-center justify-center mx-auto">
                <Mic2 className="w-8 h-8 text-white/40/40" />
              </div>
              <p className="font-medium text-white/40">No songs found</p>
              <p className="text-sm text-white/40/60">Try a different genre filter</p>
            </div>
          ) : (
            <div className="border border-white/8 bg-white/[0.02] overflow-hidden">
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[24px_48px_1fr_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-white/6 items-center">
                <span className="text-[11px] text-white/40/50 font-medium text-center">#</span>
                <span />
                <span className="text-[11px] text-white/40/50 font-medium uppercase tracking-wider">Title</span>
                <span className="text-[11px] text-white/40/50 font-medium uppercase tracking-wider">Genre</span>
                <span className="text-[11px] text-white/40/50 font-medium uppercase tracking-wider">Time</span>
                <span className="text-[11px] text-white/40/50 font-medium uppercase tracking-wider">Price</span>
              </div>
              <div className="p-2 space-y-0.5">
                {songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} allSongs={songs} />
                ))}
              </div>
            </div>
          )
        ) : (
          albums.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <div className="w-16 h-16 bg-white/5 border border-white/8 flex items-center justify-center mx-auto">
                <Disc3 className="w-8 h-8 text-white/40/40" />
              </div>
              <p className="font-medium text-white/40">No releases yet</p>
              <p className="text-sm text-white/40/60">Albums and EPs will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
            </div>
          )
        )}
      </div>
    </FanShell>
  );
}

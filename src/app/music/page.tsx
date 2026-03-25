"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FanShell } from "@/components/fan/FanShell";
import { useAudioPlayer, type PlayerTrack } from "@/components/music/AudioPlayerContext";
import {
  Music, Play, Disc3, Clock, ExternalLink,
  Loader2, ChevronRight, Mic2,
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

// ── Song Row ───────────────────────────────────────────────────────────────
function SongRow({ song, index, allSongs }: { song: Song; index: number; allSongs: Song[] }) {
  const { play, track, isPlaying } = useAudioPlayer();
  const thumb = song.media.find((m) => m.mediaType === "thumbnail");
  const coverSrc = mediaUrl(thumb?.storageKey, thumb?.url);
  const isActive = track?.id === song.id;

  const handlePlay = () => {
    if (song.priceTzs > 0) {
      window.location.href = `/content/${song.id}`;
      return;
    }
    play(songToTrack(song), allSongs.map(songToTrack));
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer ${isActive ? "bg-primary/5 border border-primary/20" : "border border-transparent"}`}
      onClick={handlePlay}>
      <span className={`text-sm w-5 text-center flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {isActive && isPlaying ? (
          <span className="inline-flex gap-0.5 items-end h-4">
            <span className="w-0.5 bg-primary animate-bounce" style={{ height: "60%", animationDelay: "0ms" }} />
            <span className="w-0.5 bg-primary animate-bounce" style={{ height: "100%", animationDelay: "150ms" }} />
            <span className="w-0.5 bg-primary animate-bounce" style={{ height: "40%", animationDelay: "300ms" }} />
          </span>
        ) : index + 1}
      </span>

      <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
        {coverSrc ? (
          <Image src={coverSrc} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-medium text-sm truncate ${isActive ? "text-primary" : ""}`}>{song.title}</span>
          {song.musicMetadata?.explicit && (
            <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground font-bold flex-shrink-0">E</span>
          )}
        </div>
        <Link href={`/creator/${song.creator.handle}`} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
          onClick={(e) => e.stopPropagation()}>
          {song.creator.displayName || song.creator.handle}
        </Link>
      </div>

      {song.musicMetadata?.genre && (
        <span className="hidden sm:block text-xs text-muted-foreground capitalize">{song.musicMetadata.genre}</span>
      )}

      <span className="text-xs text-muted-foreground hidden sm:block">{fmtDuration(song.musicMetadata?.durationSeconds)}</span>

      <div className="text-sm font-medium flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {song.priceTzs === 0 ? (
          <span className="text-xs text-green-500">Free</span>
        ) : (
          <Link href={`/content/${song.id}`} className="text-xs text-primary hover:underline">
            {song.priceTzs.toLocaleString()} TZS
          </Link>
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
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
      <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 relative overflow-hidden">
        {coverSrc ? (
          <Image src={coverSrc} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-primary/30" />
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
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {album.creator.displayName || album.creator.handle}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{album.items.length} track{album.items.length !== 1 ? "s" : ""}</p>
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
      <div className="space-y-6">
        {/* Genre filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GENRES.map((g) => (
            <button key={g}
              onClick={() => setGenre(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${genre === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          {(["songs", "releases"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "releases" ? "Albums & EPs" : "Songs"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "songs" ? (
          songs.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <Mic2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">No songs found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {songs.map((song, i) => (
                <SongRow key={song.id} song={song} index={i} allSongs={songs} />
              ))}
            </div>
          )
        ) : (
          albums.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <Disc3 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">No releases yet</p>
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

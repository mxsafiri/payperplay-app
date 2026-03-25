"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FanShell } from "@/components/fan/FanShell";
import { useAudioPlayer, type PlayerTrack } from "@/components/music/AudioPlayerContext";
import {
  Music, Play, Pause, Disc3, Clock, ArrowLeft,
  Loader2, ShoppingCart, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────
interface MusicMeta {
  genre: string | null;
  mood: string | null;
  durationSeconds: number | null;
  explicit: boolean;
  trackNumber: number | null;
}

interface TrackMedia {
  id: string;
  mediaType: string;
  storageKey: string | null;
  url: string | null;
}

interface Track {
  id: string;
  title: string;
  priceTzs: number;
  contentType: string;
  viewCount: number;
  likeCount: number;
  media: TrackMedia[];
  musicMetadata: MusicMeta | null;
}

interface AlbumItem {
  id: string;
  position: number;
  content: Track;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  releaseType: "album" | "ep" | "single";
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  creator: { id: string; handle: string; displayName: string | null; avatarUrl: string | null };
  items: AlbumItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
const TYPE_LABELS = { album: "Album", ep: "EP", single: "Single" };

function mediaUrl(key?: string | null, url?: string | null): string | null {
  if (url?.startsWith("http")) return url;
  if (!key) return null;
  return R2_PUBLIC ? `${R2_PUBLIC}/${key}` : null;
}

function fmtDuration(secs?: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function totalDuration(items: AlbumItem[]): string {
  const total = items.reduce((sum, i) => sum + (i.content.musicMetadata?.durationSeconds || 0), 0);
  if (!total) return "";
  const m = Math.floor(total / 60);
  return `${m} min`;
}

function trackToPlayer(track: Track, creator: Album["creator"]): PlayerTrack {
  const thumb = track.media.find((m) => m.mediaType === "thumbnail");
  return {
    id: track.id,
    title: track.title,
    creatorName: creator.displayName || creator.handle,
    coverUrl: mediaUrl(thumb?.storageKey, thumb?.url),
    priceTzs: track.priceTzs,
    hasAccess: track.priceTzs === 0,
  };
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  const { play, track: activeTrack, isPlaying, pause, resume } = useAudioPlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!albumId) return;
    fetch(`/api/music/${albumId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Not found"))
      .then((d) => setAlbum(d.album))
      .catch(() => setError("Album not found"))
      .finally(() => setLoading(false));
  }, [albumId]);

  if (loading) {
    return (
      <FanShell title="Music">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </FanShell>
    );
  }

  if (error || !album) {
    return (
      <FanShell title="Music">
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error || "Album not found"}</p>
          <Link href="/music" className="text-primary hover:underline text-sm mt-2 block">← Back to Music</Link>
        </div>
      </FanShell>
    );
  }

  const coverSrc = mediaUrl(album.coverImageUrl);
  const queue = album.items.map((item) => trackToPlayer(item.content, album.creator));
  const freeTracks = album.items.filter((i) => i.content.priceTzs === 0).length;
  const paidTracks = album.items.filter((i) => i.content.priceTzs > 0).length;

  const handlePlayAll = () => {
    const first = queue[0];
    if (first) play(first, queue);
  };

  return (
    <FanShell title={album.title}>
      <div className="space-y-6 pb-24">
        {/* Back */}
        <Link href="/music" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Music
        </Link>

        {/* Album header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Cover */}
          <div className="w-48 h-48 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 overflow-hidden shadow-xl mx-auto sm:mx-0">
            {coverSrc ? (
              <Image src={coverSrc} alt={album.title} width={192} height={192} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-primary/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{TYPE_LABELS[album.releaseType]}</span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{album.title}</h1>
              <Link href={`/creator/${album.creator.handle}`}
                className="text-muted-foreground hover:text-primary transition-colors mt-1 block">
                {album.creator.displayName || album.creator.handle}
              </Link>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{album.items.length} tracks</span>
              {totalDuration(album.items) && (
                <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{totalDuration(album.items)}</span></>
              )}
              <span>·</span>
              <span>{new Date(album.createdAt).getFullYear()}</span>
            </div>

            {album.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{album.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              {queue.length > 0 && freeTracks > 0 && (
                <Button onClick={handlePlayAll} size="sm" className="gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  Play {freeTracks < album.items.length ? "Free Tracks" : "All"}
                </Button>
              )}
              {paidTracks > 0 && (
                <span className="text-xs text-muted-foreground">
                  {paidTracks} paid track{paidTracks !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Tracklist</h2>
          {album.items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No tracks yet</p>
          ) : (
            album.items.map((item, i) => {
              const track = item.content;
              const thumb = track.media.find((m) => m.mediaType === "thumbnail");
              const coverSrc = mediaUrl(thumb?.storageKey, thumb?.url);
              const playerTrack = trackToPlayer(track, album.creator);
              const isActive = activeTrack?.id === track.id;
              const isFree = track.priceTzs === 0;

              const handleTrackClick = () => {
                if (!isFree) {
                  window.location.href = `/content/${track.id}`;
                  return;
                }
                if (isActive) {
                  isPlaying ? pause() : resume();
                } else {
                  play(playerTrack, queue);
                }
              };

              return (
                <div key={item.id}
                  onClick={handleTrackClick}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50 border border-transparent"}`}
                >
                  {/* Track number / play indicator */}
                  <div className="w-7 text-center flex-shrink-0">
                    {isActive && isPlaying ? (
                      <span className="inline-flex gap-0.5 items-end h-4">
                        <span className="w-0.5 bg-primary animate-bounce" style={{ height: "60%", animationDelay: "0ms" }} />
                        <span className="w-0.5 bg-primary animate-bounce" style={{ height: "100%", animationDelay: "150ms" }} />
                        <span className="w-0.5 bg-primary animate-bounce" style={{ height: "40%", animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      <>
                        <span className={`text-sm group-hover:hidden ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {item.position || i + 1}
                        </span>
                        <Play className="w-4 h-4 hidden group-hover:block text-foreground" />
                      </>
                    )}
                  </div>

                  {/* Cover */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {coverSrc ? (
                      <Image src={coverSrc} alt={track.title} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-sm truncate ${isActive ? "text-primary" : ""}`}>{track.title}</span>
                      {track.musicMetadata?.explicit && (
                        <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground font-bold flex-shrink-0">E</span>
                      )}
                    </div>
                    {track.musicMetadata?.genre && (
                      <span className="text-xs text-muted-foreground capitalize">{track.musicMetadata.genre}</span>
                    )}
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
                    {fmtDuration(track.musicMetadata?.durationSeconds)}
                  </span>

                  {/* Price */}
                  <div className="flex-shrink-0">
                    {isFree ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-primary font-medium">{track.priceTzs.toLocaleString()} TZS</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </FanShell>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Music, Plus, Upload, Disc3, Mic2, X, Check, AlertCircle,
  ChevronDown, Play, Clock, DollarSign, Eye, ListMusic,
  Loader2, ExternalLink, MoreVertical, Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────
type ReleaseType = "album" | "ep" | "single";

interface MusicMeta {
  genre: string | null;
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
  status: string;
  contentType: string;
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
  releaseType: ReleaseType;
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  items: AlbumItem[];
}

interface Song {
  id: string;
  title: string;
  description: string | null;
  priceTzs: number;
  status: string;
  viewCount: number;
  createdAt: string;
  media: TrackMedia[];
  musicMetadata: MusicMeta | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const GENRES = ["afrobeat", "bongo flava", "gospel", "hip-hop", "r&b", "pop", "jazz", "reggae", "dancehall", "traditional", "other"];
const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = { album: "Album", ep: "EP", single: "Single" };
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

function coverUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  return R2_PUBLIC ? `${R2_PUBLIC}/${key}` : null;
}

function fmtDuration(secs: number | null | undefined): string {
  if (!secs) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Upload hook ────────────────────────────────────────────────────────────
function useUpload() {
  const uploadFile = useCallback(async (
    file: File,
    mediaType: "audio" | "thumbnail",
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    const res = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, mediaType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get upload URL");
    }
    const { uploadUrl, storageKey } = await res.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });

    return storageKey;
  }, []);

  return { uploadFile };
}

// ── Upload Song Modal ──────────────────────────────────────────────────────
function UploadSongModal({
  albums,
  onClose,
  onSuccess,
}: {
  albums: Album[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { uploadFile } = useUpload();
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [priceTzs, setPriceTzs] = useState("0");
  const [albumId, setAlbumId] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!audioFile) { setError("Please select an audio file"); return; }
    if (!title.trim()) { setError("Title is required"); return; }

    setUploading(true);
    try {
      const audioKey = await uploadFile(audioFile, "audio", setAudioProgress);
      let coverKey: string | null = null;
      if (coverFile) coverKey = await uploadFile(coverFile, "thumbnail", setCoverProgress);

      const res = await fetch("/api/creator/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: "music",
          contentType: "audio_upload",
          priceTzs: parseInt(priceTzs) || 0,
          audioStorageKey: audioKey,
          thumbnailStorageKey: coverKey,
          genre: genre || null,
          explicit,
          albumId: albumId || null,
          status,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to upload song");
        setUploading(false);
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Upload Song</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Audio file */}
          <div>
            <label className="block text-sm font-medium mb-2">Audio File *</label>
            <div
              onClick={() => audioRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <input ref={audioRef} type="file" accept="audio/*" className="hidden"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
              {audioFile ? (
                <div className="flex items-center gap-2 justify-center text-sm">
                  <Music className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-xs">{audioFile.name}</span>
                  <span className="text-muted-foreground">({(audioFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Click to select MP3, WAV, FLAC, AAC</p>
                  <p className="text-xs text-muted-foreground">Max 200 MB</p>
                </div>
              )}
              {uploading && audioProgress > 0 && audioProgress < 100 && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${audioProgress}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Cover art */}
          <div>
            <label className="block text-sm font-medium mb-2">Cover Art <span className="text-muted-foreground">(optional)</span></label>
            <div
              onClick={() => coverRef.current?.click()}
              className="border border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-colors"
            >
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              {coverFile ? (
                <span className="text-sm text-primary">{coverFile.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Click to add cover image (JPG, PNG, WebP)</span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Song Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter song title" required />
          </div>

          {/* Genre + Explicit row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select genre</option>
                {GENRES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price (TZS)</label>
              <Input type="number" min="0" value={priceTzs}
                onChange={(e) => setPriceTzs(e.target.value)}
                placeholder="0 = free" />
            </div>
          </div>

          {/* Album assignment */}
          {albums.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Add to Album/EP <span className="text-muted-foreground">(optional)</span></label>
              <select
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No album</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>{a.title} ({RELEASE_TYPE_LABELS[a.releaseType]})</option>
                ))}
              </select>
            </div>
          )}

          {/* Explicit + Status */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)}
                className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm">Explicit content</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Publish now</span>
              <button type="button"
                onClick={() => setStatus(status === "published" ? "draft" : "published")}
                className={`relative w-10 h-5 rounded-full transition-colors ${status === "published" ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${status === "published" ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading{audioProgress > 0 ? ` ${audioProgress}%` : "..."}
              </>
            ) : "Upload Song"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Create Album Modal ─────────────────────────────────────────────────────
function CreateAlbumModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { uploadFile } = useUpload();
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("album");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);

    try {
      let coverKey: string | null = null;
      if (coverFile) coverKey = await uploadFile(coverFile, "thumbnail");

      const res = await fetch("/api/creator/music/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, releaseType, coverImageStorageKey: coverKey }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch {
      setError("Failed to create album");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">New Release</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Release type */}
          <div>
            <label className="block text-sm font-medium mb-2">Release Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["single", "ep", "album"] as ReleaseType[]).map((t) => (
                <button key={t} type="button"
                  onClick={() => setReleaseType(t)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${releaseType === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                >
                  {RELEASE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Cover art */}
          <div>
            <label className="block text-sm font-medium mb-2">Cover Art</label>
            <div onClick={() => coverRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-colors">
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              {coverFile ? (
                <span className="text-sm text-primary">{coverFile.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Click to add cover art (1:1 ratio recommended)</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${RELEASE_TYPE_LABELS[releaseType]} title`} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description <span className="text-muted-foreground">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell fans about this release..."
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : `Create ${RELEASE_TYPE_LABELS[releaseType]}`}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
type Tab = "songs" | "albums";

export default function CreatorMusicPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("songs");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsRes, albumsRes] = await Promise.all([
        fetch("/api/creator/content?limit=50"),
        fetch("/api/creator/music/albums"),
      ]);
      if (songsRes.ok) {
        const d = await songsRes.json();
        setSongs((d.content || []).filter((c: Song & { contentType: string }) => c.contentType === "audio_upload"));
      }
      if (albumsRes.ok) {
        const d = await albumsRes.json();
        setAlbums(d.albums || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (session) fetchData(); }, [session, fetchData]);

  const totalPlays = songs.reduce((sum, s) => sum + (s.viewCount || 0), 0);
  const publishedSongs = songs.filter((s) => s.status === "published").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/creator/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">Music</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateAlbum(true)}>
              <Disc3 className="w-4 h-4 mr-1.5" />New Release
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-1.5" />Upload Song
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Songs", value: publishedSongs, icon: Music },
            { label: "Releases", value: albums.length, icon: Disc3 },
            { label: "Total Plays", value: totalPlays.toLocaleString(), icon: Play },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          {(["songs", "albums"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${tab === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "albums" ? "Releases" : "Songs"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "songs" ? (
          <SongsTab songs={songs} onRefresh={fetchData} />
        ) : (
          <AlbumsTab albums={albums} onRefresh={fetchData} onUploadSong={() => setShowUpload(true)} />
        )}
      </div>

      {showUpload && (
        <UploadSongModal
          albums={albums}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchData(); }}
        />
      )}

      {showCreateAlbum && (
        <CreateAlbumModal
          onClose={() => setShowCreateAlbum(false)}
          onSuccess={() => { setShowCreateAlbum(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ── Songs Tab ─────────────────────────────────────────────────────────────
function SongsTab({ songs, onRefresh }: { songs: Song[]; onRefresh: () => void }) {
  if (songs.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <Music className="w-12 h-12 text-muted-foreground/50 mx-auto" />
        <p className="text-muted-foreground">No songs yet. Upload your first track!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {songs.map((song, i) => {
        const cover = song.media.find((m) => m.mediaType === "thumbnail");
        const coverSrc = coverUrl(cover?.storageKey || cover?.url);

        return (
          <div key={song.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
          >
            <span className="text-sm text-muted-foreground w-5 text-center">{i + 1}</span>

            {/* Cover */}
            <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
              {coverSrc ? (
                <Image src={coverSrc} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{song.title}</span>
                {song.musicMetadata?.explicit && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-bold">E</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${song.status === "published" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                  {song.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {song.musicMetadata?.genre && <span className="capitalize">{song.musicMetadata.genre}</span>}
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{song.viewCount}</span>
                <span>{fmtDuration(song.musicMetadata?.durationSeconds)}</span>
              </div>
            </div>

            {/* Price */}
            <div className="text-sm font-medium text-right flex-shrink-0">
              {song.priceTzs === 0 ? (
                <span className="text-green-500 text-xs">Free</span>
              ) : (
                <span>{song.priceTzs.toLocaleString()} TZS</span>
              )}
            </div>

            {/* Actions */}
            <Link href={`/content/${song.id}`} target="_blank"
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-lg transition-all">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ── Albums Tab ────────────────────────────────────────────────────────────
function AlbumsTab({
  albums,
  onRefresh,
  onUploadSong,
}: {
  albums: Album[];
  onRefresh: () => void;
  onUploadSong: () => void;
}) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <Disc3 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
        <p className="text-muted-foreground">No releases yet. Create an album, EP, or single!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {albums.map((album) => {
        const coverSrc = coverUrl(album.coverImageUrl);

        return (
          <div key={album.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Cover */}
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 relative overflow-hidden">
              {coverSrc ? (
                <Image src={coverSrc} alt={album.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 className="w-16 h-16 text-primary/30" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm uppercase tracking-wide">
                  {album.releaseType}
                </span>
              </div>
              {!album.isPublished && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/90 text-black font-medium">Draft</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold truncate">{album.title}</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ListMusic className="w-3 h-3" />
                  {album.items.length} track{album.items.length !== 1 ? "s" : ""}
                </span>
                <span>{new Date(album.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Tracks preview */}
              {album.items.length > 0 && (
                <div className="pt-1 space-y-1 border-t border-border">
                  {album.items.slice(0, 3).map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-3">{item.position + 1 || i + 1}.</span>
                      <span className="truncate">{item.content.title}</span>
                    </div>
                  ))}
                  {album.items.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{album.items.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface PlaylistItem {
  id: string;
  position: number;
  content: {
    id: string;
    title: string;
    priceTzs: number;
    status: string;
    media: { id: string; mediaType: string; url: string | null }[];
  };
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  isPublished: boolean;
  createdAt: string;
  items: PlaylistItem[];
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/creator/playlists");
      if (res.ok) { const data = await res.json(); setPlaylists(data.playlists); }
    } catch (error) { console.error("Failed to fetch playlists:", error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/creator/playlists", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() || null, category: newCategory.trim() || null }),
      });
      if (res.ok) { setNewTitle(""); setNewDescription(""); setNewCategory(""); setShowCreate(false); fetchPlaylists(); }
    } catch (error) { console.error("Failed to create playlist:", error); }
    finally { setCreating(false); }
  };

  const handleTogglePublish = async (playlist: Playlist) => {
    try {
      await fetch(`/api/creator/playlists/${playlist.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !playlist.isPublished }),
      });
      fetchPlaylists();
    } catch (error) { console.error("Failed to toggle publish:", error); }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Delete this playlist? Content won't be deleted.")) return;
    try {
      await fetch(`/api/creator/playlists/${playlistId}`, { method: "DELETE" });
      fetchPlaylists();
    } catch (error) { console.error("Failed to delete playlist:", error); }
  };

  const getThumbnail = (item: PlaylistItem) => {
    const thumb = item.content.media.find((m) => m.mediaType === "thumbnail");
    if (thumb?.url) return thumb.url;
    const yt = item.content.media.find((m) => m.mediaType === "youtube");
    if (yt?.url) { const match = yt.url.match(/(?:youtu\.be\/|v=)([^&?/]+)/); if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`; }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/creator/dashboard")}
                className="inline-flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider hover:text-white hover:bg-white/5 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all"
              >
                ← Dashboard
              </button>
              <div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CREATOR.PLAYLISTS</div>
                <h1 className="text-base font-bold font-mono tracking-tight text-white">My Playlists</h1>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex h-8 items-center px-4 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
            >
              + New Playlist
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Create Form */}
        {showCreate && (
          <div className="border border-amber-500/20 bg-amber-500/3 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40" />
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">PLAYLIST.CREATE</div>
                <h2 className="text-sm font-semibold font-mono text-white">Create New Playlist</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Title *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Nubongo Show Season 1"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
                <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Brief description of this series"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category</label>
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Entertainment, Music, Education"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={creating || !newTitle.trim()}
                  className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                  {creating ? "Creating..." : "Create Playlist"}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="inline-flex h-9 items-center px-5 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlists List */}
        {playlists.length === 0 ? (
          <div className="border border-dashed border-white/10 text-center py-16">
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">NO.PLAYLISTS</p>
            <p className="font-mono text-sm text-white/40 mb-5">Create a playlist to organize your content into series</p>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
              Create First Playlist
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist, idx) => (
              <div key={playlist.id} className="border border-white/10 bg-neutral-950 hover:border-amber-500/20 transition-colors relative group">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                          #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-sm font-semibold font-mono text-white">{playlist.title}</h3>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                          playlist.isPublished
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {playlist.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      {playlist.description && (
                        <p className="text-[10px] font-mono text-white/40 mb-1">{playlist.description}</p>
                      )}
                      <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                        {playlist.items.length} episode{playlist.items.length !== 1 ? "s" : ""}
                        {playlist.category && ` · ${playlist.category}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                      <button onClick={() => router.push(`/creator/playlists/${playlist.id}`)}
                        className="inline-flex h-7 items-center px-3 border border-white/15 text-[9px] font-mono text-white/40 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all">
                        Manage
                      </button>
                      <button onClick={() => handleTogglePublish(playlist)}
                        className="inline-flex h-7 items-center px-3 border border-white/15 text-[9px] font-mono text-white/40 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all">
                        {playlist.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => handleDelete(playlist.id)}
                        className="inline-flex h-7 items-center px-3 border border-red-500/20 text-[9px] font-mono text-red-400/60 uppercase tracking-widest hover:border-red-500/40 hover:text-red-400 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Episode thumbnails */}
                  {playlist.items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {playlist.items.slice(0, 6).map((item, i) => (
                        <div key={item.id} className="flex-shrink-0 w-28 border border-white/10 overflow-hidden">
                          <div className="aspect-video bg-neutral-900 flex items-center justify-center relative">
                            {getThumbnail(item) ? (
                              <img src={getThumbnail(item)!} alt={item.content.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white/20 font-mono text-lg">▶</span>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="text-[9px] font-mono text-white/50 truncate">Ep {i + 1}: {item.content.title}</p>
                            <p className="text-[8px] font-mono text-white/25 uppercase">{item.content.priceTzs === 0 ? "Free" : `${item.content.priceTzs} TZS`}</p>
                          </div>
                        </div>
                      ))}
                      {playlist.items.length > 6 && (
                        <div className="flex-shrink-0 w-28 border border-white/10 flex items-center justify-center aspect-video">
                          <span className="text-[9px] font-mono text-white/20 uppercase">+{playlist.items.length - 6} more</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

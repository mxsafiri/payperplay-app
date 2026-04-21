"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Film, Plus, Trash2, Share2, Copy, Check, ListVideo } from "lucide-react";

interface MediaItem { id: string; mediaType: string; url: string | null; }
interface ContentItem {
  id: string; title: string; priceTzs: number; status: string;
  category: string; contentType: string; media: MediaItem[];
}
interface PlaylistItem { id: string; position: number; content: ContentItem; }
interface Playlist {
  id: string; title: string; description: string | null;
  category: string | null; isPublished: boolean; items: PlaylistItem[];
}

export default function ManagePlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [playlistId, setPlaylistId] = useState("");
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  const [showAddContent, setShowAddContent] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setPlaylistId(p.id);
      fetchPlaylist(p.id);
      fetchAvailableContent();
    });
  }, [params]);

  const fetchPlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/creator/playlists/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
        setEditCategory(data.category || "");
      } else { router.push("/creator/playlists"); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchAvailableContent = async () => {
    try {
      const res = await fetch("/api/creator/content?limit=100");
      if (res.ok) { const d = await res.json(); setAvailableContent(d.content || []); }
    } catch { /* silent */ }
  };

  const handleAddContent = async (contentId: string) => {
    setAdding(contentId);
    try {
      const res = await fetch(`/api/creator/playlists/${playlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (res.ok) fetchPlaylist(playlistId);
    } catch { /* silent */ } finally { setAdding(null); }
  };

  const handleRemoveContent = async (contentId: string) => {
    try {
      await fetch(`/api/creator/playlists/${playlistId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      fetchPlaylist(playlistId);
    } catch { /* silent */ }
  };

  const handleSaveDetails = async () => {
    try {
      await fetch(`/api/creator/playlists/${playlistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription || null, category: editCategory || null }),
      });
      fetchPlaylist(playlistId);
      setEditing(false);
    } catch { /* silent */ }
  };

  const handleTogglePublish = async () => {
    if (!playlist) return;
    try {
      await fetch(`/api/creator/playlists/${playlistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !playlist.isPublished }),
      });
      fetchPlaylist(playlistId);
    } catch { /* silent */ }
  };

  const getThumbnail = (content: ContentItem) => {
    const thumb = content.media.find((m) => m.mediaType === "thumbnail");
    if (thumb?.url) return thumb.url;
    const yt = content.media.find((m) => m.mediaType === "youtube");
    if (yt?.url) {
      const match = yt.url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
      if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const contentNotInPlaylist = availableContent.filter(
    (c) => !playlist?.items.some((item) => item.content.id === c.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.PLAYLIST</p>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/creator/playlists")}
                className="text-[11px] font-mono text-white/40 uppercase tracking-wider hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 transition-all"
              >
                ← Playlists
              </button>
              <div className="h-3 w-px bg-white/10" />
              <div>
                <div className="flex items-center gap-2">
                  <ListVideo className="w-3.5 h-3.5 text-amber-400" />
                  <h1 className="text-sm font-bold font-mono tracking-tight text-white truncate max-w-[200px]">{playlist.title}</h1>
                </div>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                  {playlist.items.length} episode{playlist.items.length !== 1 ? "s" : ""} ·{" "}
                  <span className={playlist.isPublished ? "text-green-400" : "text-white/25"}>
                    {playlist.isPublished ? "Published" : "Draft"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-all ${
                  editing ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-white/10 text-white/40 hover:border-white/25 hover:text-white"
                }`}
              >
                {editing ? "Cancel" : "Edit"}
              </button>
              <button
                onClick={handleTogglePublish}
                className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-all ${
                  playlist.isPublished
                    ? "border-red-500/20 text-red-400/70 hover:border-red-500/40 hover:text-red-400"
                    : "border-green-500/20 text-green-400/70 hover:border-green-500/40 hover:text-green-400"
                }`}
              >
                {playlist.isPublished ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-4">

        {/* Edit Details */}
        {editing && (
          <div className="border border-amber-500/20 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
            <div className="p-5 space-y-4">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">EDIT.PLAYLIST.DETAILS</div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category</label>
                <input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Optional..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <button
                onClick={handleSaveDetails}
                className="inline-flex h-9 items-center px-5 bg-amber-500 text-[10px] font-mono font-bold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                Save Changes →
              </button>
            </div>
          </div>
        )}

        {/* Episodes */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">EPISODES</div>
              <button
                onClick={() => setShowAddContent(!showAddContent)}
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 transition-all ${
                  showAddContent
                    ? "border border-white/15 text-white/40 hover:text-white"
                    : "bg-amber-500 text-black hover:bg-amber-400"
                }`}
              >
                <Plus className="w-3 h-3" />
                {showAddContent ? "Done Adding" : "Add Episode"}
              </button>
            </div>

            {/* Content picker */}
            {showAddContent && (
              <div className="border border-white/5 bg-white/[0.02] mb-4">
                <div className="p-3 border-b border-white/5">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Select content to add</div>
                </div>
                {contentNotInPlaylist.length === 0 ? (
                  <p className="text-[11px] font-mono text-white/30 text-center py-6">All your content is already in this playlist</p>
                ) : (
                  <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {contentNotInPlaylist.map((c) => {
                      const thumb = getThumbnail(c);
                      return (
                        <div key={c.id} className="flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-9 bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Film className="w-4 h-4 text-white/20" />
                              )}
                            </div>
                            <div>
                              <p className="text-[12px] font-mono font-medium text-white/80">{c.title}</p>
                              <p className="text-[10px] font-mono text-white/30">
                                {c.priceTzs === 0 ? "Free" : `${c.priceTzs.toLocaleString()} TZS`} · {c.contentType === "upload" ? "Upload" : "YouTube"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddContent(c.id)}
                            disabled={adding === c.id}
                            className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-all"
                          >
                            {adding === c.id ? "Adding..." : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Episode list */}
            {playlist.items.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10">
                <Film className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-[11px] font-mono text-white/30 mb-1">No episodes yet</p>
                <p className="text-[10px] font-mono text-white/20 mb-4">Tip: make the first episode free to hook viewers</p>
                <button
                  onClick={() => setShowAddContent(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Episode
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.items.map((item, idx) => {
                  const thumb = getThumbnail(item.content);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-[11px] font-mono font-bold text-white/20 w-5 text-center flex-shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="w-20 h-11 bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-4 h-4 text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-mono font-semibold text-white/80 truncate">{item.content.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-mono ${item.content.priceTzs === 0 ? "text-green-400" : "text-amber-400"}`}>
                            {item.content.priceTzs === 0 ? "Free" : `${item.content.priceTzs.toLocaleString()} TZS`}
                          </span>
                          <span className="text-[10px] font-mono text-white/25">
                            · {item.content.contentType === "upload" ? "Upload" : "YouTube"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveContent(item.content.id)}
                        className="w-7 h-7 border border-white/10 flex items-center justify-center hover:border-red-500/30 hover:text-red-400 text-white/25 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Share link */}
        {playlist.isPublished && (
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">SHARE.PLAYLIST</div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono text-white/40 bg-white/5 border border-white/5 px-3 py-2 truncate">
                  {typeof window !== "undefined" ? window.location.origin : ""}/playlist/{playlist.id}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/playlist/${playlist.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-9 h-9 border border-white/10 flex items-center justify-center hover:border-amber-500/30 hover:bg-amber-500/5 transition-all flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

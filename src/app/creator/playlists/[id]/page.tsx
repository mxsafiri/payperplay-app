"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  priceTzs: number;
  status: string;
  category: string;
  contentType: string;
  media: MediaItem[];
}

interface PlaylistItem {
  id: string;
  position: number;
  content: ContentItem;
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  isPublished: boolean;
  items: PlaylistItem[];
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

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");

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
      } else {
        router.push("/creator/playlists");
      }
    } catch (error) {
      console.error("Failed to fetch playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableContent = async () => {
    try {
      const res = await fetch("/api/creator/content?limit=100");
      if (res.ok) {
        const data = await res.json();
        setAvailableContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    }
  };

  const handleAddContent = async (contentId: string) => {
    setAdding(contentId);
    try {
      const res = await fetch(`/api/creator/playlists/${playlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (res.ok) {
        fetchPlaylist(playlistId);
      }
    } catch (error) {
      console.error("Failed to add content:", error);
    } finally {
      setAdding(null);
    }
  };

  const handleRemoveContent = async (contentId: string) => {
    try {
      await fetch(`/api/creator/playlists/${playlistId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      fetchPlaylist(playlistId);
    } catch (error) {
      console.error("Failed to remove content:", error);
    }
  };

  const handleSaveDetails = async () => {
    try {
      await fetch(`/api/creator/playlists/${playlistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          category: editCategory || null,
        }),
      });
      fetchPlaylist(playlistId);
      setEditing(false);
    } catch (error) {
      console.error("Failed to update playlist:", error);
    }
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
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
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

  // Content not yet in the playlist
  const contentNotInPlaylist = availableContent.filter(
    (c) => !playlist?.items.some((item) => item.content.id === c.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/creator/playlists")}>
              ← Playlists
            </Button>
            <div>
              <h1 className="text-xl font-bold">{playlist.title}</h1>
              <p className="text-xs text-muted-foreground">
                {playlist.items.length} episode{playlist.items.length !== 1 ? "s" : ""}
                {playlist.isPublished ? " · Published" : " · Draft"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel Edit" : "Edit Details"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
            >
              {playlist.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Edit Details */}
        {editing && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Edit Playlist Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              </div>
              <Button onClick={handleSaveDetails}>Save Changes</Button>
            </CardContent>
          </Card>
        )}

        {/* Episodes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Episodes</h2>
            <Button
              size="sm"
              onClick={() => setShowAddContent(!showAddContent)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {showAddContent ? "Done Adding" : "+ Add Episode"}
            </Button>
          </div>

          {/* Add content picker */}
          {showAddContent && (
            <Card className="mb-4">
              <CardHeader>
                <h3 className="text-sm font-semibold">Select content to add</h3>
              </CardHeader>
              <CardContent>
                {contentNotInPlaylist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All your content is already in this playlist, or you have no published content yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {contentNotInPlaylist.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 aspect-video rounded bg-muted overflow-hidden flex-shrink-0">
                            {getThumbnail(c) ? (
                              <img src={getThumbnail(c)!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.priceTzs === 0 ? "Free" : `${c.priceTzs} TZS`} · {c.contentType === "upload" ? "Upload" : "YouTube"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddContent(c.id)}
                          disabled={adding === c.id}
                        >
                          {adding === c.id ? "Adding..." : "Add"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Episode list */}
          {playlist.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="font-semibold mb-2">No episodes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add content to build your series. Tip: make the first episode free to hook viewers!
                </p>
                <Button onClick={() => setShowAddContent(true)}>Add First Episode</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {playlist.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="text-lg font-bold text-muted-foreground w-8 text-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-24 aspect-video rounded bg-muted overflow-hidden flex-shrink-0">
                    {getThumbnail(item.content) ? (
                      <img
                        src={getThumbnail(item.content)!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.content.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs font-medium ${
                          item.content.priceTzs === 0 ? "text-green-500" : "text-amber-500"
                        }`}
                      >
                        {item.content.priceTzs === 0 ? "Free" : `${item.content.priceTzs} TZS`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {item.content.contentType === "upload" ? "Upload" : "YouTube"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContent(item.content.id)}
                    className="text-red-500 hover:text-red-600 flex-shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share link */}
        {playlist.isPublished && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Share this playlist</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/playlist/${playlist.id}`}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/playlist/${playlist.id}`
                    );
                  }}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

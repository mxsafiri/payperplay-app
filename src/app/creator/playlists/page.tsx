"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/creator/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/creator/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          category: newCategory.trim() || null,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setNewCategory("");
        setShowCreate(false);
        fetchPlaylists();
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (playlist: Playlist) => {
    try {
      await fetch(`/api/creator/playlists/${playlist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !playlist.isPublished }),
      });
      fetchPlaylists();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Delete this playlist? Content won't be deleted.")) return;
    try {
      await fetch(`/api/creator/playlists/${playlistId}`, { method: "DELETE" });
      fetchPlaylists();
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    }
  };

  const getThumbnail = (item: PlaylistItem) => {
    const thumb = item.content.media.find((m) => m.mediaType === "thumbnail");
    if (thumb?.url) return thumb.url;
    const yt = item.content.media.find((m) => m.mediaType === "youtube");
    if (yt?.url) {
      const match = yt.url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
      if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/creator/dashboard")}>
              ← Dashboard
            </Button>
            <h1 className="text-xl font-bold">My Playlists</h1>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            + New Playlist
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Create Form */}
        {showCreate && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Create New Playlist</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Nubongo Show Season 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this series"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Entertainment, Music, Education"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                  {creating ? "Creating..." : "Create Playlist"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Playlists List */}
        {playlists.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a playlist to organize your content into series
              </p>
              <Button onClick={() => setShowCreate(true)}>Create Your First Playlist</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{playlist.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            playlist.isPublished
                              ? "bg-green-500/15 text-green-500"
                              : "bg-yellow-500/15 text-yellow-500"
                          }`}
                        >
                          {playlist.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground">{playlist.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {playlist.items.length} episode{playlist.items.length !== 1 ? "s" : ""}
                        {playlist.category && ` · ${playlist.category}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/creator/playlists/${playlist.id}`)}
                      >
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(playlist)}
                      >
                        {playlist.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(playlist.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Episode thumbnails */}
                  {playlist.items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {playlist.items.slice(0, 6).map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-32 rounded-lg overflow-hidden bg-muted relative"
                        >
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {getThumbnail(item) ? (
                              <img
                                src={getThumbnail(item)!}
                                alt={item.content.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">🎬</span>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="text-xs font-medium truncate">
                              Ep {idx + 1}: {item.content.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.content.priceTzs === 0 ? "Free" : `${item.content.priceTzs} TZS`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {playlist.items.length > 6 && (
                        <div className="flex-shrink-0 w-32 rounded-lg bg-muted flex items-center justify-center aspect-video">
                          <span className="text-sm text-muted-foreground">
                            +{playlist.items.length - 6} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

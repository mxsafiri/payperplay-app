"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { placeholderCreators } from "@/data/placeholder-creators";

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
}

interface EpisodeContent {
  id: string;
  title: string;
  description: string | null;
  priceTzs: number;
  category: string;
  contentType: string;
  viewCount: number;
  createdAt: string;
  media: MediaItem[];
}

interface PlaylistItemData {
  id: string;
  position: number;
  content: EpisodeContent;
}

interface PlaylistDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  creator: {
    id: string;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  items: PlaylistItemData[];
  itemCount: number;
}

function getCreatorImage(creatorId: string) {
  const creator = placeholderCreators.find((c) => c.id === creatorId);
  return creator?.image || "/images/placeholder-avatar.jpg";
}

function getThumbnail(content: EpisodeContent) {
  const thumb = content.media.find((m) => m.mediaType === "thumbnail");
  if (thumb?.url) return thumb.url;
  const yt = content.media.find((m) => m.mediaType === "youtube");
  if (yt?.url) {
    const match = yt.url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
}

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => {
      fetchPlaylist(p.id);
    });
  }, [params]);

  const fetchPlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      } else {
        router.push("/feed");
      }
    } catch (error) {
      console.error("Failed to fetch playlist:", error);
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  const freeEpisodes = playlist.items.filter((i) => i.content.priceTzs === 0).length;
  const paidEpisodes = playlist.items.filter((i) => i.content.priceTzs > 0).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Playlist Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {playlist.category && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {playlist.category}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {playlist.itemCount} episode{playlist.itemCount !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mb-4">{playlist.description}</p>
          )}

          {/* Creator info */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={playlist.creator.avatarUrl || getCreatorImage(playlist.creator.id)}
                alt={playlist.creator.displayName || playlist.creator.handle}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                {playlist.creator.displayName || `@${playlist.creator.handle}`}
              </p>
              <p className="text-xs text-muted-foreground">Creator</p>
            </div>
          </div>

          {/* Stats */}
          {(freeEpisodes > 0 || paidEpisodes > 0) && (
            <div className="flex items-center gap-4 mt-4">
              {freeEpisodes > 0 && (
                <span className="text-sm text-green-500 font-medium">
                  {freeEpisodes} free episode{freeEpisodes !== 1 ? "s" : ""}
                </span>
              )}
              {paidEpisodes > 0 && (
                <span className="text-sm text-amber-500 font-medium">
                  {paidEpisodes} paid episode{paidEpisodes !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Episodes List */}
        <div className="space-y-3">
          {playlist.items.map((item, idx) => {
            const thumb = getThumbnail(item.content);
            return (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => router.push(`/content/${item.content.id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Episode number */}
                    <div className="text-lg font-bold text-muted-foreground w-8 text-center flex-shrink-0">
                      {idx + 1}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎬
                        </div>
                      )}
                      {/* Price badge */}
                      <div
                        className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.content.priceTzs === 0
                            ? "bg-green-500/90 text-white"
                            : "bg-amber-500/90 text-white"
                        }`}
                      >
                        {item.content.priceTzs === 0
                          ? "Free"
                          : `${item.content.priceTzs.toLocaleString()} TZS`}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.content.title}</h3>
                      {item.content.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {item.content.viewCount} views
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {item.content.contentType === "upload" ? "Video" : "YouTube"}
                        </span>
                      </div>
                    </div>

                    {/* Play button */}
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      {item.content.priceTzs === 0 ? "Watch" : "View"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

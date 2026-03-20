"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CreatorInfo {
  id: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  joinedAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  priceTzs: number;
  viewCount: number;
  contentType: string;
  category: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface PlaylistItem {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  category: string | null;
  itemCount: number;
}

interface Props {
  creator: CreatorInfo;
  content: ContentItem[];
  playlists: PlaylistItem[];
  followerCount: number;
  totalViews: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
}

type Tab = "videos" | "playlists";

export function CreatorProfileClient({
  creator,
  content,
  playlists,
  followerCount: initialFollowerCount,
  totalViews,
  isFollowing: initialIsFollowing,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("videos");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followLoading, setFollowLoading] = useState(false);

  const displayName = creator.displayName || `@${creator.handle}`;
  const joinDate = new Date(creator.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch {
      /* non-critical */
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            &larr; Back
          </Button>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-background shadow-lg flex-shrink-0">
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                  {(creator.displayName || creator.handle)[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                {creator.isVerified && (
                  <span
                    title="Verified Creator"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs"
                  >
                    &#10003;
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-3">@{creator.handle}</p>

              {creator.bio && (
                <p className="text-sm text-foreground/80 max-w-lg mb-4 whitespace-pre-wrap">
                  {creator.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 text-sm mb-4">
                <div>
                  <span className="font-bold text-foreground">
                    {content.length}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    video{content.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-foreground">
                    {followerCount.toLocaleString()}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    follower{followerCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-foreground">
                    {totalViews.toLocaleString()}
                  </span>{" "}
                  <span className="text-muted-foreground">views</span>
                </div>
                <div className="hidden sm:block text-muted-foreground">
                  Joined {joinDate}
                </div>
              </div>

              {/* Follow button */}
              <Button
                onClick={handleFollowToggle}
                disabled={followLoading}
                variant={isFollowing ? "secondary" : "primary"}
                className="min-w-[140px]"
              >
                {followLoading
                  ? "..."
                  : isFollowing
                  ? "Following"
                  : "Follow"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "videos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Videos ({content.length})
            </button>
            {playlists.length > 0 && (
              <button
                onClick={() => setActiveTab("playlists")}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "playlists"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Playlists ({playlists.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "videos" && (
          <>
            {content.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground text-sm">
                  {displayName} hasn&apos;t published any content yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {content.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="group block rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-video bg-muted">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute top-2 right-2">
                        {item.priceTzs === 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold">
                            FREE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-semibold">
                            {item.priceTzs.toLocaleString()} TZS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.viewCount.toLocaleString()} views</span>
                        <span>&middot;</span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "playlists" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <Card
                key={pl.id}
                className="group overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="relative aspect-video bg-muted">
                  {pl.coverUrl ? (
                    <Image
                      src={pl.coverUrl}
                      alt={pl.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <svg
                        className="w-12 h-12 text-primary/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Video count badge */}
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
                    {pl.itemCount} video{pl.itemCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {pl.title}
                  </h3>
                  {pl.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {pl.description}
                    </p>
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

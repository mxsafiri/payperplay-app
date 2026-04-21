"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
    if (!isLoggedIn) { router.push("/login"); return; }
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
    } catch { /* non-critical */ }
    finally { setFollowLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[11px] font-mono text-white/40 uppercase tracking-wider hover:text-white hover:bg-white/5 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Profile Hero */}
      <div className="relative bg-neutral-950 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-amber-500/30" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t border-r border-amber-500/30" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-hidden border-2 border-amber-500/30 flex-shrink-0">
              {creator.avatarUrl ? (
                <Image src={creator.avatarUrl} alt={displayName} fill className="object-cover" sizes="112px" priority />
              ) : (
                <div className="w-full h-full bg-amber-500/10 flex items-center justify-center text-3xl font-bold font-mono text-amber-400">
                  {(creator.displayName || creator.handle)[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">{displayName}</h1>
                {creator.isVerified && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-black text-[10px] font-bold">✓</span>
                )}
              </div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">@{creator.handle}</p>

              {creator.bio && (
                <p className="text-xs font-mono text-white/50 max-w-lg mb-4 whitespace-pre-wrap leading-relaxed">
                  {creator.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mb-5">
                {[
                  { val: content.length, label: `video${content.length !== 1 ? "s" : ""}` },
                  { val: followerCount.toLocaleString(), label: `follower${followerCount !== 1 ? "s" : ""}` },
                  { val: totalViews.toLocaleString(), label: "views" },
                ].map((s) => (
                  <div key={s.label} className="text-center sm:text-left">
                    <div className="text-base font-bold font-mono text-white">{s.val}</div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
                <div className="hidden sm:block">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Joined</div>
                  <div className="text-[10px] font-mono text-white/40">{joinDate}</div>
                </div>
              </div>

              {/* Follow button */}
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`inline-flex h-9 items-center px-6 text-[10px] font-mono font-semibold uppercase tracking-widest transition-all border ${
                  isFollowing
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "border-white/20 text-white/60 bg-transparent hover:border-amber-500/40 hover:text-white"
                }`}
              >
                {followLoading ? "..." : isFollowing ? "Following ✓" : "+ Follow"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 sticky top-[52px] bg-neutral-950/95 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === "videos"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-white/30 hover:text-white"
              }`}
            >
              Videos ({content.length})
            </button>
            {playlists.length > 0 && (
              <button
                onClick={() => setActiveTab("playlists")}
                className={`px-5 py-3 text-[10px] font-mono font-semibold uppercase tracking-widest border-b-2 transition-colors ${
                  activeTab === "playlists"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-white/30 hover:text-white"
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
              <div className="text-center py-16 border border-dashed border-white/10">
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">NO.CONTENT</p>
                <p className="font-mono font-medium text-white/50 text-sm">
                  {displayName} hasn&apos;t published any content yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {content.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="group block overflow-hidden border border-white/10 bg-neutral-950 hover:border-amber-500/30 transition-all amber-glow-hover"
                  >
                    <div className="relative aspect-video bg-neutral-900">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20">
                          <span className="text-2xl font-mono">▶</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {item.priceTzs === 0 ? (
                          <span className="px-2 py-0.5 bg-green-500/80 text-black text-[10px] font-mono font-semibold uppercase">FREE</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono font-semibold border border-white/20">
                            {item.priceTzs.toLocaleString()} TZS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-mono font-medium text-xs text-white/70 line-clamp-2 group-hover:text-white transition-colors tracking-wide">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                        <span>{item.viewCount.toLocaleString()} views</span>
                        <span>·</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "playlists" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="group overflow-hidden border border-white/10 bg-neutral-950 hover:border-amber-500/30 transition-all amber-glow-hover"
              >
                <div className="relative aspect-video bg-neutral-900">
                  {pl.coverUrl ? (
                    <Image src={pl.coverUrl} alt={pl.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
                      <span className="text-2xl font-mono text-amber-500/40">≡</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono border border-white/20">
                    {pl.itemCount} video{pl.itemCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-mono font-medium text-xs text-white/70 line-clamp-2 group-hover:text-white transition-colors tracking-wide">
                    {pl.title}
                  </h3>
                  {pl.description && (
                    <p className="text-[9px] font-mono text-white/30 line-clamp-2 mt-1 leading-relaxed">{pl.description}</p>
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

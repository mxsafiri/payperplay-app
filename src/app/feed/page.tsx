"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Film } from "lucide-react";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  creator: {
    id: string;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  media?: MediaItem[];
}

const CATEGORIES = ["All", "Music", "Comedy", "Education", "Entertainment", "Sports", "News", "Gaming", "Lifestyle"];

export default function FeedPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/content?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Subscription Banner */}
      <div className="relative z-50">
        <SubscriptionBanner />
      </div>
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        <Image
          src="/BG discover.png"
          alt=""
          fill
          className="object-cover opacity-35 dark:opacity-20"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-secondary-500/5 dark:from-primary-500/10 dark:to-secondary-500/10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Discover</h1>
              <p className="text-sm text-muted-foreground">
                Exclusive content from your favorite creators
              </p>
            </div>
            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-full border border-border bg-background text-foreground text-sm font-medium hover:bg-muted"
                >
                  Profile
                </Link>
                <Link
                  href="/library"
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  My Library
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex w-full justify-start sm:justify-center">
            <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 sm:pb-0">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-portrait bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory === "All"
                ? "Be the first to create content!"
                : `No ${selectedCategory} content available yet.`}
            </p>
            {session && (
              <Link href="/creator/content/new">
                <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                  Create Content
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => {
              const thumbnail = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
              const creatorName = item.creator.displayName || item.creator.handle;
              const creatorInitial = creatorName.slice(0, 1).toUpperCase();

              return (
              <Link key={item.id} href={`/content/${item.id}`}>
                <div className="group cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-muted mb-3">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <Film className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-sm font-semibold">
                      {item.priceTzs} TZS
                    </div>

                    {/* Creator Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        {item.creator.avatarUrl ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                            <Image
                              src={item.creator.avatarUrl}
                              alt={creatorName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-white flex-shrink-0 bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                            {creatorInitial}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium truncate">
                          {creatorName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.viewCount} views</span>
                      <span>•</span>
                      <span>{item.likeCount} likes</span>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

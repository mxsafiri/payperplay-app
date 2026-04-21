"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { FanShell } from "@/components/fan/FanShell";

interface MediaItem { id: string; mediaType: string; url: string | null; }
interface ContentItem {
  id: string; title: string; description: string | null; category: string;
  priceTzs: number; viewCount: number; likeCount: number; createdAt: string;
  creator: { id: string; handle: string; displayName: string | null; avatarUrl: string | null; };
  media?: MediaItem[];
}

const CATEGORIES = ["All", "Music", "Comedy", "Education", "Entertainment", "Sports", "News", "Gaming", "Lifestyle"];

export default function FeedPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => { fetchContent(); }, [selectedCategory]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      const response = await fetch(`/api/content?${params}`);
      if (response.ok) { const data = await response.json(); setContent(data.content || []); }
    } catch (error) { console.error("Failed to fetch content:", error); }
    finally { setLoading(false); }
  };

  return (
    <FanShell title="Discover" subtitle="Exclusive content from your favorite creators">
      <div>
        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-widest border transition-all ${
                  selectedCategory === category
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white bg-transparent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-white/5 animate-pulse">
                <div className="aspect-video bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 w-3/4" />
                  <div className="h-2 bg-white/5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10">
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">NO.CONTENT</p>
            <p className="font-mono text-sm text-white/40 mb-5">
              {selectedCategory === "All" ? "Be the first to create content!" : `No ${selectedCategory} content available yet.`}
            </p>
            {session && (
              <Link href="/creator/content/new"
                className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
                Create Content
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {content.map((item) => {
              const thumbnail = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
              const creatorName = item.creator.displayName || item.creator.handle;
              const creatorInitial = creatorName.slice(0, 1).toUpperCase();
              return (
                <Link key={item.id} href={`/content/${item.id}`}
                  className="group block border border-white/10 bg-neutral-950 hover:border-amber-500/30 transition-all amber-glow-hover overflow-hidden">
                  <div className="relative aspect-video bg-neutral-900">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={item.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-amber-400 text-lg mb-2">
                          {creatorInitial}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-amber-500 flex items-center justify-center">
                        <span className="text-black font-mono font-black text-lg ml-0.5">▶</span>
                      </div>
                    </div>

                    {/* Price badge */}
                    <div className="absolute top-2 right-2">
                      {item.priceTzs === 0 ? (
                        <span className="px-2 py-0.5 bg-green-500/80 text-black text-[9px] font-mono font-semibold uppercase">FREE</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-mono border border-white/20">
                          {item.priceTzs.toLocaleString()} TZS
                        </span>
                      )}
                    </div>

                    {/* Creator info */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1.5">
                        {item.creator.avatarUrl?.startsWith("http") ? (
                          <div className="relative w-6 h-6 overflow-hidden border border-white/30 flex-shrink-0">
                            <Image src={item.creator.avatarUrl} alt={creatorName} fill className="object-cover" sizes="24px" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border border-amber-500/40 bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-400 text-[9px] font-bold font-mono">{creatorInitial}</span>
                          </div>
                        )}
                        <span className="text-white text-[10px] font-mono font-medium truncate">{creatorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-mono font-medium text-xs text-white/70 line-clamp-2 group-hover:text-white transition-colors tracking-wide">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.viewCount.toLocaleString()} views</span>
                      <span>·</span>
                      <span>{item.likeCount} likes</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </FanShell>
  );
}

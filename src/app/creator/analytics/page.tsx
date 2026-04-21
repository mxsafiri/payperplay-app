"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Eye, TrendingUp, Film, Music, Heart, MessageCircle, Crown } from "lucide-react";

interface ContentItem {
  id: string; title: string; category: string; status: string; priceTzs: number;
  viewCount: number; likeCount: number; commentCount: number; contentType: string;
  createdAt: string; media?: { id: string; mediaType: string; url: string | null }[];
}

interface StatsData {
  totalContent: number; publishedContent: number; totalViews: number; totalEarnings: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchData();
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([fetch("/api/creator/stats"), fetch("/api/creator/content?limit=100")]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (contentRes.ok) { const data = await contentRes.json(); setContent(data.content || []); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.ANALYTICS</p>
        </div>
      </div>
    );
  }

  const totalViews = content.reduce((sum, c) => sum + c.viewCount, 0);
  const totalLikes = content.reduce((sum, c) => sum + (c.likeCount || 0), 0);
  const totalComments = content.reduce((sum, c) => sum + (c.commentCount || 0), 0);
  const paidContent = content.filter((c) => c.priceTzs > 0);
  const freeContent = content.filter((c) => c.priceTzs === 0);
  const publishedContent = content.filter((c) => c.status === "published");
  const topByViews = [...content].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const topByLikes = [...content].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5);
  const avgViews = publishedContent.length > 0 ? Math.round(totalViews / publishedContent.length) : 0;

  const categoryMap = new Map<string, { count: number; views: number }>();
  content.forEach((c) => {
    const ex = categoryMap.get(c.category) || { count: 0, views: 0 };
    categoryMap.set(c.category, { count: ex.count + 1, views: ex.views + c.viewCount });
  });
  const categories = Array.from(categoryMap.entries()).sort((a, b) => b[1].views - a[1].views);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px w-4 bg-amber-500/40" />
                <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Studio</span>
              </div>
              <h1 className="text-lg font-bold font-mono tracking-tight text-white">Analytics</h1>
            </div>
            <div className="flex items-center gap-1">
              {(["7d", "30d", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest border transition-all ${
                    period === p ? "border-amber-500 bg-amber-500 text-black" : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white bg-transparent"
                  }`}
                >
                  {p === "7d" ? "7D" : p === "30d" ? "30D" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-5">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { index: "01", label: "Total Views", value: totalViews, icon: Eye },
            { index: "02", label: "Avg Views/Video", value: avgViews, icon: TrendingUp },
            { index: "03", label: "Total Likes", value: totalLikes, icon: Heart },
            { index: "04", label: "Comments", value: totalComments, icon: MessageCircle },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/10 bg-neutral-950 p-4 relative group hover:border-amber-500/20 transition-colors">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.index}</div>
              <div className="flex items-start justify-between">
                <div className="text-2xl font-bold font-mono text-white">{stat.value.toLocaleString()}</div>
                <stat.icon className="w-4 h-4 text-amber-400/50 mt-1" />
              </div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top Content + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top by Views */}
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">TOP.CONTENT.VIEWS</div>
              </div>
              {topByViews.length === 0 ? (
                <p className="text-sm font-mono text-white/20 text-center py-6">No content data yet</p>
              ) : (
                <div className="space-y-2">
                  {topByViews.map((item, i) => {
                    const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                    const barWidth = Math.max(5, (item.viewCount / (topByViews[0]?.viewCount || 1)) * 100);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-white/3 transition-all cursor-pointer"
                        onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                      >
                        <span className={`w-5 text-[10px] font-mono font-bold text-center ${i === 0 ? "text-amber-400" : "text-white/20"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="relative w-10 h-7 overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 flex items-center justify-center">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
                          ) : (
                            <Film className="w-3 h-3 text-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono text-white/70 truncate">{item.title}</p>
                          <div className="mt-1 h-1 bg-white/5 overflow-hidden">
                            <div className="h-full bg-amber-500/60" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{item.viewCount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
            <div className="p-5">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">CONTENT.BY.CATEGORY</div>
              {categories.length === 0 ? (
                <p className="text-sm font-mono text-white/20 text-center py-6">No content data yet</p>
              ) : (
                <div className="space-y-3">
                  {categories.map(([cat, data], idx) => {
                    const barWidth = Math.max(5, (data.views / (categories[0]?.[1].views || 1)) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono text-white/60">{cat}</span>
                          <div className="flex items-center gap-3 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                            <span>{data.count} videos</span>
                            <span>{data.views.toLocaleString()} views</span>
                          </div>
                        </div>
                        <div className="h-1 bg-white/5 overflow-hidden">
                          <div
                            className={`h-full ${idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-amber-500/60" : "bg-white/20"}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Summary */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">CONTENT.SUMMARY</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Published", value: publishedContent.length, color: "text-amber-400" },
                { label: "Drafts", value: content.length - publishedContent.length, color: "text-white/50" },
                { label: "Free", value: freeContent.length, color: "text-green-400" },
                { label: "Paid", value: paidContent.length, color: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 border border-white/8 bg-white/[0.02]">
                  <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Liked */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">MOST.LIKED.CONTENT</div>
            </div>
            {topByLikes.filter((c) => (c.likeCount || 0) > 0).length === 0 ? (
              <p className="text-sm font-mono text-white/20 text-center py-6">No likes yet — share your content!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {topByLikes.filter((c) => (c.likeCount || 0) > 0).map((item) => {
                  const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-white/5 hover:border-white/15 hover:bg-white/[0.02] transition-all cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      <div className="relative w-12 h-8 overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 flex items-center justify-center">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <Film className="w-3 h-3 text-white/20" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-mono text-white/70 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-white/30">
                          <span className="text-pink-400">{item.likeCount} ♥</span>
                          <span>{item.viewCount} views</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import {
  Eye,
  TrendingUp,
  Film,
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Crown,
  Share2,
} from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  media?: { id: string; mediaType: string; url: string | null }[];
}

interface StatsData {
  totalContent: number;
  publishedContent: number;
  totalViews: number;
  totalEarnings: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) fetchData();
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([
        fetch("/api/creator/stats"),
        fetch("/api/creator/content?limit=100"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
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

  // Top performing content
  const topByViews = [...content].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const topByLikes = [...content].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5);

  // Category breakdown
  const categoryMap = new Map<string, { count: number; views: number; likes: number }>();
  content.forEach((c) => {
    const existing = categoryMap.get(c.category) || { count: 0, views: 0, likes: 0 };
    categoryMap.set(c.category, {
      count: existing.count + 1,
      views: existing.views + c.viewCount,
      likes: existing.likes + (c.likeCount || 0),
    });
  });
  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1].views - a[1].views);

  // Avg views per video
  const avgViews = publishedContent.length > 0 ? Math.round(totalViews / publishedContent.length) : 0;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your content performance</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {(["7d", "30d", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === p ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "All Time"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Views", value: totalViews, icon: Eye, color: "text-purple-400", gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20" },
            { label: "Avg Views/Video", value: avgViews, icon: TrendingUp, color: "text-blue-400", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
            { label: "Total Likes", value: totalLikes, icon: Heart, color: "text-pink-400", gradient: "from-pink-500/10 to-rose-500/10", border: "border-pink-500/20" },
            { label: "Comments", value: totalComments, icon: MessageCircle, color: "text-green-400", gradient: "from-green-500/10 to-emerald-500/10", border: "border-green-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-4 sm:p-5`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two column: Top Content + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Content by Views */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Top Content by Views</h2>
              </div>
              {topByViews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No content data yet</p>
              ) : (
                <div className="space-y-2">
                  {topByViews.map((item, i) => {
                    const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                    const maxViews = topByViews[0]?.viewCount || 1;
                    const barWidth = Math.max(5, (item.viewCount / maxViews) * 100);

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                        onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                      >
                        <span className={`w-5 text-xs font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-600" : "text-muted-foreground/40"}`}>
                          {i + 1}
                        </span>
                        <div className="relative w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-white/5">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{item.title}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{item.viewCount.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold">Content by Category</h2>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No content data yet</p>
              ) : (
                <div className="space-y-3">
                  {categories.map(([cat, data]) => {
                    const maxViews = categories[0]?.[1].views || 1;
                    const barWidth = Math.max(5, (data.views / maxViews) * 100);
                    const colors = ["from-amber-500 to-orange-500", "from-purple-500 to-pink-500", "from-blue-500 to-cyan-500", "from-green-500 to-emerald-500", "from-red-500 to-rose-500"];
                    const colorIdx = categories.findIndex((c) => c[0] === cat) % colors.length;

                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{cat}</span>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{data.count} videos</span>
                            <span>{data.views.toLocaleString()} views</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors[colorIdx]}`}
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

        {/* Content Summary Table */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Content Summary</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl font-bold text-amber-400">{publishedContent.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Published</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl font-bold text-blue-400">{content.length - publishedContent.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Drafts</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl font-bold text-green-400">{freeContent.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Free</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-2xl font-bold text-purple-400">{paidContent.length}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Paid</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Content by Likes */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-semibold">Most Liked Content</h2>
            </div>
            {topByLikes.filter((c) => (c.likeCount || 0) > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No likes yet — share your content to get engagement!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topByLikes.filter((c) => (c.likeCount || 0) > 0).map((item) => {
                  const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Film className="w-3 h-3 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 text-pink-400"><Heart className="w-3 h-3" />{item.likeCount}</span>
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.viewCount}</span>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CreatorStats {
  totalContent: number;
  publishedContent: number;
  totalEarnings: number;
  totalViews: number;
}

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priceTzs: number;
  viewCount: number;
  createdAt: string;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      fetchDashboardData();
    }
  }, [session, isPending, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([
        fetch("/api/creator/stats"),
        fetch("/api/creator/content?limit=5"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setRecentContent(contentData.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient gradient blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header — frosted glass */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Creator Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage your content and earnings
              </p>
            </div>
            <Link href="/creator/content/new">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]">
                + Create Content
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid — glassmorphism cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: "Total Content", value: stats?.totalContent || 0, icon: "📦", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
            { label: "Published", value: stats?.publishedContent || 0, icon: "🚀", gradient: "from-green-500/10 to-emerald-500/10", border: "border-green-500/20" },
            { label: "Total Views", value: stats?.totalViews || 0, icon: "👁️", gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20" },
            { label: "Total Earnings", value: stats?.totalEarnings || 0, icon: "💰", gradient: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20", suffix: "TZS" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
              {/* Gloss overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {stat.value.toLocaleString()}
                  {stat.suffix && (
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">{stat.suffix}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Content — glassmorphism card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          {/* Top gloss line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          {/* Inner gloss */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Recent Content</h2>
              <Link href="/creator/content">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  View All →
                </Button>
              </Link>
            </div>

            {recentContent.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-3xl">🎬</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start creating exclusive content for your fans and earn from every view
                </p>
                <Link href="/creator/content/new">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]">
                    Create Your First Content
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContent.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-sm transition-all duration-200 hover:border-white/10 hover:shadow-lg"
                  >
                    {/* Hover gloss */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs">{item.category}</span>
                        <span>{item.viewCount} views</span>
                        <span className="text-amber-500 font-medium">{item.priceTzs} TZS</span>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          item.status === "published"
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : item.status === "draft"
                            ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                            : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                      <Link href={`/creator/content/${item.id}/edit`}>
                        <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

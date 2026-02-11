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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Manage your content and earnings
              </p>
            </div>
            <Link href="/creator/content/new">
              <Button>+ Create Content</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Total Content</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalContent || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.publishedContent || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalViews || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalEarnings || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">TZS</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Content</h2>
              <Link href="/creator/content">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentContent.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start creating exclusive content for your fans
                </p>
                <Link href="/creator/content/new">
                  <Button>Create Your First Content</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.viewCount} views</span>
                        <span>•</span>
                        <span>{item.priceTzs} TZS</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "published"
                            ? "bg-green-500/10 text-green-500"
                            : item.status === "draft"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-neutral-500/10 text-neutral-500"
                        }`}
                      >
                        {item.status}
                      </span>
                      <Link href={`/creator/content/${item.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

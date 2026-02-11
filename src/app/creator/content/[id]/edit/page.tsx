"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  contentType: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/creator/content/${contentId}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-4">This content may have been deleted.</p>
          <Link href="/creator/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header — frosted glass */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/creator/dashboard")} className="hover:bg-white/10">
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {content.category} • <span className="text-amber-500 font-medium">{content.priceTzs} TZS</span>
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                content.status === "published"
                  ? "bg-green-500/15 text-green-400 border border-green-500/20"
                  : content.status === "draft"
                  ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                  : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20"
              }`}
            >
              {content.status}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats — glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: "Views", value: content.viewCount, icon: "👁️", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
            { label: "Likes", value: content.likeCount, icon: "❤️", gradient: "from-pink-500/10 to-rose-500/10", border: "border-pink-500/20" },
            { label: "Comments", value: content.commentCount, icon: "💬", gradient: "from-purple-500/10 to-violet-500/10", border: "border-purple-500/20" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {content.description && (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-3">Description</h2>
              <p className="text-muted-foreground">{content.description}</p>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Content Details</h2>
            <div className="space-y-4 text-sm">
              {[
                { label: "Type", value: content.contentType === "youtube_preview" ? "YouTube Early Access" : "Upload" },
                { label: "Price", value: `${content.priceTzs} TZS` },
                { label: "Published", value: content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : "Not published" },
                { label: "Created", value: new Date(content.createdAt).toLocaleDateString() },
              ].map((detail) => (
                <div key={detail.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <Link href="/creator/dashboard">
            <Button variant="outline" className="border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/creator/content/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]">
              Create Another
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

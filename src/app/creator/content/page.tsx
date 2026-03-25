"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Film,
  Music,
  Plus,
  Pencil,
  Eye,
  Heart,
  MessageCircle,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Share2,
  MoreVertical,
  Globe,
  Lock,
  FileEdit,
} from "lucide-react";

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
  storageKey?: string | null;
}

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
  media?: MediaItem[];
}

type FilterStatus = "all" | "published" | "draft";
type SortBy = "newest" | "oldest" | "views" | "earnings";

export default function ContentManagement() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) fetchContent();
  }, [session, isPending, router]);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/creator/content?limit=100");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      const res = await fetch(`/api/creator/content/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContent((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Silent
    }
    setActiveMenu(null);
  };

  const filteredContent = useMemo(() => {
    let items = [...content];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      items = items.filter((c) => c.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "views":
        items.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "earnings":
        items.sort((a, b) => b.priceTzs - a.priceTzs);
        break;
      default:
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return items;
  }, [content, searchQuery, filterStatus, sortBy]);

  const statusCounts = useMemo(() => ({
    all: content.length,
    published: content.filter((c) => c.status === "published").length,
    draft: content.filter((c) => c.status === "draft").length,
  }), [content]);

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Content</h1>
              <p className="text-sm text-muted-foreground">{content.length} item{content.length !== 1 ? "s" : ""} · Manage your library</p>
            </div>
            <Link href="/creator/content/new">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-5">
        {/* Status tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            {(["all", "published", "draft"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? "bg-amber-500/20 text-amber-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1.5 text-[10px] opacity-60">{statusCounts[status]}</span>
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Most views</option>
              <option value="earnings">Highest price</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {filteredContent.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <Film className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-1">
                {searchQuery || filterStatus !== "all" ? "No matching content" : "No content yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first video to start earning"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Link href="/creator/content/new">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Content
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Table header — desktop */}
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_100px_80px_40px] gap-4 px-5 py-3 border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              <span>Video</span>
              <span>Visibility</span>
              <span className="text-right">Views</span>
              <span className="text-right">Likes</span>
              <span className="text-right">Price</span>
              <span className="text-right">Date</span>
              <span></span>
            </div>

            {/* Content rows */}
            <div className="divide-y divide-white/5">
              {filteredContent.map((item) => {
                const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                const dateStr = item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div key={item.id} className="group relative">
                    {/* Desktop row */}
                    <div
                      className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_100px_80px_40px] gap-4 items-center px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      {/* Video info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-[120px] h-[68px] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                          {thumb ? (
                            <Image src={thumb} alt={item.title} fill className="object-cover" sizes="120px" />
                          ) : item.contentType === "audio_upload" ? (
                            <Music className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Film className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate leading-tight">{item.title}</h3>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5 max-w-[300px]">{item.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.contentType === "audio_upload" && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium"><Music className="w-2.5 h-2.5" />Music</span>
                            )}
                            <span className="text-[10px] text-muted-foreground/60">{item.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Visibility */}
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${
                          item.status === "published"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {item.status === "published" ? <Globe className="w-3 h-3" /> : <FileEdit className="w-3 h-3" />}
                          {item.status === "published" ? "Public" : "Draft"}
                        </span>
                      </div>

                      {/* Views */}
                      <div className="text-right text-sm text-muted-foreground">{item.viewCount.toLocaleString()}</div>

                      {/* Likes */}
                      <div className="text-right text-sm text-muted-foreground">{(item.likeCount || 0).toLocaleString()}</div>

                      {/* Price */}
                      <div className="text-right">
                        <span className={`text-xs font-medium ${item.priceTzs === 0 ? "text-green-400" : "text-amber-400"}`}>
                          {item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS`}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="text-right text-xs text-muted-foreground">{dateStr}</div>

                      {/* Actions */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {activeMenu === item.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden">
                              <button
                                onClick={() => { router.push(`/creator/content/${item.id}/edit`); setActiveMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => { window.open(`/content/${item.id}`, "_blank"); setActiveMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> View public page
                              </button>
                              <button
                                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/content/${item.id}`); setActiveMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Copy link
                              </button>
                              <div className="border-t border-white/10" />
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div
                      className="md:hidden flex items-start gap-3 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                        {thumb ? (
                          <Image src={thumb} alt={item.title} fill className="object-cover" sizes="112px" />
                        ) : item.contentType === "audio_upload" ? (
                          <Music className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Film className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                            {item.status === "published" ? "Public" : "Draft"}
                          </span>
                          <span>{item.viewCount} views</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="text-amber-500 font-medium">{item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS`}</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import {
  Film, Music, Plus, Pencil, Eye, Heart, Search,
  Trash2, ExternalLink, Share2, MoreVertical, Globe, FileEdit,
} from "lucide-react";

interface MediaItem { id: string; mediaType: string; url: string | null; storageKey?: string | null; }
interface ContentItem {
  id: string; title: string; description: string | null; category: string; status: string;
  contentType: string; priceTzs: number; viewCount: number; likeCount: number;
  commentCount: number; publishedAt: string | null; createdAt: string; media?: MediaItem[];
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
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchContent();
  }, [session, isPending, router]);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/creator/content?limit=100");
      if (res.ok) { const data = await res.json(); setContent(data.content || []); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      const res = await fetch(`/api/creator/content/${id}`, { method: "DELETE" });
      if (res.ok) setContent((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
    setActiveMenu(null);
  };

  const filteredContent = useMemo(() => {
    let items = [...content];
    if (searchQuery) { const q = searchQuery.toLowerCase(); items = items.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)); }
    if (filterStatus !== "all") items = items.filter((c) => c.status === filterStatus);
    switch (sortBy) {
      case "oldest": items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "views": items.sort((a, b) => b.viewCount - a.viewCount); break;
      case "earnings": items.sort((a, b) => b.priceTzs - a.priceTzs); break;
      default: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.CONTENT</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-lg font-bold font-mono tracking-tight text-white">Content</h1>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{content.length} item{content.length !== 1 ? "s" : ""}</p>
            </div>
            <Link
              href="/creator/content/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-4">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Status tabs */}
          <div className="flex items-center gap-1">
            {(["all", "published", "draft"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest border transition-all ${
                  filterStatus === status
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white bg-transparent"
                }`}
              >
                {status}
                <span className="ml-1.5 opacity-60">{statusCounts[status]}</span>
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-white/10 bg-white/3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 border border-white/10 bg-white/3 text-[10px] font-mono text-white/40 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="newest" className="bg-neutral-900">Newest</option>
              <option value="oldest" className="bg-neutral-900">Oldest</option>
              <option value="views" className="bg-neutral-900">Most views</option>
              <option value="earnings" className="bg-neutral-900">Highest price</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {filteredContent.length === 0 ? (
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 mx-auto mb-4 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center">
                <Film className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">
                {searchQuery || filterStatus !== "all" ? "NO.RESULTS" : "NO.CONTENT"}
              </p>
              <p className="font-mono text-sm text-white/40 mb-5">
                {searchQuery || filterStatus !== "all" ? "Try adjusting your search or filters" : "Upload your first video to start earning"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Link
                  href="/creator/content/new"
                  className="inline-flex items-center gap-1.5 h-9 px-5 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Content
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />

            {/* Table header — desktop */}
            <div className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_110px_80px_36px] gap-4 px-5 py-2.5 border-b border-white/10 text-[9px] font-mono font-semibold uppercase tracking-widest text-white/20">
              <span>Content</span>
              <span>Status</span>
              <span className="text-right">Views</span>
              <span className="text-right">Likes</span>
              <span className="text-right">Price</span>
              <span className="text-right">Date</span>
              <span />
            </div>

            {/* Content rows */}
            <div className="divide-y divide-white/5">
              {filteredContent.map((item) => {
                const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                const dateStr = new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div key={item.id} className="group relative">
                    {/* Desktop row */}
                    <div
                      className="hidden md:grid grid-cols-[minmax(0,1fr)_100px_80px_80px_110px_80px_36px] gap-4 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-[112px] h-[63px] overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 flex items-center justify-center">
                          {thumb ? (
                            <Image src={thumb} alt={item.title} fill className="object-cover" sizes="112px" />
                          ) : item.contentType === "audio_upload" ? (
                            <Music className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Film className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-mono font-medium text-sm text-white/80 truncate leading-tight">{item.title}</h3>
                          {item.description && (
                            <p className="text-[10px] font-mono text-white/30 truncate mt-0.5 max-w-[280px]">{item.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.contentType === "audio_upload" && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 border border-amber-500/20 bg-amber-500/8 text-amber-400 uppercase tracking-wider">
                                <Music className="w-2.5 h-2.5" />Music
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">{item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                          item.status === "published"
                            ? "border-green-500/30 bg-green-500/8 text-green-400"
                            : "border-yellow-500/30 bg-yellow-500/8 text-yellow-400"
                        }`}>
                          {item.status === "published" ? <Globe className="w-2.5 h-2.5" /> : <FileEdit className="w-2.5 h-2.5" />}
                          {item.status === "published" ? "Live" : "Draft"}
                        </span>
                      </div>

                      <div className="text-right text-sm font-mono text-white/40">{item.viewCount.toLocaleString()}</div>
                      <div className="text-right text-sm font-mono text-white/40">{(item.likeCount || 0).toLocaleString()}</div>

                      <div className="text-right">
                        <span className={`text-[11px] font-mono font-semibold ${item.priceTzs === 0 ? "text-green-400" : "text-amber-400"}`}>
                          {item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS`}
                        </span>
                      </div>

                      <div className="text-right text-[10px] font-mono text-white/30">{dateStr}</div>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                          className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenu === item.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 border border-white/15 bg-neutral-950 overflow-hidden">
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/30" />
                              {[
                                { label: "Edit", icon: Pencil, action: () => { router.push(`/creator/content/${item.id}/edit`); setActiveMenu(null); } },
                                { label: "View public page", icon: ExternalLink, action: () => { window.open(`/content/${item.id}`, "_blank"); setActiveMenu(null); } },
                                { label: "Copy link", icon: Share2, action: () => { navigator.clipboard.writeText(`${window.location.origin}/content/${item.id}`); setActiveMenu(null); } },
                              ].map((a) => (
                                <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-3 py-2.5 text-[10px] font-mono text-white/50 hover:text-white hover:bg-white/5 uppercase tracking-wider transition-colors">
                                  <a.icon className="w-3 h-3" /> {a.label}
                                </button>
                              ))}
                              <div className="border-t border-white/10" />
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-[10px] font-mono text-red-400 hover:bg-red-500/8 uppercase tracking-wider transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div
                      className="md:hidden flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                    >
                      <div className="relative w-24 h-14 overflow-hidden flex-shrink-0 bg-white/5 border border-white/5 flex items-center justify-center">
                        {thumb ? (
                          <Image src={thumb} alt={item.title} fill className="object-cover" sizes="96px" />
                        ) : item.contentType === "audio_upload" ? (
                          <Music className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Film className="w-4 h-4 text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono font-medium text-sm text-white/80 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                          <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${
                            item.status === "published" ? "border-green-500/30 bg-green-500/8 text-green-400" : "border-yellow-500/30 bg-yellow-500/8 text-yellow-400"
                          }`}>{item.status === "published" ? "Live" : "Draft"}</span>
                          <span className="text-white/30">{item.viewCount} views</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono">
                          <span className="text-amber-400">{item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS`}</span>
                          <span className="text-white/20">{dateStr}</span>
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

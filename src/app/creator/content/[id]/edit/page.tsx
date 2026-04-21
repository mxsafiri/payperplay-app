"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Eye, Heart, MessageCircle, ArrowLeft, Film, Plus, Save, Trash2, Send, Share2, Copy, Check, Link2, ExternalLink } from "lucide-react";
import { useToast, Toaster } from "@/components/ui/toast";

interface ViewOnceLink {
  id: string;
  slug: string;
  url: string;
  priceTzs: number;
  teaserSeconds: number;
  purchaseCount: number;
  isActive: boolean;
  createdAt: string;
}

interface MediaItem { id: string; mediaType: string; url: string | null; }
interface CommentUser { id: string; handle: string; displayName: string | null; avatarUrl: string | null; }
interface Comment { id: string; body: string; createdAt: string; user: CommentUser; }
interface ContentItem {
  id: string; title: string; description: string | null; category: string; status: string; contentType: string;
  priceTzs: number; viewCount: number; likeCount: number; commentCount: number;
  publishedAt: string | null; createdAt: string; media?: MediaItem[]; comments?: Comment[];
}

const CATEGORIES = ["Music", "Comedy", "Education", "Entertainment", "News", "Sports", "Lifestyle", "Tech"];

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toasts, toast, dismiss } = useToast();
  const contentId = params.id as string;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriceType, setEditPriceType] = useState<"free" | "paid">("paid");
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // View-once links
  const [viewOnceLinks, setViewOnceLinks] = useState<ViewOnceLink[]>([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkPrice, setLinkPrice] = useState("");
  const [linkTeaser, setLinkTeaser] = useState("10");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/creator/content/${contentId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.content;
        setContent(c); setEditTitle(c.title); setEditDescription(c.description || "");
        setEditCategory(c.category); setEditPriceType(c.priceTzs === 0 ? "free" : "paid");
        setEditPrice(c.priceTzs === 0 ? "" : String(c.priceTzs));
        if (c.contentType === "upload") fetchStreamUrl();
      }
    } catch (error) { console.error("Failed to fetch content:", error); }
    finally { setLoading(false); }
  };

  const fetchStreamUrl = async () => {
    try {
      const res = await fetch(`/api/content/${contentId}/stream`);
      if (res.ok) { const data = await res.json(); setStreamUrl(data.url); }
    } catch (error) { console.error("Failed to fetch stream URL:", error); }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    const priceTzs = editPriceType === "free" ? 0 : Number(editPrice);
    if (editPriceType === "paid" && (isNaN(priceTzs) || priceTzs < 500)) { setSaveError("Minimum price is 500 TZS"); setSaving(false); return; }
    try {
      const res = await fetch(`/api/creator/content/${contentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() || null, category: editCategory, priceTzs }),
      });
      if (res.ok) { setSaveSuccess(true); toast("Changes saved successfully!", "success"); fetchContent(); setTimeout(() => setSaveSuccess(false), 3000); }
      else { const data = await res.json(); const msg = data.error || "Failed to save"; setSaveError(msg); toast(msg, "error"); }
    } catch { setSaveError("Failed to save changes"); toast("Failed to save changes", "error"); }
    finally { setSaving(false); }
  };

  const handleTogglePublish = async () => {
    if (!content) return;
    const newStatus = content.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/creator/content/${contentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast(newStatus === "published" ? "Content published!" : "Content unpublished", "success"); fetchContent(); }
      else toast("Failed to update status", "error");
    } catch { toast("Failed to update status", "error"); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this content permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/creator/content/${contentId}`, { method: "DELETE" });
      if (res.ok) { toast("Content deleted", "success"); setTimeout(() => router.push("/creator/dashboard"), 1000); }
      else toast("Failed to delete content", "error");
    } catch { toast("Failed to delete content", "error"); }
    finally { setDeleting(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/creator/content/${contentId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: replyText.trim() }),
      });
      if (res.ok) { setReplyText(""); fetchContent(); }
    } catch { console.error("Failed to reply"); }
    finally { setReplying(false); }
  };

  // Fetch existing view-once links for this content
  const fetchViewOnceLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/view-once?contentId=${contentId}`);
      if (res.ok) {
        const data = await res.json();
        setViewOnceLinks(data.links || []);
      }
    } catch {
      // non-critical
    }
  }, [contentId]);

  useEffect(() => {
    fetchViewOnceLinks();
  }, [fetchViewOnceLinks]);

  const handleCreateLink = async () => {
    const price = Number(linkPrice);
    if (!price || price < 100) {
      toast("Minimum price is 100 TZS", "error");
      return;
    }
    setCreatingLink(true);
    try {
      const res = await fetch("/api/view-once", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          priceTzs: price,
          teaserSeconds: Number(linkTeaser) || 10,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Share link created! Copy and share it on social media.", "success");
        setShowLinkForm(false);
        setLinkPrice("");
        fetchViewOnceLinks();
      } else {
        toast(data.error || "Failed to create link", "error");
      }
    } catch {
      toast("Failed to create link", "error");
    } finally {
      setCreatingLink(false);
    }
  };

  const copyToClipboard = async (url: string, slug: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      toast("Link copied!", "success");
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const shareLink = (url: string, title: string) => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      copyToClipboard(url, "");
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center border border-white/10 p-10">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">CONTENT.NOT_FOUND</p>
          <p className="font-mono text-sm text-white/40 mb-5">This content may have been deleted.</p>
          <Link href="/creator/dashboard"
            className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const youtubeMedia = content.media?.find((m) => m.mediaType === "youtube");
  const embedUrl = youtubeMedia?.url ? getYouTubeEmbedUrl(youtubeMedia.url) : null;
  const thumbnailMedia = content.media?.find((m) => m.mediaType === "thumbnail");
  const isUpload = content.contentType === "upload";

  return (
    <div className="min-h-screen bg-neutral-950">
      <Toaster toasts={toasts} dismiss={dismiss} />
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/creator/dashboard")}
                className="inline-flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider hover:text-white hover:bg-white/5 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all">
                ← Dashboard
              </button>
              <div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CONTENT.EDIT</div>
                <h1 className="text-sm font-bold font-mono tracking-tight text-white truncate max-w-[200px]">{content.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleTogglePublish}
                className="inline-flex h-7 items-center px-3 border border-white/15 text-[9px] font-mono text-white/40 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all">
                {content.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <span className={`px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                content.status === "published"
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}>{content.status}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Video Preview */}
        <div className="border border-white/10 overflow-hidden">
          {isUpload && streamUrl ? (
            <div className="aspect-video bg-black">
              <video src={streamUrl} controls className="w-full h-full" poster={thumbnailMedia?.url || undefined} controlsList="nodownload" />
            </div>
          ) : embedUrl ? (
            <div className="aspect-video bg-black">
              <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : thumbnailMedia?.url ? (
            <div className="relative aspect-video">
              <Image src={thumbnailMedia.url} alt={content.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
            </div>
          ) : (
            <div className="aspect-video bg-neutral-900 flex items-center justify-center">
              <span className="text-white/20 font-mono text-4xl">▶</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { index: "01", label: "Views", value: content.viewCount },
            { index: "02", label: "Likes", value: content.likeCount },
            { index: "03", label: "Comments", value: content.comments?.length || 0 },
          ].map((s) => (
            <div key={s.label} className="border border-white/10 bg-neutral-950 p-4 hover:border-amber-500/15 transition-colors">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">{s.index}</div>
              <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Share Links */}
        {content.status === "published" && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 backdrop-blur-md bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold tracking-tight">Share & Earn</h2>
                </div>
                {!showLinkForm && (
                  <button
                    onClick={() => {
                      setShowLinkForm(true);
                      setLinkPrice(String(content.priceTzs || 500));
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Create Link
                  </button>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Generate view-once links to share on WhatsApp, Instagram, Twitter — fans pay with M-Pesa, no account needed.
              </p>

              {/* Create link form */}
              {showLinkForm && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Price (TZS)</label>
                      <Input
                        type="number"
                        value={linkPrice}
                        onChange={(e) => setLinkPrice(e.target.value)}
                        min={100}
                        placeholder="500"
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-muted-foreground mb-1 block">Preview (s)</label>
                      <Input
                        type="number"
                        value={linkTeaser}
                        onChange={(e) => setLinkTeaser(e.target.value)}
                        min={5}
                        max={30}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateLink}
                      disabled={creatingLink}
                      className="inline-flex items-center gap-1.5 h-8 px-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Link2 className="w-3 h-3" />
                      {creatingLink ? "Creating..." : "Generate Link"}
                    </button>
                    <button
                      onClick={() => setShowLinkForm(false)}
                      className="inline-flex items-center h-8 px-3 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing links */}
              {viewOnceLinks.length > 0 ? (
                <div className="space-y-2">
                  {viewOnceLinks.map((vl) => (
                    <div
                      key={vl.id}
                      className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-amber-400 font-mono truncate">
                            payperplay.xyz/v/{vl.slug}
                          </code>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {vl.priceTzs.toLocaleString()} TZS
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {vl.purchaseCount} purchase{vl.purchaseCount !== 1 ? "s" : ""} &middot; {vl.teaserSeconds}s preview
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(vl.url, vl.slug)}
                          className="h-8 w-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
                        >
                          {copiedSlug === vl.slug ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => shareLink(vl.url, content.title)}
                          className="h-8 w-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !showLinkForm ? (
                <div className="text-center py-4 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                  <Share2 className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">
                    No share links yet — create one to start earning from social media
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CONTENT.EDIT</div>
              <h2 className="text-sm font-semibold font-mono text-white">Edit Details</h2>
            </div>

            {saveSuccess && (
              <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-400 text-[11px] font-mono">✓ Changes saved successfully</div>
            )}
            {saveError && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">{saveError}</div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="bg-white/5 border-white/15 text-white font-mono text-sm rounded-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4}
                className="w-full bg-white/5 border border-white/15 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 resize-none"
                placeholder="Describe your content..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setEditCategory(cat)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider border transition-all ${
                      editCategory === cat ? "border-amber-500 bg-amber-500 text-black" : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white"
                    }`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Pricing</label>
              <div className="flex gap-2 mb-2">
                {["free", "paid"].map((type) => (
                  <button key={type} onClick={() => setEditPriceType(type as "free" | "paid")}
                    className={`px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider border transition-all ${
                      editPriceType === type
                        ? type === "free" ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white"
                    }`}>{type}</button>
                ))}
              </div>
              {editPriceType === "paid" && (
                <div className="flex items-center gap-2">
                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} min={500} placeholder="500"
                    className="bg-white/5 border-white/15 text-white font-mono text-sm rounded-none w-36" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">TZS</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !editTitle.trim()}
                className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes →"}
              </button>
              <Link href={`/content/${contentId}`}
                className="inline-flex h-9 items-center px-5 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all">
                View Public Page
              </Link>
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CONTENT.INFO</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-4">Content Info</h2>
            <div className="space-y-0">
              {[
                { label: "Type", value: content.contentType === "youtube_preview" ? "YouTube" : "Upload" },
                { label: "Price", value: content.priceTzs === 0 ? "Free" : `${content.priceTzs} TZS` },
                { label: "Published", value: content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : "Not published" },
                { label: "Created", value: new Date(content.createdAt).toLocaleDateString() },
              ].map((d) => (
                <div key={d.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{d.label}</span>
                  <span className="text-xs font-mono font-semibold text-white/70">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CONTENT.COMMENTS</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-4">
              Comments ({content.comments?.length || 0})
            </h2>

            <div className="flex gap-2 mb-5">
              <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply to your fans..."
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleReply()} />
              <button onClick={handleReply} disabled={replying || !replyText.trim()}
                className="inline-flex h-9 items-center px-4 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                Send
              </button>
            </div>

            {(!content.comments || content.comments.length === 0) ? (
              <div className="text-center py-8 border border-dashed border-white/5">
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">NO.COMMENTS</p>
                <p className="text-xs font-mono text-white/30 mt-1">Comments from fans will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {content.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold font-mono text-amber-400">
                      {(comment.user.displayName || comment.user.handle).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-semibold text-white/70">
                          {comment.user.displayName || `@${comment.user.handle}`}
                        </span>
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-white/40">{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/20 bg-red-500/3 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/30" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-red-500/50 uppercase tracking-widest mb-0.5">DANGER.ZONE</div>
            <h2 className="text-sm font-semibold font-mono text-red-400 mb-1">Danger Zone</h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">
              Permanently delete this content and all associated data.
            </p>
            <button onClick={handleDelete} disabled={deleting}
              className="inline-flex h-9 items-center px-5 border border-red-500/30 text-[10px] font-mono text-red-400 uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete Content"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

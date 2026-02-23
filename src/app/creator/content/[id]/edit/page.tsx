"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Heart, MessageCircle, ArrowLeft, Film, Plus, Save, Trash2, Send } from "lucide-react";

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
}

interface CommentUser {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: CommentUser;
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
  comments?: Comment[];
}

const CATEGORIES = ["Music", "Comedy", "Education", "Entertainment", "News", "Sports", "Lifestyle", "Tech"];

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriceType, setEditPriceType] = useState<"free" | "paid">("paid");
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Video preview
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Comments
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const res = await fetch(`/api/creator/content/${contentId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.content;
        setContent(c);
        setEditTitle(c.title);
        setEditDescription(c.description || "");
        setEditCategory(c.category);
        setEditPriceType(c.priceTzs === 0 ? "free" : "paid");
        setEditPrice(c.priceTzs === 0 ? "" : String(c.priceTzs));

        // Fetch stream URL for uploaded content
        if (c.contentType === "upload") {
          fetchStreamUrl();
        }
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamUrl = async () => {
    try {
      const res = await fetch(`/api/content/${contentId}/stream`);
      if (res.ok) {
        const data = await res.json();
        setStreamUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to fetch stream URL:", error);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const priceTzs = editPriceType === "free" ? 0 : Number(editPrice);
    if (editPriceType === "paid" && (isNaN(priceTzs) || priceTzs < 500)) {
      setSaveError("Minimum price is 500 TZS");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/creator/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          category: editCategory,
          priceTzs,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchContent();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
      }
    } catch (error) {
      setSaveError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!content) return;
    const newStatus = content.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/creator/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchContent();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this content permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/creator/content/${contentId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/creator/dashboard");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/creator/content/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        fetchContent();
      }
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setReplying(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
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

  const youtubeMedia = content.media?.find((m) => m.mediaType === "youtube");
  const embedUrl = youtubeMedia?.url ? getYouTubeEmbedUrl(youtubeMedia.url) : null;
  const thumbnailMedia = content.media?.find((m) => m.mediaType === "thumbnail");
  const isUpload = content.contentType === "upload";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/creator/dashboard")} className="hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Content</h1>
                <p className="text-sm text-muted-foreground">{content.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublish}
                className="border-white/10"
              >
                {content.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                  content.status === "published"
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                }`}
              >
                {content.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Video Preview */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          {isUpload && streamUrl ? (
            <div className="aspect-video bg-black">
              <video
                src={streamUrl}
                controls
                className="w-full h-full"
                poster={thumbnailMedia?.url || undefined}
                controlsList="nodownload"
              />
            </div>
          ) : embedUrl ? (
            <div className="aspect-video bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : thumbnailMedia?.url ? (
            <div className="relative aspect-video">
              <Image src={thumbnailMedia.url} alt={content.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Film className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Views", value: content.viewCount, icon: Eye, iconColor: "text-blue-400", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
            { label: "Likes", value: content.likeCount, icon: Heart, iconColor: "text-pink-400", gradient: "from-pink-500/10 to-rose-500/10", border: "border-pink-500/20" },
            { label: "Comments", value: content.comments?.length || 0, icon: MessageCircle, iconColor: "text-purple-400", gradient: "from-purple-500/10 to-violet-500/10", border: "border-purple-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-4 transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6 space-y-5">
            <h2 className="text-lg font-semibold tracking-tight">Edit Details</h2>

            {saveSuccess && (
              <div className="px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-sm">
                Changes saved successfully
              </div>
            )}
            {saveError && (
              <div className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                placeholder="Describe your content..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEditCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      editCategory === cat
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Pricing</label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setEditPriceType("free")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    editPriceType === "free"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Free
                </button>
                <button
                  onClick={() => setEditPriceType("paid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    editPriceType === "paid"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Paid
                </button>
              </div>
              {editPriceType === "paid" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min={500}
                    placeholder="500"
                    className="bg-white/5 border-white/10 w-40"
                  />
                  <span className="text-sm text-muted-foreground">TZS</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/content/${contentId}`}>
                <Button variant="outline" className="border-white/10">
                  <Eye className="w-4 h-4 mr-1.5" />
                  View Public Page
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="relative p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Content Info</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Type", value: content.contentType === "youtube_preview" ? "YouTube" : "Upload" },
                { label: "Price", value: content.priceTzs === 0 ? "Free" : `${content.priceTzs} TZS` },
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

        {/* Comments Section */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="relative p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-4">
              Comments ({content.comments?.length || 0})
            </h2>

            {/* Reply input */}
            <div className="flex gap-3 mb-6">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to your fans..."
                className="bg-white/5 border-white/10 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
              />
              <Button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comment list */}
            {(!content.comments || content.comments.length === 0) ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
                <p className="text-xs text-muted-foreground mt-1">Comments from fans will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {(comment.user.displayName || comment.user.handle).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.user.displayName || `@${comment.user.handle}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 backdrop-blur-md bg-red-500/5">
          <div className="relative p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-2 text-red-400">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this content and all associated data.
            </p>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {deleting ? "Deleting..." : "Delete Content"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

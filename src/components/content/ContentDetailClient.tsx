"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { placeholderCreators } from "@/data/placeholder-creators";
import { InteractionBar } from "@/components/content/InteractionBar";
import { CommentSection } from "@/components/content/CommentSection";
import { TipPanel } from "@/components/content/TipPanel";

interface ContentDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  contentType: string;
  creator: {
    id: string;
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  media: Array<{
    id: string;
    mediaType: string;
    url: string | null;
    storageKey?: string | null;
  }>;
  hasAccess: boolean;
}

interface Props {
  content: ContentDetail;
  contentId: string;
  initialStreamUrl: string | null;
  initialPreviewUrl: string | null;
}

const PREVIEW_SECONDS = 10;

export function ContentDetailClient({
  content: initialContent,
  contentId,
  initialStreamUrl,
  initialPreviewUrl,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [content, setContent] = useState(initialContent);
  const [streamUrl, setStreamUrl] = useState<string | null>(initialStreamUrl);
  const [previewUrl] = useState<string | null>(initialPreviewUrl);
  const [previewEnded, setPreviewEnded] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [showTipPanel, setShowTipPanel] = useState(false);

  // Fetch wallet balance + follow status on mount
  useEffect(() => {
    if (!session) return;
    fetch("/api/wallet")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setWalletBalance(d.wallet?.balanceTzs ?? 0))
      .catch(() => {});
    fetch(`/api/follow?creatorId=${content.creator.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setIsFollowing(d.isFollowing); setFollowerCount(d.followerCount); }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const fetchStreamUrl = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/${contentId}/stream`);
      if (res.ok) {
        const data = await res.json();
        setStreamUrl(data.streamUrl);
      }
    } catch { /* non-critical */ }
  }, [contentId, router]);

  const handleFollowToggle = async () => {
    if (!session) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: content.creator.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch { /* non-critical */ }
    finally { setFollowLoading(false); }
  };

  const handlePayment = async () => {
    if (!session) { router.push("/login"); return; }
    setPaymentError("");
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setPaymentError(
            `Insufficient balance. You need ${data.required?.toLocaleString()} TZS but have ${data.balance?.toLocaleString()} TZS. Top up your wallet first.`
          );
        } else {
          setPaymentError(data.error || "Payment failed");
        }
        return;
      }
      setPaymentSuccess(true);
      // Update local state — no need to re-fetch content from server
      setContent((c) => ({ ...c, hasAccess: true }));
      fetchStreamUrl();
    } catch {
      setPaymentError("An unexpected error occurred");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePreviewTimeUpdate = useCallback(() => {
    const video = previewVideoRef.current;
    if (video && video.currentTime >= PREVIEW_SECONDS) {
      video.pause();
      setPreviewEnded(true);
    }
  }, []);

  const getCreatorImage = (creatorId: string) => {
    const index = parseInt(creatorId.slice(-1), 16) % placeholderCreators.length;
    return placeholderCreators[index]?.image || placeholderCreators[0].image;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const youtubeMedia = content.media.find((m) => m.mediaType === "youtube");
  const embedUrl = youtubeMedia?.url ? getYouTubeEmbedUrl(youtubeMedia.url) : null;
  const isUpload = content.contentType === "upload";
  const thumbnailMedia = content.media.find((m) => m.mediaType === "thumbnail");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            {content.hasAccess && isUpload && streamUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={streamUrl}
                  controls
                  preload="metadata"
                  className="w-full h-full"
                  poster={thumbnailMedia?.url || undefined}
                  controlsList="nodownload"
                />
                {!showTipPanel && (
                  <button
                    onClick={() => setShowTipPanel(true)}
                    className="absolute bottom-14 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold hover:bg-primary-500 transition-colors"
                  >
                    💰 Tip
                  </button>
                )}
                <TipPanel
                  contentId={contentId}
                  creatorName={content.creator.displayName || `@${content.creator.handle}`}
                  walletBalance={walletBalance}
                  isOpen={showTipPanel}
                  onClose={() => setShowTipPanel(false)}
                />
              </div>
            ) : content.hasAccess && embedUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!showTipPanel && (
                  <button
                    onClick={() => setShowTipPanel(true)}
                    className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold hover:bg-primary-500 transition-colors"
                  >
                    💰 Tip
                  </button>
                )}
                <TipPanel
                  contentId={contentId}
                  creatorName={content.creator.displayName || `@${content.creator.handle}`}
                  walletBalance={walletBalance}
                  isOpen={showTipPanel}
                  onClose={() => setShowTipPanel(false)}
                />
              </div>
            ) : content.hasAccess && isUpload && !streamUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3" />
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            ) : !content.hasAccess && isUpload && previewUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={previewVideoRef}
                  src={previewUrl}
                  controls={!previewEnded}
                  preload="metadata"
                  className="w-full h-full"
                  poster={thumbnailMedia?.url || undefined}
                  controlsList="nodownload nofullscreen"
                  onTimeUpdate={handlePreviewTimeUpdate}
                  autoPlay
                  muted
                />
                {!previewEnded && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                    Preview · {PREVIEW_SECONDS}s
                  </div>
                )}
                {previewEnded && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white max-w-sm px-4">
                      <div className="text-5xl mb-3">🔒</div>
                      <h3 className="text-xl font-bold mb-2">Preview ended</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Pay {content.priceTzs.toLocaleString()} TZS to watch the full video
                      </p>
                      <Button
                        onClick={() => {
                          document.getElementById("payment-sidebar")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        Unlock Full Video
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getCreatorImage(content.creator.id)}
                  alt={content.title}
                  fill
                  className="object-cover blur-sm"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                    <p className="text-white/80">
                      Pay {content.priceTzs} TZS to unlock this exclusive content
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Interaction Bar */}
            <InteractionBar
              contentId={contentId}
              initialLikeCount={content.likeCount}
              initialCommentCount={content.commentCount ?? 0}
              showComments={showComments}
              onCommentToggle={() => setShowComments((v) => !v)}
              onTipClick={() => setShowTipPanel(true)}
              hasAccess={content.hasAccess}
            />

            {showComments && <CommentSection contentId={contentId} />}

            {/* Content Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {content.category}
                </span>
                <span className="text-sm text-muted-foreground">
                  {content.viewCount} views
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
              {content.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {content.description}
                </p>
              )}
            </div>

            {/* Creator Info */}
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={content.creator.avatarUrl || getCreatorImage(content.creator.id)}
                    alt={content.creator.displayName || content.creator.handle}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {content.creator.displayName || `@${content.creator.handle}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Creator{followerCount > 0 ? ` · ${followerCount} follower${followerCount !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                {session && content.creator.id && (
                  <Button
                    variant={isFollowing ? "secondary" : "outline"}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className="min-w-[100px]"
                  >
                    {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div id="payment-sidebar" className="lg:col-span-1">
            {content.priceTzs === 0 ? (
              <Card className="sticky top-4">
                <CardContent className="p-6 text-center">
                  <div className="inline-block px-4 py-1 rounded-full bg-green-500/15 text-green-500 text-sm font-semibold mb-3">
                    FREE
                  </div>
                  <h3 className="font-semibold mb-2">Free Content</h3>
                  <p className="text-sm text-muted-foreground">Watch this content for free</p>
                </CardContent>
              </Card>
            ) : !content.hasAccess ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <h2 className="text-xl font-bold">Unlock Content</h2>
                  <p className="text-sm text-muted-foreground">Pay once, watch unlimited times</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="text-3xl font-bold">
                      {content.priceTzs}
                      <span className="text-base font-normal text-muted-foreground ml-1">TZS</span>
                    </div>
                  </div>

                  {!session ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Sign in to unlock this content</p>
                      <Button className="w-full" onClick={() => router.push("/login")}>
                        Sign In
                      </Button>
                    </div>
                  ) : paymentSuccess ? (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                      <div className="text-3xl mb-2">✓</div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Payment successful!</p>
                      <p className="text-xs text-muted-foreground mt-1">Content unlocked from your wallet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentError && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                          {paymentError}
                          {paymentError.includes("Insufficient") && (
                            <a href="/wallet" className="block mt-2 underline font-medium">Top up wallet →</a>
                          )}
                        </div>
                      )}
                      {walletBalance !== null && (
                        <div className="p-3 rounded-lg bg-muted text-sm flex justify-between">
                          <span className="text-muted-foreground">Your wallet</span>
                          <span className={walletBalance >= content.priceTzs ? "text-green-500 font-medium" : "text-red-400 font-medium"}>
                            {walletBalance.toLocaleString()} TZS
                          </span>
                        </div>
                      )}
                      <Button className="w-full" disabled={paymentLoading} onClick={handlePayment}>
                        {paymentLoading ? "Processing..." : `Pay ${content.priceTzs.toLocaleString()} TZS from Wallet`}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Instant · No M-Pesa push ·{" "}
                        <a href="/wallet" className="underline">Top up wallet</a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-4">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <h3 className="font-semibold mb-2">You own this content</h3>
                  <p className="text-sm text-muted-foreground">Enjoy unlimited access</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

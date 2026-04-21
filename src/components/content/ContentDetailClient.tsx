"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

interface MoreFromCreatorItem {
  id: string;
  title: string;
  priceTzs: number;
  viewCount: number;
  contentType: string;
  category: string;
  thumbnailUrl: string | null;
}

interface Props {
  content: ContentDetail;
  contentId: string;
  initialStreamUrl: string | null;
  initialPreviewUrl: string | null;
  moreFromCreator?: MoreFromCreatorItem[];
}

const PREVIEW_SECONDS = 10;

export function ContentDetailClient({
  content: initialContent,
  contentId,
  initialStreamUrl,
  initialPreviewUrl,
  moreFromCreator = [],
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
            `Insufficient balance. You need ${data.required?.toLocaleString()} TZS but have ${data.balance?.toLocaleString()} TZS.`
          );
        } else {
          setPaymentError(data.error || "Payment failed");
        }
        return;
      }
      setPaymentSuccess(true);
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
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[11px] font-mono text-white/40 uppercase tracking-wider hover:text-white hover:bg-white/5 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all"
            >
              ← Back
            </button>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/20">
              <span className="w-1 h-1 rounded-full bg-amber-500/50 animate-pulse" />
              <span className="tracking-widest uppercase">Content.View</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Video Player */}
            {content.hasAccess && isUpload && streamUrl ? (
              <div className="relative aspect-video overflow-hidden bg-black border border-white/10">
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
                    className="absolute bottom-14 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-mono uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-colors border border-white/20 hover:border-amber-500"
                  >
                    ◈ Tip
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
              <div className="relative aspect-video overflow-hidden bg-black border border-white/10">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!showTipPanel && (
                  <button
                    onClick={() => setShowTipPanel(true)}
                    className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-mono uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-colors border border-white/20 hover:border-amber-500"
                  >
                    ◈ Tip
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
              <div className="aspect-video overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="relative w-10 h-10 mx-auto mb-3">
                    <div className="absolute inset-0 border border-amber-500/30 animate-spin" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-2 border border-amber-500/50 animate-spin" style={{ animationDuration: '1s', animationDirection: 'reverse' }} />
                  </div>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">Loading video...</p>
                </div>
              </div>
            ) : !content.hasAccess && isUpload && previewUrl ? (
              <div className="relative aspect-video overflow-hidden bg-black border border-white/10">
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
                  <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500/90 text-black text-[10px] font-mono font-semibold uppercase tracking-widest">
                    PREVIEW · {PREVIEW_SECONDS}s
                  </div>
                )}
                {previewEnded && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white max-w-sm px-4 border border-amber-500/20 p-8 relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />
                      <div className="text-3xl mb-3 text-amber-500 font-mono">⬡</div>
                      <h3 className="text-base font-bold font-mono uppercase tracking-wider mb-2">Preview Ended</h3>
                      <p className="text-white/50 text-xs font-mono mb-4 leading-relaxed">
                        Pay {content.priceTzs.toLocaleString()} TZS to watch the full video
                      </p>
                      <button
                        onClick={() => {
                          document.getElementById("payment-sidebar")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex h-9 items-center bg-amber-500 px-6 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                      >
                        Unlock Full Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-video overflow-hidden bg-neutral-900 border border-white/10">
                <Image
                  src={getCreatorImage(content.creator.id)}
                  alt={content.title}
                  fill
                  className="object-cover blur-sm opacity-30"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white border border-amber-500/20 p-8 relative bg-black/40 backdrop-blur-sm max-w-sm">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />
                    <div className="text-3xl mb-3 text-amber-500 font-mono">⬡</div>
                    <h3 className="text-base font-bold font-mono uppercase tracking-wider mb-2">Premium Content</h3>
                    <p className="text-white/40 text-xs font-mono">
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
            <div className="border border-white/10 bg-neutral-950 p-5 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-mono uppercase tracking-wider">
                  {content.category}
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  {content.viewCount} views
                </span>
              </div>
              <h1 className="text-2xl font-bold font-mono tracking-tight text-white mb-3">{content.title}</h1>
              {content.description && (
                <p className="text-sm font-mono text-white/40 whitespace-pre-wrap leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>

            {/* Creator Info */}
            <div className="border border-white/10 bg-neutral-950 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/30" />
              <div className="flex items-center gap-4">
                <Link href={`/creator/${content.creator.handle}`} className="relative w-14 h-14 overflow-hidden flex-shrink-0 border border-white/10 hover:border-amber-500/30 transition-colors">
                  <Image
                    src={content.creator.avatarUrl || getCreatorImage(content.creator.id)}
                    alt={content.creator.displayName || content.creator.handle}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </Link>
                <div className="flex-1">
                  <Link href={`/creator/${content.creator.handle}`} className="font-mono font-semibold text-sm text-white hover:text-amber-400 transition-colors tracking-wider">
                    {content.creator.displayName || `@${content.creator.handle}`}
                  </Link>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-0.5">
                    Creator{followerCount > 0 ? ` · ${followerCount} follower${followerCount !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                {session && content.creator.id && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`inline-flex h-8 items-center px-4 text-[10px] font-mono font-semibold uppercase tracking-wider transition-all border ${
                      isFollowing
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "border-white/20 text-white/60 hover:border-amber-500/40 hover:text-white"
                    }`}
                  >
                    {followLoading ? "..." : isFollowing ? "Following ✓" : "+ Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* More from this creator */}
            {moreFromCreator.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-4 bg-amber-500/40" />
                    <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-widest">
                      More from {content.creator.displayName || `@${content.creator.handle}`}
                    </h2>
                  </div>
                  <Link
                    href={`/creator/${content.creator.handle}`}
                    className="text-[10px] font-mono text-amber-500 hover:text-amber-400 uppercase tracking-wider transition-colors"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {moreFromCreator.map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="group block overflow-hidden border border-white/10 bg-neutral-950 hover:border-amber-500/30 transition-all amber-glow-hover"
                    >
                      <div className="relative aspect-video bg-neutral-900">
                        {item.thumbnailUrl ? (
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white/20">
                            <span className="text-2xl font-mono">▶</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          {item.priceTzs === 0 ? (
                            <span className="px-2 py-0.5 bg-green-500/80 text-black text-[10px] font-mono font-semibold uppercase">
                              FREE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono font-semibold border border-white/20">
                              {item.priceTzs.toLocaleString()} TZS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-mono font-medium text-xs text-white/70 line-clamp-2 group-hover:text-white transition-colors tracking-wide">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                          <span>{item.viewCount} views</span>
                          <span>·</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Sidebar */}
          <div id="payment-sidebar" className="lg:col-span-1">
            {content.priceTzs === 0 ? (
              <div className="sticky top-20 border border-green-500/20 bg-neutral-950 p-5 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/40" />
                <div className="text-center py-3">
                  <div className="inline-block px-4 py-1 border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-mono font-semibold uppercase tracking-widest mb-3">
                    FREE
                  </div>
                  <h3 className="font-mono font-semibold text-sm text-white tracking-wider mb-1">Free Content</h3>
                  <p className="text-[10px] font-mono text-white/30">Watch this content for free</p>
                </div>
              </div>
            ) : !content.hasAccess ? (
              <div className="sticky top-20 border border-white/10 bg-neutral-950 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-4 bg-amber-500/40" />
                    <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Unlock Content</span>
                  </div>
                  <h2 className="font-mono font-bold text-base text-white tracking-wide">Pay to Watch</h2>
                  <p className="text-[10px] font-mono text-white/30 mt-1">Pay once · watch unlimited times</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 relative">
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Price</div>
                    <div className="text-3xl font-bold font-mono text-amber-400">
                      {content.priceTzs.toLocaleString()}
                      <span className="text-sm font-normal text-white/40 ml-1">TZS</span>
                    </div>
                  </div>

                  {!session ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono text-white/30">Sign in to unlock this content</p>
                      <Button className="w-full" onClick={() => router.push("/login")}>
                        Sign In
                      </Button>
                    </div>
                  ) : paymentSuccess ? (
                    <div className="p-4 border border-green-500/20 bg-green-500/5 text-center relative">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/40" />
                      <p className="text-2xl mb-1 text-green-400 font-mono">✓</p>
                      <p className="text-xs font-mono text-green-400 font-semibold uppercase tracking-wider">Payment successful!</p>
                      <p className="text-[10px] font-mono text-white/30 mt-1">Content unlocked from your wallet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentError && (
                        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-mono leading-relaxed">
                          {paymentError}
                          {paymentError.includes("Insufficient") && (
                            <a href="/wallet" className="block mt-2 text-amber-400 hover:text-amber-300 uppercase tracking-wider">
                              Top up wallet →
                            </a>
                          )}
                        </div>
                      )}
                      {walletBalance !== null && (
                        <div className="p-3 border border-white/10 bg-white/3 text-[10px] font-mono flex justify-between">
                          <span className="text-white/30 uppercase tracking-wider">Your wallet</span>
                          <span className={walletBalance >= content.priceTzs ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                            {walletBalance.toLocaleString()} TZS
                          </span>
                        </div>
                      )}
                      <button
                        className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={paymentLoading}
                        onClick={handlePayment}
                      >
                        {paymentLoading ? "Processing..." : `Pay ${content.priceTzs.toLocaleString()} TZS`}
                      </button>
                      <p className="text-[9px] text-center font-mono text-white/20 uppercase tracking-wider">
                        Instant · No M-Pesa push ·{" "}
                        <a href="/wallet" className="text-amber-500/60 hover:text-amber-400">Top up wallet</a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="sticky top-20 border border-green-500/20 bg-neutral-950 p-5 text-center relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/40" />
                <div className="text-3xl mb-2 text-green-400 font-mono">✓</div>
                <h3 className="font-mono font-semibold text-sm text-white tracking-wider mb-1">You own this content</h3>
                <p className="text-[10px] font-mono text-white/30">Enjoy unlimited access</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

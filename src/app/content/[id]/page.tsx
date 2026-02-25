"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { placeholderCreators } from "@/data/placeholder-creators";

interface ContentDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceTzs: number;
  viewCount: number;
  likeCount: number;
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
  }>;
  hasAccess: boolean;
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [contentId, setContentId] = useState<string>("");
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewEnded, setPreviewEnded] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const PREVIEW_SECONDS = 10;

  useEffect(() => {
    params.then((p) => {
      setContentId(p.id);
      fetchContent(p.id);
    });
  }, [params]);

  const fetchFollowStatus = async (creatorId: string) => {
    try {
      const res = await fetch(`/api/follow?creatorId=${creatorId}`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch (error) {
      console.error("Failed to fetch follow status:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!session || !content) return;
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
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchContent = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
        fetchFollowStatus(data.creator.id);
        if (data.contentType === "upload") {
          if (data.hasAccess) {
            // Full access — fetch full stream URL
            fetchStreamUrl(id);
          } else if (data.priceTzs > 0) {
            // Paid content without access — fetch preview
            fetchPreviewUrl(id);
          }
        }
      } else {
        router.push("/feed");
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      router.push("/feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamUrl = async (id: string) => {
    try {
      const res = await fetch(`/api/content/${id}/stream`);
      if (res.ok) {
        const data = await res.json();
        setStreamUrl(data.streamUrl);
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.error === "subscription_required") {
          router.push("/subscribe");
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch stream URL:", error);
    }
  };

  const fetchPreviewUrl = async (id: string) => {
    try {
      const res = await fetch(`/api/content/${id}/stream?preview=true`);
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.streamUrl);
      }
    } catch (error) {
      console.error("Failed to fetch preview URL:", error);
    }
  };

  const handlePreviewTimeUpdate = useCallback(() => {
    const video = previewVideoRef.current;
    if (video && video.currentTime >= PREVIEW_SECONDS) {
      video.pause();
      setPreviewEnded(true);
    }
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    setPaymentError("");
    setPaymentLoading(true);

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(data.error || "Payment initiation failed");
        setPaymentLoading(false);
        return;
      }

      // Show success message with instructions
      setPaymentSuccess(true);
      
      // Poll for payment status
      pollPaymentStatus(data.paymentIntentId);
    } catch (error) {
      setPaymentError("An unexpected error occurred");
      setPaymentLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentIntentId: string) => {
    const maxAttempts = 60; // 60 attempts
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/payments/status/${paymentIntentId}`);
        const data = await response.json();

        if (data.status === "paid" && data.hasEntitlement) {
          clearInterval(interval);
          setPaymentLoading(false);
          // Refresh content to show unlocked state
          fetchContent(contentId);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setPaymentLoading(false);
          setPaymentError("Payment failed. Please try again.");
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentLoading(false);
          setPaymentError("Payment is taking longer than expected. Please check your library.");
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    }, 5000);
  };

  const getCreatorImage = (creatorId: string) => {
    const index = parseInt(creatorId.slice(-1), 16) % placeholderCreators.length;
    return placeholderCreators[index]?.image || placeholderCreators[0].image;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

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
            {/* Video Player or Locked State */}
            {content.hasAccess && isUpload && streamUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={streamUrl}
                  controls
                  className="w-full h-full"
                  poster={thumbnailMedia?.url || undefined}
                  controlsList="nodownload"
                />
              </div>
            ) : content.hasAccess && embedUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : content.hasAccess && isUpload && !streamUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            ) : !content.hasAccess && isUpload && previewUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={previewVideoRef}
                  src={previewUrl}
                  controls={!previewEnded}
                  className="w-full h-full"
                  poster={thumbnailMedia?.url || undefined}
                  controlsList="nodownload nofullscreen"
                  onTimeUpdate={handlePreviewTimeUpdate}
                  autoPlay
                  muted
                />
                {/* Preview badge */}
                {!previewEnded && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                    Preview \u00b7 {PREVIEW_SECONDS}s
                  </div>
                )}
                {/* Overlay when preview ends */}
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
                          const sidebar = document.getElementById("payment-sidebar");
                          sidebar?.scrollIntoView({ behavior: "smooth" });
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

            {/* Content Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {content.category}
                </span>
                <span className="text-sm text-muted-foreground">
                  {content.viewCount} views
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {content.likeCount} likes
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

          {/* Sidebar - Payment */}
          <div id="payment-sidebar" className="lg:col-span-1">
            {content.priceTzs === 0 ? (
              <Card className="sticky top-4">
                <CardContent className="p-6 text-center">
                  <div className="inline-block px-4 py-1 rounded-full bg-green-500/15 text-green-500 text-sm font-semibold mb-3">
                    FREE
                  </div>
                  <h3 className="font-semibold mb-2">Free Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch this content for free
                  </p>
                </CardContent>
              </Card>
            ) : !content.hasAccess ? (
              <Card className="sticky top-4">
                <CardHeader>
                  <h2 className="text-xl font-bold">Unlock Content</h2>
                  <p className="text-sm text-muted-foreground">
                    Pay once, watch unlimited times
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="text-3xl font-bold">
                      {content.priceTzs}
                      <span className="text-base font-normal text-muted-foreground ml-1">
                        TZS
                      </span>
                    </div>
                  </div>

                  {!session ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Sign in to unlock this content
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => router.push("/login")}
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : paymentSuccess ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ Payment initiated successfully!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check your phone for the payment prompt
                        </p>
                      </div>
                      {paymentLoading && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">
                            Waiting for payment confirmation...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handlePayment} className="space-y-4">
                      {paymentError && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                          {paymentError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Mobile Money Number
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          disabled={paymentLoading}
                          pattern="0[67]\d{8}"
                        />
                        <p className="text-xs text-muted-foreground">
                          M-Pesa, Tigo Pesa, or Airtel Money
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? "Processing..." : `Pay ${content.priceTzs} TZS`}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-4">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <h3 className="font-semibold mb-2">You own this content</h3>
                  <p className="text-sm text-muted-foreground">
                    Enjoy unlimited access
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

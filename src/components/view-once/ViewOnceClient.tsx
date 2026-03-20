"use client";

import { useState, useRef, useCallback } from "react";
import { GuestPaymentForm } from "./GuestPaymentForm";
import { ConversionBanner } from "./ConversionBanner";
import { useToast, Toaster } from "@/components/ui/toast";
import { collectDeviceSignals } from "@/lib/fingerprint";

interface ViewOnceClientProps {
  slug: string;
  content: {
    title: string;
    description: string | null;
    category: string;
    contentType: string;
  };
  creator: {
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  priceTzs: number;
  teaserSeconds: number;
  thumbnailUrl: string | null;
  teaserUrl: string | null;
  streamUrl: string | null;
  hasPaid: boolean;
  watched: boolean;
}

export function ViewOnceClient({
  slug,
  content,
  creator,
  priceTzs,
  teaserSeconds,
  thumbnailUrl,
  teaserUrl,
  streamUrl,
  hasPaid,
  watched: initialWatched,
}: ViewOnceClientProps) {
  const [phase, setPhase] = useState<"teaser" | "paying" | "watching" | "done">(
    hasPaid ? "watching" : "teaser"
  );
  const [currentStreamUrl, setCurrentStreamUrl] = useState(streamUrl);
  const [watched, setWatched] = useState(initialWatched);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const teaserTimerRef = useRef(false);
  const { toasts, toast, dismiss } = useToast();

  // Teaser time enforcement
  const handleTeaserTimeUpdate = useCallback(() => {
    if (!videoRef.current || teaserTimerRef.current) return;
    if (videoRef.current.currentTime >= teaserSeconds) {
      teaserTimerRef.current = true;
      videoRef.current.pause();
      setPhase("paying");
    }
  }, [teaserSeconds]);

  // Payment complete — fetch stream URL with retry
  const handlePaymentComplete = useCallback(async (purchaseId?: string) => {
    setStreamError(null);
    const fp = collectDeviceSignals(slug);

    // Build stream URL — include purchaseId as fallback in case cookie wasn't set
    const streamBase = `/api/view-once/${slug}/stream`;
    const streamUrl = purchaseId ? `${streamBase}?pid=${purchaseId}` : streamBase;

    // Retry up to 3 times with short delays
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        const res = await fetch(streamUrl, {
          headers: { "x-device-fingerprint": fp },
          credentials: "same-origin",
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentStreamUrl(data.url);
          setPhase("watching");
          toast("Video unlocked! Enjoy", "success");
          return;
        }
        const errData = await res.json().catch(() => ({}));
        console.error(`[stream] Attempt ${attempt + 1} failed:`, res.status, errData);
      } catch (err) {
        console.error(`[stream] Attempt ${attempt + 1} network error:`, err);
      }
    }

    // All retries failed
    setStreamError("Failed to load video. Please refresh the page.");
    toast("Failed to load video — try refreshing", "error");
  }, [slug, toast]);

  // Video ended
  const handleVideoEnded = useCallback(async () => {
    setWatched(true);
    setPhase("done");
    try {
      await fetch(`/api/view-once/${slug}/watched`, { method: "PATCH" });
    } catch {
      // non-critical
    }
  }, [slug]);

  const creatorName = creator.displayName || `@${creator.handle}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-amber-500 font-bold text-lg">PayPerPlay</a>
          <a
            href="/sign-up"
            className="text-xs bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-full"
          >
            Join Free
          </a>
        </div>
      </header>

      <main className="pt-16 pb-8 max-w-lg mx-auto px-4">
        {/* Video container */}
        <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video mt-4">
          {/* Teaser phase */}
          {phase === "teaser" && teaserUrl && (
            <>
              <video
                ref={videoRef}
                src={teaserUrl}
                className="w-full h-full object-cover"
                poster={thumbnailUrl || undefined}
                playsInline
                autoPlay
                muted
                onTimeUpdate={handleTeaserTimeUpdate}
              />
              {/* Teaser badge */}
              <div className="absolute top-3 left-3 bg-amber-500/90 text-black text-xs font-bold px-2 py-1 rounded-full">
                Preview — {teaserSeconds}s
              </div>
            </>
          )}

          {/* Teaser with no video (thumbnail only) */}
          {phase === "teaser" && !teaserUrl && thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Payment overlay */}
          {phase === "paying" && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-zinc-300 text-sm mb-1">Preview ended</p>
                <p className="text-white font-bold text-lg">
                  Pay {priceTzs.toLocaleString()} TZS to unlock
                </p>
              </div>
            </div>
          )}

          {/* Loading stream after payment */}
          {phase === "watching" && !currentStreamUrl && !streamError && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {/* Stream load error */}
          {streamError && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-white font-bold mb-2">Failed to load video</p>
                <p className="text-zinc-400 text-sm mb-4">{streamError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-amber-500 text-black font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

          {/* Full video */}
          {phase === "watching" && currentStreamUrl && (
            <video
              ref={videoRef}
              src={currentStreamUrl}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              controls
              onEnded={handleVideoEnded}
            />
          )}

          {/* Done state */}
          {phase === "done" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-4xl mb-3">🎬</div>
                <p className="text-white font-bold text-lg mb-2">Video ended</p>
                <p className="text-zinc-400 text-sm">
                  Join PayPerPlay to rewatch & discover more creators
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content info */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{content.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {creator.avatarUrl && (
              <img
                src={creator.avatarUrl}
                alt={creatorName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">{creatorName}</p>
              <p className="text-xs text-zinc-500">on PayPerPlay</p>
            </div>
          </div>
          {content.description && (
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        {/* Payment form (shown when teaser ends or on "paying" phase) */}
        {(phase === "teaser" || phase === "paying") && (
          <div className="mt-6">
            <GuestPaymentForm
              slug={slug}
              priceTzs={priceTzs}
              creatorName={creatorName}
              onPaymentComplete={handlePaymentComplete}
              onToast={toast}
            />
          </div>
        )}

        {/* Conversion banner (shown after watching) */}
        {(phase === "done" || (phase === "watching" && watched)) && (
          <div className="mt-6">
            <ConversionBanner creatorName={creatorName} />
          </div>
        )}

        {/* Social proof */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-xs">
            Secured by PayPerPlay — Tanzania&apos;s creator-first platform
          </p>
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, Loader2, CheckCircle, Play, AlertTriangle, Coins } from "lucide-react";
import { collectDeviceSignals } from "@/lib/fingerprint";

interface LinkMeta {
  slug: string;
  priceTzs: number;
  teaserSeconds: number;
  content: {
    id: string;
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
  thumbnailUrl: string | null;
  purchaseCount: number;
}

type Stage =
  | "loading"
  | "error"
  | "pay"
  | "pending"
  | "streaming";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100; // 5 minutes

export default function WatchPage() {
  const { slug } = useParams<{ slug: string }>();

  const [stage, setStage] = useState<Stage>("loading");
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  const [pollMsg, setPollMsg] = useState("Waiting for M-Pesa confirmation...");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamType, setStreamType] = useState<"upload" | "youtube" | null>(null);

  const purchaseIdRef = useRef<string | null>(null);
  const depositIdRef = useRef<string | null>(null);
  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load link metadata
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/view-once/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Link not found or expired");
        }
        return res.json();
      })
      .then((data: LinkMeta) => {
        setMeta(data);
        // Free content — redirect to normal content page
        if (data.priceTzs === 0) {
          window.location.href = `/content/${data.content.id}`;
          return;
        }
        // Try to restore an existing paid session
        tryRestoreSession(data.slug);
      })
      .catch((err) => {
        setErrorMsg(err.message || "This link is no longer available.");
        setStage("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const tryRestoreSession = async (linkSlug: string) => {
    try {
      const fp = collectDeviceSignals(linkSlug);
      const res = await fetch(`/api/view-once/${linkSlug}/stream`, {
        headers: { "x-device-fingerprint": fp },
      });
      if (res.ok) {
        const data = await res.json();
        setStreamUrl(data.url);
        setStreamType(data.type);
        setStage("streaming");
        return;
      }
    } catch { /* no prior session — show pay form */ }
    setStage("pay");
  };

  const handlePay = async () => {
    if (!meta) return;
    const sanitized = phone.trim();
    if (!sanitized) { setPayError("Please enter your phone number"); return; }

    setSubmitting(true);
    setPayError("");
    try {
      const fingerprint = collectDeviceSignals(meta.slug);
      const res = await fetch(`/api/view-once/${meta.slug}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: sanitized, deviceFingerprint: fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Payment failed. Please try again.");
        return;
      }
      purchaseIdRef.current = data.purchaseId;
      depositIdRef.current = data.depositId;
      pollCountRef.current = 0;
      setStage("pending");
      schedulePoll(meta.slug);
    } catch {
      setPayError("Failed to initiate payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const schedulePoll = useCallback((linkSlug: string) => {
    pollTimerRef.current = setTimeout(() => poll(linkSlug), POLL_INTERVAL_MS);
  }, []);

  const poll = useCallback(async (linkSlug: string) => {
    if (pollCountRef.current >= MAX_POLLS) {
      setPollMsg("Payment timed out. Please try again.");
      setStage("pay");
      return;
    }
    pollCountRef.current++;
    try {
      const res = await fetch(`/api/view-once/${linkSlug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: purchaseIdRef.current,
          depositId: depositIdRef.current,
        }),
      });
      const data = await res.json();

      if (data.status === "paid") {
        // Fetch the stream URL
        const fp = collectDeviceSignals(linkSlug);
        const streamRes = await fetch(`/api/view-once/${linkSlug}/stream`, {
          headers: { "x-device-fingerprint": fp },
        });
        if (streamRes.ok) {
          const streamData = await streamRes.json();
          setStreamUrl(streamData.url);
          setStreamType(streamData.type);
          setStage("streaming");
          // Mark as watched in the background
          fetch(`/api/view-once/${linkSlug}/watched`, { method: "PATCH" }).catch(() => {});
        } else {
          setPollMsg("Payment confirmed but video failed to load. Please refresh.");
        }
        return;
      }

      if (data.status === "failed") {
        setPayError(data.error || "Payment was not completed. Please try again.");
        setStage("pay");
        return;
      }

      setPollMsg(data.message || "Waiting for M-Pesa confirmation...");
      schedulePoll(linkSlug);
    } catch {
      schedulePoll(linkSlug); // keep polling on network errors
    }
  }, [schedulePoll]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const getYouTubeEmbedUrl = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  // ── Render ──────────────────────────────────────────────────────

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="max-w-sm w-full border border-red-500/20 bg-neutral-950 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/30" />
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest mb-2">Link Unavailable</p>
          <p className="text-sm font-mono text-white/60 mb-6">{errorMsg}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/25 hover:text-white transition-all">
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (stage === "streaming" && streamUrl) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-6 h-6 bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-mono font-black text-xs">▶</span>
            </div>
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-widest truncate">{meta?.content.title}</span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative aspect-video bg-black border border-white/10 overflow-hidden mb-4">
            {streamType === "youtube" ? (
              <iframe
                src={getYouTubeEmbedUrl(streamUrl) || streamUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={streamUrl}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
              />
            )}
          </div>
          {meta && (
            <div className="border border-white/10 bg-neutral-950 p-5 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
              <span className="px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] font-mono uppercase tracking-wider">
                {meta.content.category}
              </span>
              <h1 className="text-xl font-bold font-mono tracking-tight text-white mt-2">{meta.content.title}</h1>
              {meta.content.description && (
                <p className="text-sm font-mono text-white/40 mt-2 leading-relaxed">{meta.content.description}</p>
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">By</div>
                <Link href={`/creator/${meta.creator.handle}`} className="text-[11px] font-mono text-amber-400/70 hover:text-amber-400 transition-colors">
                  {meta.creator.displayName || `@${meta.creator.handle}`}
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (stage === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="max-w-sm w-full border border-amber-500/20 bg-neutral-950 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
          <div className="relative w-12 h-12 mx-auto mb-5">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
            <div className="absolute inset-[14px] bg-amber-500/20" />
          </div>
          <p className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-1">M-Pesa</p>
          <p className="text-sm font-mono font-semibold text-white mb-2">Check your phone</p>
          <p className="text-[11px] font-mono text-white/30 leading-relaxed">{pollMsg}</p>
          <p className="text-[10px] font-mono text-white/20 mt-3 uppercase tracking-widest">
            Enter your M-Pesa PIN when prompted
          </p>
        </div>
      </div>
    );
  }

  // Stage: "pay"
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />

      {/* Corner accents */}
      <div className="fixed top-6 left-6 w-6 h-6 border-t border-l border-amber-500/20 z-10" />
      <div className="fixed top-6 right-6 w-6 h-6 border-t border-r border-amber-500/20 z-10" />
      <div className="fixed bottom-6 left-6 w-6 h-6 border-b border-l border-amber-500/20 z-10" />
      <div className="fixed bottom-6 right-6 w-6 h-6 border-b border-r border-amber-500/20 z-10" />

      <div className="relative z-10 w-full max-w-md space-y-4">
        {/* Content Preview */}
        {meta && (
          <div className="border border-white/10 bg-neutral-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
            {meta.thumbnailUrl ? (
              <div className="relative aspect-video">
                <Image src={meta.thumbnailUrl} alt={meta.content.title} fill className="object-cover opacity-60" sizes="100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 border border-white/20 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-6 h-6 text-white/70 ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-neutral-900 flex items-center justify-center">
                <Play className="w-10 h-10 text-white/10" />
              </div>
            )}
            <div className="p-4">
              <span className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">{meta.content.category}</span>
              <h1 className="text-base font-bold font-mono tracking-tight text-white mt-1">{meta.content.title}</h1>
              <p className="text-[11px] font-mono text-white/30 mt-1">
                by {meta.creator.displayName || `@${meta.creator.handle}`}
              </p>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/30" />
          <div className="p-5">
            {/* Price */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
              <div>
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Access Price</p>
                <p className="text-2xl font-bold font-mono text-amber-400">
                  {meta?.priceTzs.toLocaleString()}
                  <span className="text-sm font-normal text-white/30 ml-1">TZS</span>
                </p>
              </div>
              <div className="w-10 h-10 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">Pay via M-Pesa</div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5 block">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678 or +255712345678"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPayError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePay(); }}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>

              {payError && (
                <p className="text-[10px] font-mono text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {payError}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={submitting || !phone.trim()}
                className="w-full py-3 bg-amber-500 text-black text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Pay {meta?.priceTzs.toLocaleString()} TZS</>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
              {[
                "An STK push will be sent to your phone",
                "Enter your M-Pesa PIN to confirm",
                "Video access is valid for 4 hours",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-mono text-white/25">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] font-mono text-white/15 uppercase tracking-widest">
          Powered by{" "}
          <Link href="/" className="text-amber-500/30 hover:text-amber-500/60 transition-colors">PayPerPlay</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Radio,
  Eye,
  Clock,
  User,
  ArrowLeft,
  MessageCircle,
  Send,
  Heart,
  Share2,
  CircleDot,
  Lock,
  Phone,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priceTzs: number;
  viewerCount: number;
  cfPlaybackUrl: string | null;
  cfWebRtcUrl: string | null;
  cfIframeUrl: string | null;
  startedAt: string | null;
}

interface CreatorData {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ChatMessage {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  message: string;
  isSystem: boolean;
  isCreator: boolean;
  createdAt: string;
}

export default function LiveStreamViewer({
  stream,
  creator,
  isAuthenticated,
  hasAccess: initialAccess,
}: {
  stream: StreamData;
  creator: CreatorData;
  isAuthenticated?: boolean;
  hasAccess?: boolean;
}) {
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [elapsed, setElapsed] = useState("");
  const [liked, setLiked] = useState(false);
  const [streamStatus, setStreamStatus] = useState(stream.status);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<string | null>(null);
  const [sendingChat, setSendingChat] = useState(false);

  // Payment gate state
  const [hasAccess, setHasAccess] = useState(initialAccess ?? stream.priceTzs === 0);
  const [showPayment, setShowPayment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle");
  const [accessId, setAccessId] = useState<string | null>(null);

  const isPaid = stream.priceTzs > 0;
  const isLive = streamStatus === "live";
  const isEnded = streamStatus === "ended";
  const needsPayment = isPaid && !hasAccess && isAuthenticated;

  // ── Elapsed timer ──
  useEffect(() => {
    if (!isLive || !stream.startedAt) return;
    const start = new Date(stream.startedAt).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        h > 0
          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m}:${s.toString().padStart(2, "0")}`
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [stream.startedAt, isLive]);

  // ── Chat polling ──
  const fetchMessages = useCallback(async () => {
    try {
      const url = lastMessageTime.current
        ? `/api/livestream/${stream.id}/chat?after=${encodeURIComponent(lastMessageTime.current)}`
        : `/api/livestream/${stream.id}/chat`;

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (data.streamStatus) {
        setStreamStatus(data.streamStatus);
      }

      if (data.messages?.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          lastMessageTime.current = newMsgs[newMsgs.length - 1].createdAt;
          return [...prev, ...newMsgs];
        });
      }
    } catch {
      // Silently fail
    }
  }, [stream.id]);

  useEffect(() => {
    fetchMessages(); // Initial load
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Cloudflare Stream iframe player ──
  // Uses Cloudflare's built-in player which handles WebRTC/HLS/codec negotiation automatically
  const iframeUrl = stream.cfIframeUrl
    ? `${stream.cfIframeUrl}?autoplay=true&muted=true&preload=true&loop=false&controls=true&poster=`
    : null;
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // ── Send chat message ──
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/livestream/${stream.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.message.id);
          if (exists) return prev;
          lastMessageTime.current = data.message.createdAt;
          return [...prev, data.message];
        });
        setChatMessage("");
      }
    } catch {
      // fail silently
    } finally {
      setSendingChat(false);
    }
  };

  // ── Payment handler ──
  const handlePurchase = async () => {
    if (!phoneNumber.trim() || paying) return;
    setPaying(true);
    setPaymentStatus("pending");

    try {
      const res = await fetch(`/api/livestream/${stream.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();

      if (data.hasAccess) {
        setHasAccess(true);
        setPaymentStatus("paid");
        setShowPayment(false);
        return;
      }

      if (data.accessId) {
        setAccessId(data.accessId);
        // Start polling for payment verification
        pollPayment(data.accessId);
      } else {
        setPaymentStatus("failed");
        setPaying(false);
      }
    } catch {
      setPaymentStatus("failed");
      setPaying(false);
    }
  };

  const pollPayment = async (aid: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes at 3s intervals

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus("failed");
        setPaying(false);
        return;
      }

      try {
        const res = await fetch(`/api/livestream/${stream.id}/access/verify?accessId=${aid}`);
        const data = await res.json();

        if (data.status === "paid" || data.hasAccess) {
          setHasAccess(true);
          setPaymentStatus("paid");
          setShowPayment(false);
          setPaying(false);
          return;
        }

        if (data.status === "failed" || data.status === "expired") {
          setPaymentStatus("failed");
          setPaying(false);
          return;
        }
      } catch {
        // keep polling
      }

      attempts++;
      setTimeout(poll, 3000);
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-white/10 backdrop-blur-xl bg-background/90 flex items-center px-4 gap-4">
        <Link href="/feed" className="p-2 -ml-2 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
              <CircleDot className="w-3 h-3 animate-pulse" />
              LIVE
            </span>
          )}
          <h1 className="font-semibold text-sm truncate">{stream.title}</h1>
        </div>
        {isPaid && hasAccess && (
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            ✓ Access
          </span>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-lg transition-colors ${
            showChat ? "bg-white/10 text-foreground" : "hover:bg-white/5 text-muted-foreground"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
        {/* Video area */}
        <div className="flex-1 flex flex-col">
          {/* Video player */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:flex-1 flex items-center justify-center">
            {/* Payment gate overlay */}
            {needsPayment && !hasAccess && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center">
                <div className="text-center p-6 max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Paid Livestream</h2>
                  <p className="text-sm text-muted-foreground mb-1">
                    {creator.displayName || creator.handle} is streaming live
                  </p>
                  <p className="text-2xl font-bold text-amber-400 mb-6">
                    {stream.priceTzs.toLocaleString()} TZS
                  </p>

                  {!showPayment ? (
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold hover:from-amber-400 hover:to-orange-400 border-0"
                    >
                      Pay to Watch
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0744 123 456"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          disabled={paying}
                        />
                      </div>

                      {paymentStatus === "pending" && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 rounded-xl p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Check your phone for M-Pesa prompt...
                        </div>
                      )}

                      {paymentStatus === "paid" && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 rounded-xl p-3">
                          <CheckCircle2 className="w-4 h-4" />
                          Payment confirmed! Unlocking stream...
                        </div>
                      )}

                      {paymentStatus === "failed" && (
                        <div className="text-red-400 text-sm bg-red-500/10 rounded-xl p-3">
                          Payment failed. Please try again.
                        </div>
                      )}

                      <Button
                        onClick={handlePurchase}
                        disabled={paying || !phoneNumber.trim()}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold hover:from-amber-400 hover:to-orange-400 border-0"
                      >
                        {paying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay ${stream.priceTzs.toLocaleString()} TZS via M-Pesa`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Not authenticated gate */}
            {isPaid && !isAuthenticated && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center">
                <div className="text-center p-6 max-w-sm">
                  <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Paid Livestream</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to purchase access for {stream.priceTzs.toLocaleString()} TZS
                  </p>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold border-0">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {iframeUrl && (isLive || streamStatus === "idle") && hasAccess ? (
              <div className="relative w-full h-full">
                {/* Cloudflare Stream iframe player — handles WebRTC/HLS/codecs automatically */}
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                />
                {/* Loading overlay until iframe loads */}
                {isLive && !iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-red-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-white font-medium">Connecting to live stream...</p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>
            ) : isEnded ? (
              <div className="text-center p-8">
                <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Stream Ended</h2>
                <p className="text-sm text-muted-foreground">
                  This livestream has ended. Check back for future streams.
                </p>
              </div>
            ) : !needsPayment ? (
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h2 className="text-lg font-bold mb-2">Waiting for stream to start...</h2>
                <p className="text-sm text-muted-foreground">
                  {creator.displayName || creator.handle} will be live soon
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400" />
                  <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400 [animation-delay:150ms]" />
                  <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400 [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}

            {/* Live overlay info */}
            {isLive && hasAccess && (
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                  <Eye className="w-3 h-3" />
                  {viewerCount} watching
                </span>
                {elapsed && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                    <Clock className="w-3 h-3" />
                    {elapsed}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stream info below video */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Link
                href={`/creator/${creator.handle}`}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 flex items-center justify-center overflow-hidden flex-shrink-0"
              >
                {creator.avatarUrl ? (
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.displayName || creator.handle}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-amber-400" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/creator/${creator.handle}`}
                  className="font-semibold text-sm hover:text-amber-400 transition-colors"
                >
                  {creator.displayName || creator.handle}
                </Link>
                <p className="text-xs text-muted-foreground capitalize">
                  {stream.category} &middot;{" "}
                  {stream.priceTzs > 0
                    ? `${stream.priceTzs.toLocaleString()} TZS`
                    : "Free Stream"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`p-2 rounded-lg transition-colors ${
                    liked ? "bg-red-500/10 text-red-400" : "hover:bg-white/5 text-muted-foreground hover:text-red-400"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                  className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {stream.description && (
              <p className="text-sm text-muted-foreground mt-3">{stream.description}</p>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col h-[300px] lg:h-full">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Live Chat</h3>
              <span className="text-xs text-muted-foreground">
                {viewerCount} watching
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {isLive ? "Be the first to say something!" : "Chat will appear here when the stream starts"}
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm ${msg.isSystem ? "text-muted-foreground italic text-xs" : ""}`}
                >
                  {!msg.isSystem && (
                    <span
                      className={`font-semibold mr-1.5 ${
                        msg.isCreator ? "text-amber-400" : "text-blue-400"
                      }`}
                    >
                      {msg.displayName}
                      {msg.isCreator && (
                        <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded uppercase font-bold">
                          Creator
                        </span>
                      )}
                    </span>
                  )}
                  <span className={msg.isSystem ? "" : "text-foreground"}>
                    {msg.message}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {isLive && isAuthenticated ? (
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Say something..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    disabled={sendingChat}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendingChat}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : isLive && !isAuthenticated ? (
              <div className="p-3 border-t border-white/10">
                <Link
                  href="/login"
                  className="block text-center text-sm text-amber-400 hover:text-amber-300 bg-amber-500/5 rounded-lg py-2.5"
                >
                  Sign in to chat
                </Link>
              </div>
            ) : (
              <div className="p-4 border-t border-white/10 text-center text-xs text-muted-foreground">
                {isEnded ? "Chat is closed" : "Chat will open when the stream starts"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

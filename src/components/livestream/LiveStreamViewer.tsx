"use client";

import { useState, useEffect, useRef } from "react";
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
  user: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export default function LiveStreamViewer({
  stream,
  creator,
}: {
  stream: StreamData;
  creator: CreatorData;
}) {
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      user: "PayPerPlay",
      text: `Welcome to ${creator.displayName || creator.handle}'s stream!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystem: true,
    },
  ]);
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [elapsed, setElapsed] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update elapsed time
  useEffect(() => {
    if (stream.status !== "live" || !stream.startedAt) return;
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
  }, [stream.startedAt, stream.status]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Init HLS playback
  useEffect(() => {
    if (!stream.cfPlaybackUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Try native HLS (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream.cfPlaybackUrl;
      video.play().catch(() => {});
      return;
    }

    // Use hls.js for other browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsInstance: any = null;
    import("hls.js").then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          lowLatencyMode: true,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
        });
        hlsInstance.loadSource(stream.cfPlaybackUrl!);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      }
    }).catch(() => {
      // hls.js not available, try direct
      video.src = stream.cfPlaybackUrl!;
      video.play().catch(() => {});
    });

    return () => {
      if (hlsInstance?.destroy) hlsInstance.destroy();
    };
  }, [stream.cfPlaybackUrl]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: "You",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setChatMessage("");
  };

  const isLive = stream.status === "live";
  const isEnded = stream.status === "ended";

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
            {stream.cfPlaybackUrl && isLive ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                muted
                controls
              />
            ) : isEnded ? (
              <div className="text-center p-8">
                <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Stream Ended</h2>
                <p className="text-sm text-muted-foreground">
                  This livestream has ended. Check back for future streams.
                </p>
              </div>
            ) : (
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
                  <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400 delay-150" />
                  <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400 delay-300" />
                </div>
              </div>
            )}

            {/* Live overlay info */}
            {isLive && (
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
                <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-red-400 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
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
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm ${msg.isSystem ? "text-muted-foreground italic" : ""}`}
                >
                  {!msg.isSystem && (
                    <span className="font-semibold text-amber-400 mr-1.5">
                      {msg.user}
                    </span>
                  )}
                  <span className={msg.isSystem ? "" : "text-foreground"}>
                    {msg.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 ml-2">
                    {msg.time}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {isLive && (
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Say something..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!isLive && (
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

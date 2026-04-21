"use client";

import { useState, useEffect, useCallback } from "react";
import BrowserGoLive from "@/components/livestream/BrowserGoLive";
import {
  Radio,
  Copy,
  Check,
  Trash2,
  Eye,
  Clock,
  Video,
  Plus,
  CircleDot,
  StopCircle,
  ExternalLink,
  Settings,
  Wifi,
  WifiOff,
  Camera,
  Monitor,
  Calendar,
  Share2,
} from "lucide-react";

interface Livestream {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: "idle" | "live" | "ended";
  priceTzs: number;
  rtmpUrl: string | null;
  rtmpKey: string | null;
  srtUrl: string | null;
  webRtcPublishUrl: string | null;
  cfPlaybackUrl: string | null;
  cfWebRtcUrl: string | null;
  viewerCount: number;
  peakViewerCount: number;
  totalViews: number;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

const CATEGORIES = ["entertainment", "music", "gaming", "education", "comedy", "sports", "news", "tech", "lifestyle", "other"];

type StreamMode = "obs" | "browser";

export default function CreatorLivePage() {
  const [streams, setStreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Livestream | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showKeyFor, setShowKeyFor] = useState<string | null>(null);
  const [streamMode, setStreamMode] = useState<StreamMode>("browser");
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("entertainment");
  const [priceTzs, setPriceTzs] = useState("0");
  const [scheduledAt, setScheduledAt] = useState("");

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/livestream");
      const data = await res.json();
      setStreams(data.streams || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  useEffect(() => {
    const hasActive = streams.some((s) => s.status === "idle" || s.status === "live");
    if (!hasActive) return;
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, [streams, fetchStreams]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/creator/livestream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, priceTzs, scheduledAt: scheduledAt || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setStreams((prev) => [data.stream, ...prev]);
        setSelectedStream(data.stream);
        setShowCreate(false);
        setTitle(""); setDescription(""); setCategory("entertainment"); setPriceTzs("0"); setScheduledAt("");
      } else {
        alert(data.error || "Failed to create livestream");
      }
    } catch { alert("Failed to create livestream"); } finally { setCreating(false); }
  };

  const handleAction = async (streamId: string, action: "go-live" | "end") => {
    try {
      const res = await fetch(`/api/creator/livestream/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchStreams();
        if (selectedStream?.id === streamId) {
          const updated = await res.json();
          setSelectedStream((prev) => prev ? { ...prev, status: updated.status } : null);
        }
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (streamId: string) => {
    if (!confirm("Delete this livestream? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/creator/livestream/${streamId}`, { method: "DELETE" });
      if (res.ok) {
        setStreams((prev) => prev.filter((s) => s.id !== streamId));
        if (selectedStream?.id === streamId) setSelectedStream(null);
      }
    } catch { /* silent */ }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareStream = (streamId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/live/${streamId}`);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const activeStreams = streams.filter((s) => s.status !== "ended");
  const pastStreams = streams.filter((s) => s.status === "ended");

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px w-4 bg-red-500/40" />
                <span className="text-[9px] font-mono text-red-500/50 tracking-widest uppercase">Creator.Studio</span>
              </div>
              <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" />
                Live Studio
              </h1>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Stream
            </button>
          </div>
        </div>
      </header>

      {/* Create Stream Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-white/15 w-full max-w-lg relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/40" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/40" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Video className="w-4 h-4 text-red-400" />
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">CREATE.LIVESTREAM</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your stream about?"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers what to expect..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-red-500/50 transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-neutral-950">
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Price (TZS)</label>
                    <input
                      type="number"
                      value={priceTzs}
                      onChange={(e) => setPriceTzs(e.target.value)}
                      min="0"
                      placeholder="0 = Free"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <p className="text-[10px] font-mono text-white/20 mt-1">Leave empty to go live immediately after setup</p>
                </div>

                {parseInt(priceTzs) === 0 && (
                  <p className="text-[10px] font-mono text-green-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Free stream — anyone can watch
                  </p>
                )}
                {parseInt(priceTzs) > 0 && (
                  <p className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    Paid stream — viewers pay {parseInt(priceTzs).toLocaleString()} TZS via M-Pesa
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-widest hover:border-white/25 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !title.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Stream"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6 pb-24 lg:pb-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          {/* Main content */}
          <div className="space-y-5">
            {selectedStream && selectedStream.status !== "ended" && streamMode === "browser" && (
              <div className="border border-white/10 bg-neutral-950 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/20" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-red-400" />
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                        Browser Stream — {selectedStream.title}
                      </div>
                    </div>
                    <StreamModeToggle mode={streamMode} onModeChange={setStreamMode} />
                  </div>
                  <BrowserGoLive
                    streamId={selectedStream.id}
                    webRtcPublishUrl={selectedStream.webRtcPublishUrl}
                    status={selectedStream.status}
                    onGoLive={() => handleAction(selectedStream.id, "go-live")}
                    onEndStream={() => handleAction(selectedStream.id, "end")}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border border-red-500/30 animate-spin" />
                  <div className="absolute inset-2 border border-red-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                </div>
              </div>
            ) : activeStreams.length === 0 && pastStreams.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10">
                <div className="w-14 h-14 mx-auto mb-4 border border-red-500/20 bg-red-500/5 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-red-400/60" />
                </div>
                <p className="text-[12px] font-mono text-white/40 mb-1">NO.LIVESTREAMS.YET</p>
                <p className="text-[10px] font-mono text-white/20 mb-6">Create your first stream and start broadcasting</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Stream
                </button>
              </div>
            ) : (
              <>
                {activeStreams.length > 0 && (
                  <div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">ACTIVE.STREAMS</div>
                    <div className="space-y-2">
                      {activeStreams.map((stream) => (
                        <StreamCard
                          key={stream.id}
                          stream={stream}
                          selected={selectedStream?.id === stream.id}
                          onClick={() => setSelectedStream(stream)}
                          onAction={handleAction}
                          onDelete={handleDelete}
                          onShare={shareStream}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {pastStreams.length > 0 && (
                  <div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">PAST.STREAMS</div>
                    <div className="space-y-2">
                      {pastStreams.map((stream) => (
                        <StreamCard
                          key={stream.id}
                          stream={stream}
                          selected={selectedStream?.id === stream.id}
                          onClick={() => setSelectedStream(stream)}
                          onAction={handleAction}
                          onDelete={handleDelete}
                          onShare={shareStream}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stream Details Panel */}
          {selectedStream && (
            <div className="border border-white/10 bg-neutral-950 relative lg:sticky lg:top-20 h-fit">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/20" />
              {/* Status header */}
              <div className={`px-5 py-4 border-b border-white/10 ${
                selectedStream.status === "live" ? "bg-red-500/8" : selectedStream.status === "idle" ? "bg-amber-500/8" : "bg-white/3"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedStream.status === "live" ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-red-400 uppercase">
                        <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                        LIVE
                      </span>
                    ) : selectedStream.status === "idle" ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase">
                        <Clock className="w-3.5 h-3.5" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-white/30 uppercase">
                        <StopCircle className="w-3.5 h-3.5" />
                        Ended
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedStream.status === "live" && (
                      <span className="text-[10px] font-mono text-white/30 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {selectedStream.viewerCount} viewers
                      </span>
                    )}
                    <button
                      onClick={() => shareStream(selectedStream.id)}
                      className="w-7 h-7 border border-white/10 flex items-center justify-center hover:border-white/25 transition-all"
                      title="Copy viewer link"
                    >
                      {copiedShareLink ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="text-[13px] font-mono font-bold text-white mt-2 truncate">{selectedStream.title}</h3>
                <p className="text-[10px] font-mono text-white/30 mt-0.5 capitalize">
                  {selectedStream.category} ·{" "}
                  {selectedStream.priceTzs > 0 ? `${selectedStream.priceTzs.toLocaleString()} TZS` : "Free"}
                </p>
              </div>

              {/* OBS Setup */}
              {selectedStream.status !== "ended" && streamMode === "obs" && (
                <div className="p-5 space-y-4">
                  <StreamModeToggle mode={streamMode} onModeChange={setStreamMode} />
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Settings className="w-3 h-3 text-white/30" />
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Stream Setup</div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase tracking-widest">Server URL</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono bg-black/30 px-2.5 py-2 border border-white/5 truncate text-white/50">
                            {selectedStream.rtmpUrl || "rtmps://live.cloudflare.com:443/live/"}
                          </code>
                          <button
                            onClick={() => copyToClipboard(selectedStream.rtmpUrl || "rtmps://live.cloudflare.com:443/live/", `rtmp-${selectedStream.id}`)}
                            className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 transition-all flex-shrink-0"
                          >
                            {copiedField === `rtmp-${selectedStream.id}` ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-white/40" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/30 mb-1 block uppercase tracking-widest">Stream Key</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono bg-black/30 px-2.5 py-2 border border-white/5 truncate text-white/50">
                            {showKeyFor === selectedStream.id ? selectedStream.rtmpKey || "Not configured" : "••••••••••••••••••••"}
                          </code>
                          <button
                            onClick={() => setShowKeyFor((prev) => prev === selectedStream.id ? null : selectedStream.id)}
                            className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 transition-all flex-shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-white/40" />
                          </button>
                          {selectedStream.rtmpKey && (
                            <button
                              onClick={() => copyToClipboard(selectedStream.rtmpKey!, `key-${selectedStream.id}`)}
                              className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 transition-all flex-shrink-0"
                            >
                              {copiedField === `key-${selectedStream.id}` ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-white/40" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedStream.status === "idle" && (
                      <button
                        onClick={() => handleAction(selectedStream.id, "go-live")}
                        className="w-full py-2.5 bg-red-500 text-white text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-red-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <Wifi className="w-4 h-4" />
                        Go Live
                      </button>
                    )}
                    {selectedStream.status === "live" && (
                      <button
                        onClick={() => handleAction(selectedStream.id, "end")}
                        className="w-full py-2.5 bg-red-900/40 border border-red-500/30 text-red-400 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2"
                      >
                        <WifiOff className="w-4 h-4" />
                        End Stream
                      </button>
                    )}
                    {selectedStream.cfPlaybackUrl && (
                      <a
                        href={`/live/${selectedStream.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 border border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-widest hover:border-white/25 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview Stream
                      </a>
                    )}
                  </div>

                  <div className="border border-white/5 bg-white/[0.02] p-4">
                    <div className="text-[10px] font-mono text-white/40 font-semibold mb-2">How to go live with OBS:</div>
                    <ol className="text-[10px] font-mono text-white/25 space-y-1.5 list-decimal list-inside">
                      <li>Open <span className="text-white/50">OBS Studio</span> or <span className="text-white/50">Streamlabs</span></li>
                      <li>Go to Settings → Stream</li>
                      <li>Set Service to <span className="text-white/50">Custom</span></li>
                      <li>Paste the <span className="text-white/50">Server URL</span> and <span className="text-white/50">Stream Key</span> above</li>
                      <li>Click &quot;Start Streaming&quot; in OBS</li>
                      <li>Come back here and click <span className="text-white/50">&quot;Go Live&quot;</span></li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Browser mode sidebar */}
              {selectedStream.status !== "ended" && streamMode === "browser" && (
                <div className="p-5 space-y-4">
                  <StreamModeToggle mode={streamMode} onModeChange={setStreamMode} />
                  <div className="border border-white/5 bg-white/[0.02] p-4">
                    <div className="text-[10px] font-mono text-white/40 font-semibold mb-1.5">Browser Streaming</div>
                    <p className="text-[10px] font-mono text-white/25">
                      Stream directly from your browser — no extra software needed. Choose camera for face-to-face streams, or screen share for tutorials.
                    </p>
                  </div>
                  {selectedStream.status === "live" && (
                    <button
                      onClick={() => handleAction(selectedStream.id, "end")}
                      className="w-full py-2.5 bg-red-900/40 border border-red-500/30 text-red-400 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2"
                    >
                      <StopCircle className="w-4 h-4" />
                      End Stream
                    </button>
                  )}
                  {selectedStream.cfPlaybackUrl && (
                    <a
                      href={`/live/${selectedStream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 border border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-widest hover:border-white/25 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Viewer Link
                    </a>
                  )}
                </div>
              )}

              {/* Ended stream stats */}
              {selectedStream.status === "ended" && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total Views", value: selectedStream.totalViews || 0 },
                      { label: "Peak Viewers", value: selectedStream.peakViewerCount || 0 },
                      {
                        label: "Duration",
                        value: selectedStream.startedAt && selectedStream.endedAt
                          ? formatDuration(new Date(selectedStream.endedAt).getTime() - new Date(selectedStream.startedAt).getTime())
                          : "—",
                      },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-3 border border-white/5 bg-white/[0.02]">
                        <p className="text-[15px] font-bold font-mono text-white">{s.value}</p>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDelete(selectedStream.id)}
                    className="w-full py-2.5 border border-red-500/20 text-red-400/70 text-[10px] font-mono uppercase tracking-widest hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Stream
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StreamCard({
  stream, selected, onClick, onAction, onDelete, onShare,
}: {
  stream: Livestream;
  selected: boolean;
  onClick: () => void;
  onAction: (id: string, action: "go-live" | "end") => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border cursor-pointer transition-all hover:border-white/20 relative ${
        selected ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-neutral-950"
      }`}
    >
      {selected && <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/40" />}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {stream.status === "live" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-400 animate-pulse" />
                Live
              </span>
            ) : stream.status === "idle" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                <Clock className="w-2.5 h-2.5" />
                Ready
              </span>
            ) : (
              <span className="inline-flex items-center text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-white/10 text-white/30">
                Ended
              </span>
            )}
            <span className="text-[10px] font-mono text-white/30 capitalize">{stream.category}</span>
            {stream.priceTzs > 0 && (
              <span className="text-[9px] font-mono text-amber-400 border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5">
                {stream.priceTzs.toLocaleString()} TZS
              </span>
            )}
          </div>
          <h3 className="text-[12px] font-mono font-semibold text-white/80 truncate">{stream.title}</h3>
          <p className="text-[10px] font-mono text-white/25 mt-0.5">
            {stream.scheduledAt && stream.status === "idle" ? (
              <>Scheduled: {new Date(stream.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</>
            ) : (
              formatTime(stream.createdAt)
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 ml-3">
          {stream.status === "live" && (
            <>
              <span className="text-[10px] font-mono text-white/30 flex items-center gap-1 mr-1">
                <Eye className="w-3 h-3" />
                {stream.viewerCount}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onAction(stream.id, "end"); }}
                className="px-2.5 py-1 border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-mono hover:bg-red-500/20 transition-colors flex items-center gap-1"
              >
                <StopCircle className="w-3 h-3" />
                End
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onShare(stream.id); }}
            className="w-7 h-7 border border-white/10 flex items-center justify-center hover:border-white/25 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-white/40" />
          </button>
          {stream.status === "ended" && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(stream.id); }}
              className="w-7 h-7 border border-white/10 flex items-center justify-center hover:border-red-500/30 hover:text-red-400 transition-all text-white/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamModeToggle({ mode, onModeChange }: { mode: StreamMode; onModeChange: (mode: StreamMode) => void }) {
  return (
    <div className="flex items-center gap-0 border border-white/10">
      {(["browser", "obs"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onModeChange(m)}
          className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
            mode === m ? "bg-red-500/20 text-red-400 border-r border-white/10 last:border-r-0" : "text-white/30 hover:text-white last:border-r-0"
          }`}
        >
          {m === "browser" ? <Camera className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
          {m === "browser" ? "Browser" : "OBS"}
        </button>
      ))}
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}h ${rm}m`;
}

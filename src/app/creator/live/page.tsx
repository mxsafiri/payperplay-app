"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

const CATEGORIES = [
  "entertainment",
  "music",
  "gaming",
  "education",
  "comedy",
  "sports",
  "news",
  "tech",
  "lifestyle",
  "other",
];

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

  // Create form state
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
    } catch (err) {
      console.error("Failed to fetch streams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // Poll for status updates on active streams
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
        body: JSON.stringify({
          title,
          description,
          category,
          priceTzs,
          scheduledAt: scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStreams((prev) => [data.stream, ...prev]);
        setSelectedStream(data.stream);
        setShowCreate(false);
        setTitle("");
        setDescription("");
        setCategory("entertainment");
        setPriceTzs("0");
        setScheduledAt("");
      } else {
        alert(data.error || "Failed to create livestream");
      }
    } catch (err) {
      console.error("Create failed:", err);
      alert("Failed to create livestream");
    } finally {
      setCreating(false);
    }
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
          setSelectedStream((prev) =>
            prev ? { ...prev, status: updated.status } : null
          );
        }
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const handleDelete = async (streamId: string) => {
    if (!confirm("Delete this livestream? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/creator/livestream/${streamId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStreams((prev) => prev.filter((s) => s.id !== streamId));
        if (selectedStream?.id === streamId) setSelectedStream(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareStream = (streamId: string) => {
    const url = `${window.location.origin}/live/${streamId}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const activeStreams = streams.filter((s) => s.status !== "ended");
  const pastStreams = streams.filter((s) => s.status === "ended");

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400" />
            </div>
            Live Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Go live and stream to your audience in real-time
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0"
        >
          <Plus className="w-4 h-4" />
          New Stream
        </Button>
      </div>

      {/* Create Stream Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Video className="w-5 h-5 text-red-400" />
              Create Livestream
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your stream about?"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what to expect..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-background">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (TZS)</label>
                  <input
                    type="number"
                    value={priceTzs}
                    onChange={(e) => setPriceTzs(e.target.value)}
                    min="0"
                    placeholder="0 = Free"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Leave empty to go live immediately after setup
                </p>
              </div>

              {parseInt(priceTzs) === 0 && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Free stream — anyone can watch
                </p>
              )}
              {parseInt(priceTzs) > 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  💰 Paid stream — viewers pay {parseInt(priceTzs).toLocaleString()} TZS via M-Pesa
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0"
              >
                {creating ? "Creating..." : "Create Stream"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Main content area */}
        <div className="space-y-6">
          {/* Browser Go Live for selected stream */}
          {selectedStream && selectedStream.status !== "ended" && streamMode === "browser" && (
            <div className="border border-white/10 rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-red-400" />
                  Browser Stream — {selectedStream.title}
                </h3>
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
          )}

          {/* Stream List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full" />
            </div>
          ) : activeStreams.length === 0 && pastStreams.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <Radio className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No livestreams yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first livestream and start broadcasting to your audience
              </p>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0"
              >
                <Plus className="w-4 h-4" />
                Create First Stream
              </Button>
            </div>
          ) : (
            <>
              {activeStreams.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Active Streams
                  </h2>
                  <div className="space-y-3">
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
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Past Streams
                  </h2>
                  <div className="space-y-3">
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

        {/* Stream Details / Setup Panel */}
        {selectedStream && (
          <div className="border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-sm overflow-hidden lg:sticky lg:top-4 h-fit">
            {/* Status header */}
            <div
              className={`px-5 py-4 border-b border-white/10 ${
                selectedStream.status === "live"
                  ? "bg-red-500/10"
                  : selectedStream.status === "idle"
                  ? "bg-amber-500/10"
                  : "bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedStream.status === "live" ? (
                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-semibold">
                      <CircleDot className="w-4 h-4 animate-pulse" />
                      LIVE
                    </span>
                  ) : selectedStream.status === "idle" ? (
                    <span className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
                      <Clock className="w-4 h-4" />
                      Ready to Stream
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-semibold">
                      <StopCircle className="w-4 h-4" />
                      Ended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedStream.status === "live" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {selectedStream.viewerCount} viewers
                    </span>
                  )}
                  <button
                    onClick={() => shareStream(selectedStream.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy viewer link"
                  >
                    {copiedShareLink ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold mt-2 truncate">{selectedStream.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {selectedStream.category} &middot;{" "}
                {selectedStream.priceTzs > 0
                  ? `${selectedStream.priceTzs.toLocaleString()} TZS`
                  : "Free"}
                {selectedStream.scheduledAt && (
                  <>
                    {" "}&middot;{" "}
                    <Calendar className="w-3 h-3 inline" />{" "}
                    {new Date(selectedStream.scheduledAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </>
                )}
              </p>
            </div>

            {/* OBS Setup Info */}
            {selectedStream.status !== "ended" && streamMode === "obs" && (
              <div className="p-5 space-y-4">
                <StreamModeToggle mode={streamMode} onModeChange={setStreamMode} />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />
                    Stream Setup
                  </h4>
                  <div className="space-y-3">
                    {/* RTMP URL */}
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Server URL</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-lg border border-white/5 truncate font-mono">
                          {selectedStream.rtmpUrl || "rtmps://live.cloudflare.com:443/live/"}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedStream.rtmpUrl || "rtmps://live.cloudflare.com:443/live/",
                              `rtmp-${selectedStream.id}`
                            )
                          }
                          className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedField === `rtmp-${selectedStream.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Stream Key */}
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Stream Key</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-lg border border-white/5 truncate font-mono">
                          {showKeyFor === selectedStream.id
                            ? selectedStream.rtmpKey || "Not configured"
                            : "••••••••••••••••••••"}
                        </code>
                        <button
                          onClick={() =>
                            setShowKeyFor((prev) =>
                              prev === selectedStream.id ? null : selectedStream.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {selectedStream.rtmpKey && (
                          <button
                            onClick={() =>
                              copyToClipboard(
                                selectedStream.rtmpKey!,
                                `key-${selectedStream.id}`
                              )
                            }
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedField === `key-${selectedStream.id}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 space-y-2">
                  {selectedStream.status === "idle" && (
                    <Button
                      onClick={() => handleAction(selectedStream.id, "go-live")}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0"
                    >
                      <Wifi className="w-4 h-4" />
                      Go Live
                    </Button>
                  )}
                  {selectedStream.status === "live" && (
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(selectedStream.id, "end")}
                      className="w-full"
                    >
                      <WifiOff className="w-4 h-4" />
                      End Stream
                    </Button>
                  )}
                  {selectedStream.cfPlaybackUrl && (
                    <a
                      href={`/live/${selectedStream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--ds-radius-md)] text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview Stream
                    </a>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold mb-2">How to go live with OBS:</h4>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Open <strong>OBS Studio</strong> or <strong>Streamlabs</strong></li>
                    <li>Go to Settings → Stream</li>
                    <li>Set Service to <strong>Custom</strong></li>
                    <li>Paste the <strong>Server URL</strong> and <strong>Stream Key</strong> above</li>
                    <li>Click &quot;Start Streaming&quot; in OBS</li>
                    <li>Come back here and click <strong>&quot;Go Live&quot;</strong></li>
                  </ol>
                </div>
              </div>
            )}

            {/* Browser mode sidebar info */}
            {selectedStream.status !== "ended" && streamMode === "browser" && (
              <div className="p-5 space-y-4">
                <StreamModeToggle mode={streamMode} onModeChange={setStreamMode} />

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold mb-2">Browser Streaming</h4>
                  <p className="text-xs text-muted-foreground">
                    Stream directly from your browser — no extra software needed. Choose camera for face-to-face streams, or screen share for tutorials and presentations.
                  </p>
                </div>

                {selectedStream.cfPlaybackUrl && (
                  <a
                    href={`/live/${selectedStream.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[var(--ds-radius-md)] text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Viewer Link
                  </a>
                )}
              </div>
            )}

            {/* Stats for ended streams */}
            {selectedStream.status === "ended" && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-white/5 rounded-xl">
                    <p className="text-lg font-bold">{selectedStream.totalViews || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Total Views</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-xl">
                    <p className="text-lg font-bold">{selectedStream.peakViewerCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Peak Viewers</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-xl">
                    <p className="text-lg font-bold">
                      {selectedStream.startedAt && selectedStream.endedAt
                        ? formatDuration(
                            new Date(selectedStream.endedAt).getTime() -
                              new Date(selectedStream.startedAt).getTime()
                          )
                        : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Duration</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedStream.id)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Stream
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StreamCard({
  stream,
  selected,
  onClick,
  onAction,
  onDelete,
  onShare,
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
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-white/20 ${
        selected
          ? "border-red-500/40 bg-red-500/5"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {stream.status === "live" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Live
              </span>
            ) : stream.status === "idle" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase">
                <Clock className="w-3 h-3" />
                Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground text-[10px] font-bold uppercase">
                Ended
              </span>
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {stream.category}
            </span>
            {stream.priceTzs > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {stream.priceTzs.toLocaleString()} TZS
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm truncate">{stream.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stream.scheduledAt && stream.status === "idle" ? (
              <>
                <Calendar className="w-3 h-3 inline mr-1" />
                Scheduled: {new Date(stream.scheduledAt).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </>
            ) : (
              formatTime(stream.createdAt)
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 ml-3">
          {stream.status === "live" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {stream.viewerCount}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(stream.id);
            }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy viewer link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {stream.status === "ended" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stream.id);
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

function StreamModeToggle({
  mode,
  onModeChange,
}: {
  mode: StreamMode;
  onModeChange: (mode: StreamMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
      <button
        onClick={() => onModeChange("browser")}
        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === "browser"
            ? "bg-red-500/20 text-red-400"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Camera className="w-3 h-3 inline mr-1" />
        Browser
      </button>
      <button
        onClick={() => onModeChange("obs")}
        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === "obs"
            ? "bg-red-500/20 text-red-400"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Monitor className="w-3 h-3 inline mr-1" />
        OBS
      </button>
    </div>
  );
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}h ${rm}m`;
}

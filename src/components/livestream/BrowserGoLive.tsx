"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  StopCircle,
  Monitor,
  Camera,
  RotateCcw,
  Loader2,
  Eye,
  Clock,
  Settings,
} from "lucide-react";

interface BrowserGoLiveProps {
  streamId: string;
  webRtcPublishUrl: string | null;
  onGoLive: () => void;
  onEndStream: () => void;
  status: "idle" | "live" | "ended";
}

type SourceType = "camera" | "screen";

export default function BrowserGoLive({
  streamId,
  webRtcPublishUrl,
  onGoLive,
  onEndStream,
  status,
}: BrowserGoLiveProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sourceType, setSourceType] = useState<SourceType>("camera");
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  // Get available devices
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devs) => {
      setDevices(devs);
    }).catch(() => {});
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        h > 0
          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m}:${s.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Request camera/mic
  const startPreview = useCallback(async (source: SourceType = "camera", videoDeviceId?: string, audioDeviceId?: string) => {
    setError(null);

    // Stop existing stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      let stream: MediaStream;
      if (source === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        // Add mic audio if display doesn't have audio
        if (!stream.getAudioTracks().length) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
            });
            audioStream.getAudioTracks().forEach((t) => stream.addTrack(t));
          } catch {
            // Screen share without mic is fine
          }
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoDeviceId
            ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: audioDeviceId
            ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true }
            : { echoCancellation: true, noiseSuppression: true },
        });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setSourceType(source);

      // Re-enumerate now that we have permission
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs);
    } catch (err) {
      console.error("Failed to get media:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Camera/microphone access denied. Please allow access in your browser settings.");
      } else {
        setError("Failed to access camera/microphone. Please check your device.");
      }
    }
  }, []);

  // Start WHIP streaming
  const startStreaming = async () => {
    if (!webRtcPublishUrl || !mediaStreamRef.current) {
      setError("Stream not configured for browser streaming. Use OBS instead.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
        bundlePolicy: "max-bundle",
      });

      peerConnectionRef.current = pc;

      // Add tracks via transceivers so we can set codec preferences
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];

      if (videoTrack) {
        const videoTransceiver = pc.addTransceiver(videoTrack, {
          direction: "sendonly",
          streams: [mediaStreamRef.current],
        });

        // Force H.264 codec (required by Cloudflare Stream)
        if (videoTransceiver.setCodecPreferences) {
          const codecs = RTCRtpSender.getCapabilities("video")?.codecs || [];
          const h264Codecs = codecs.filter(
            (c) => c.mimeType.toLowerCase() === "video/h264"
          );
          if (h264Codecs.length > 0) {
            videoTransceiver.setCodecPreferences([...h264Codecs, ...codecs.filter(c => c.mimeType.toLowerCase() !== "video/h264")]);
          }
        }
      }

      if (audioTrack) {
        pc.addTransceiver(audioTrack, {
          direction: "sendonly",
          streams: [mediaStreamRef.current],
        });
      }

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          pc.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") resolve();
          });
          // Timeout after 5s
          setTimeout(resolve, 5000);
        }
      });

      // Send offer to Cloudflare WHIP endpoint
      const response = await fetch(webRtcPublishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP failed: ${response.status} ${await response.text()}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp,
      }));

      setIsStreaming(true);
      setStartTime(Date.now());

      // Mark as live in the DB
      onGoLive();

      // Handle disconnection
      pc.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          stopStreaming();
        }
      });
    } catch (err) {
      console.error("WHIP streaming failed:", err);
      setError("Failed to connect to streaming server. Please try again or use OBS.");
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsStreaming(false);
    setStartTime(null);
    setElapsed("");
    onEndStream();
  };

  // Toggle video
  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  // Switch source
  const switchSource = (source: SourceType) => {
    startPreview(source, selectedVideoDevice, selectedAudioDevice);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const audioDevices = devices.filter((d) => d.kind === "audioinput");

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!hasPermission ? "hidden" : ""}`}
        />

        {!hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Camera Preview</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Choose how you want to stream — camera for face-to-face, or screen share for tutorials
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => startPreview("camera")}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => startPreview("screen")}
                >
                  <Monitor className="w-4 h-4" />
                  Screen Share
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Live overlay */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </span>
            {elapsed && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                <Clock className="w-3 h-3" />
                {elapsed}
              </span>
            )}
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {hasPermission && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition-colors ${
                videoEnabled
                  ? "bg-white/10 text-foreground hover:bg-white/15"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-xl transition-colors ${
                audioEnabled
                  ? "bg-white/10 text-foreground hover:bg-white/15"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => switchSource(sourceType === "camera" ? "screen" : "camera")}
              className="p-3 rounded-xl bg-white/10 text-foreground hover:bg-white/15 transition-colors"
              title={sourceType === "camera" ? "Switch to screen share" : "Switch to camera"}
            >
              {sourceType === "camera" ? <Monitor className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-xl transition-colors ${
                showSettings ? "bg-white/20 text-foreground" : "bg-white/10 text-foreground hover:bg-white/15"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isStreaming && status !== "live" ? (
              <Button
                onClick={startStreaming}
                disabled={isConnecting || status === "ended" || !webRtcPublishUrl}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 border-0 px-6"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    Go Live
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => {
                  if (isStreaming) {
                    stopStreaming();
                  } else {
                    onEndStream();
                  }
                }}
                className="px-6"
              >
                <StopCircle className="w-4 h-4" />
                End Stream
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Device settings */}
      {showSettings && hasPermission && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold">Device Settings</h4>
          {videoDevices.length > 0 && sourceType === "camera" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Camera</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => {
                  setSelectedVideoDevice(e.target.value);
                  startPreview("camera", e.target.value, selectedAudioDevice);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
              >
                {videoDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-background">
                    {d.label || `Camera ${videoDevices.indexOf(d) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {audioDevices.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Microphone</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => {
                  setSelectedAudioDevice(e.target.value);
                  startPreview(sourceType, selectedVideoDevice, e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
              >
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-background">
                    {d.label || `Microphone ${audioDevices.indexOf(d) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {!webRtcPublishUrl && hasPermission && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
          WebRTC publish URL not available. This stream may have been created before browser streaming was enabled. Create a new stream to use browser-based Go Live.
        </div>
      )}
    </div>
  );
}

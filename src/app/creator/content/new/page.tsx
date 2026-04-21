"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Upload, FileVideo, X, ImageIcon, Shield, ExternalLink, Music, Video } from "lucide-react";
import Link from "next/link";
import { useToast, Toaster } from "@/components/ui/toast";

const MAX_VIDEO_SIZE_MB = 500;
const MAX_AUDIO_SIZE_MB = 200;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac", "audio/aac", "audio/ogg", "audio/mp4", "audio/x-m4a"];
const ALLOWED_THUMB_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_THUMB_SIZE_MB = 5;

const CATEGORIES = ["Music", "Comedy", "Education", "Entertainment", "Sports", "News", "Gaming", "Lifestyle", "Other"];
const MUSIC_GENRES = ["Afrobeat", "Bongo Flava", "Gospel", "Hip-Hop", "R&B", "Pop", "Jazz", "Reggae", "Dancehall", "Traditional", "Other"];
const PRESET_PRICES = [500, 1000, 2000];

type UploadMode = "video" | "music";

export default function CreateContentPage() {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<UploadMode>("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [priceType, setPriceType] = useState<"free" | "preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState(500);
  const [customPrice, setCustomPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"" | "uploading" | "done" | "error">("");
  const [videoDragging, setVideoDragging] = useState(false);
  const [audioDragging, setAudioDragging] = useState(false);
  const [thumbDragging, setThumbDragging] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [contentDeclaration, setContentDeclaration] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleModeSwitch = (newMode: UploadMode) => {
    setMode(newMode);
    setVideoFile(null); setAudioFile(null); setThumbnailFile(null);
    setUploadStatus(""); setUploadProgress(0); setError("");
    if (newMode === "music") setCategory("Music");
  };

  const extractVideoThumbnail = (file: File): Promise<File | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata"; video.muted = true; video.playsInline = true; video.crossOrigin = "anonymous";
      const url = URL.createObjectURL(file);
      video.src = url;
      let attempts = 0;
      const seekTimes = [1, 0.5, 2];
      const captureFrame = () => {
        try {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            if (attempts < 2) { attempts++; video.currentTime = seekTimes[attempts]; return; }
            URL.revokeObjectURL(url); resolve(null); return;
          }
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            resolve(blob ? new File([blob], "auto-thumbnail.jpg", { type: "image/jpeg" }) : null);
          }, "image/jpeg", 0.9);
        } catch { URL.revokeObjectURL(url); resolve(null); }
      };
      video.onloadedmetadata = () => { video.currentTime = Math.min(seekTimes[0], video.duration * 0.1); };
      video.onseeked = captureFrame;
      video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 20000);
    });
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) { setError("Unsupported format. Use MP4, WebM, or MOV."); return; }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) { setError(`Video too large. Maximum ${MAX_VIDEO_SIZE_MB}MB.`); return; }
    setError(""); setVideoFile(file); setUploadStatus("");
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) { setError("Unsupported format. Use MP3, WAV, FLAC, AAC, or M4A."); return; }
    if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) { setError(`Audio file too large. Maximum ${MAX_AUDIO_SIZE_MB}MB.`); return; }
    setError(""); setAudioFile(file); setUploadStatus("");
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!ALLOWED_THUMB_TYPES.includes(file.type)) { setError("Unsupported thumbnail format. Use JPEG, PNG, or WebP."); return; }
    if (file.size > MAX_THUMB_SIZE_MB * 1024 * 1024) { setError(`Thumbnail too large. Maximum ${MAX_THUMB_SIZE_MB}MB.`); return; }
    setError(""); setThumbnailFile(file);
  };

  const uploadFileToR2 = async (file: File, mediaType: "video" | "audio" | "thumbnail"): Promise<string> => {
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, mediaType }),
    });
    if (!presignRes.ok) { const data = await presignRes.json(); throw new Error(data.error || "Failed to get upload URL"); }
    const { uploadUrl, storageKey } = await presignRes.json();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && (mediaType === "video" || mediaType === "audio")) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
    return storageKey;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!title.trim()) { setError("Title is required"); setLoading(false); return; }
      if (mode === "video" && !videoFile) { setError("Please select a video file"); setLoading(false); return; }
      if (mode === "music" && !audioFile) { setError("Please select an audio file"); setLoading(false); return; }
      if (!contentDeclaration && !isDraft) { setError("You must confirm content ownership before publishing"); setLoading(false); return; }
      const priceTzs = priceType === "free" ? 0 : priceType === "preset" ? selectedPreset : parseInt(customPrice);
      if (priceTzs > 0 && priceTzs < 500) { setError("Paid content must be at least 500 TZS"); setLoading(false); return; }
      if (priceType === "custom" && (isNaN(priceTzs) || priceTzs < 0)) { setError("Please enter a valid price"); setLoading(false); return; }

      setUploadStatus("uploading"); setUploadProgress(0);
      let videoStorageKey: string | null = null;
      let audioStorageKey: string | null = null;
      let thumbnailStorageKey: string | null = null;

      try {
        if (mode === "video" && videoFile) {
          videoStorageKey = await uploadFileToR2(videoFile, "video");
          let thumbToUpload = thumbnailFile;
          if (!thumbToUpload) {
            setUploadProgress(50);
            const autoThumb = await extractVideoThumbnail(videoFile);
            if (!autoThumb) throw new Error("Failed to generate thumbnail. Please upload a custom thumbnail.");
            thumbToUpload = autoThumb;
          }
          thumbnailStorageKey = await uploadFileToR2(thumbToUpload, "thumbnail");
        } else if (mode === "music" && audioFile) {
          audioStorageKey = await uploadFileToR2(audioFile, "audio");
          if (thumbnailFile) thumbnailStorageKey = await uploadFileToR2(thumbnailFile, "thumbnail");
        }
        setUploadStatus("done");
      } catch (err: unknown) {
        setUploadStatus("error");
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg); toast(msg, "error"); setLoading(false); return;
      }

      const response = await fetch("/api/creator/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description,
          category: mode === "music" ? "Music" : category,
          contentType: mode === "music" ? "audio_upload" : "upload",
          youtubeUrl: null, videoStorageKey, audioStorageKey, thumbnailStorageKey,
          priceTzs, status: isDraft ? "draft" : "published",
          genre: mode === "music" ? genre || null : undefined,
          explicit: mode === "music" ? explicit : undefined,
        }),
      });

      if (!response.ok) { const data = await response.json(); setError(data.error || "Failed to create content"); setLoading(false); return; }
      toast(isDraft ? "Draft saved!" : `${mode === "music" ? "Track" : "Content"} published!`, "success");
      setTimeout(() => router.push("/creator/content"), 1200);
    } catch { setError("An unexpected error occurred"); toast("An unexpected error occurred", "error"); setLoading(false); }
  };

  const dropZoneClass = (active: boolean) =>
    `w-full p-10 border border-dashed transition-all cursor-pointer select-none text-center ${
      active ? "border-amber-500 bg-amber-500/5" : "border-white/15 hover:border-white/30 hover:bg-white/3"
    }`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-950">
      <Toaster toasts={toasts} dismiss={dismiss} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[11px] font-mono text-white/40 uppercase tracking-wider hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 transition-all disabled:opacity-50"
            >
              ← Back
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px w-4 bg-amber-500/40" />
                <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Studio</span>
              </div>
              <h1 className="text-lg font-bold font-mono tracking-tight text-white">Create New Content</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {error && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">
                {error}
              </div>
            )}

            {/* Content Type */}
            <div className="border border-white/10 bg-neutral-950 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="p-6">
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">STEP.01</div>
                <h2 className="text-sm font-semibold font-mono tracking-tight text-white mb-4">Content Type</h2>
                <div className="grid grid-cols-2 gap-3">
                  {([["video", "Video", "MP4, WebM, MOV", Video], ["music", "Music", "MP3, WAV, FLAC, AAC", Music]] as const).map(([val, label, sub, Icon]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleModeSwitch(val)}
                      disabled={loading}
                      className={`flex items-center gap-3 p-4 border-2 transition-all ${
                        mode === val
                          ? "border-amber-500 bg-amber-500/8 text-amber-400"
                          : "border-white/10 hover:border-white/25 hover:bg-white/3 text-white/40"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-mono font-semibold">{label}</p>
                        <p className="text-[10px] font-mono opacity-60 mt-0.5">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="border border-white/10 bg-neutral-950 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">STEP.02</div>
                  <h2 className="text-sm font-semibold font-mono tracking-tight text-white">
                    {mode === "music" ? "Upload Track" : "Upload Video"}
                  </h2>
                </div>

                {/* Primary file zone */}
                {mode === "video" ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Video File *</label>
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} className="hidden" />
                    {videoFile ? (
                      <div className="flex items-center gap-3 p-3 border border-white/10 bg-white/3">
                        <FileVideo className="w-7 h-7 text-amber-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono font-medium text-white truncate">{videoFile.name}</p>
                          <p className="text-[10px] font-mono text-white/30">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={() => { setVideoFile(null); setUploadStatus(""); }} className="w-6 h-6 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setVideoDragging(true); }}
                        onDragLeave={() => setVideoDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setVideoDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleVideoSelect({ target: { files: e.dataTransfer.files } } as any); }}
                        onClick={() => videoInputRef.current?.click()}
                        className={dropZoneClass(videoDragging)}
                      >
                        <Upload className={`w-9 h-9 mx-auto mb-3 transition-colors ${videoDragging ? "text-amber-400" : "text-white/20"}`} />
                        <p className="text-sm font-mono font-medium text-white/60">{videoDragging ? "Drop to upload" : "Drag & drop or click to select"}</p>
                        <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-wider">MP4, WebM, or MOV · Max {MAX_VIDEO_SIZE_MB}MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Audio File *</label>
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
                    {audioFile ? (
                      <div className="flex items-center gap-3 p-3 border border-white/10 bg-white/3">
                        <Music className="w-7 h-7 text-amber-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono font-medium text-white truncate">{audioFile.name}</p>
                          <p className="text-[10px] font-mono text-white/30">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={() => { setAudioFile(null); setUploadStatus(""); }} className="w-6 h-6 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setAudioDragging(true); }}
                        onDragLeave={() => setAudioDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setAudioDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleAudioSelect({ target: { files: e.dataTransfer.files } } as any); }}
                        onClick={() => audioInputRef.current?.click()}
                        className={dropZoneClass(audioDragging)}
                      >
                        <Music className={`w-9 h-9 mx-auto mb-3 transition-colors ${audioDragging ? "text-amber-400" : "text-white/20"}`} />
                        <p className="text-sm font-mono font-medium text-white/60">{audioDragging ? "Drop to upload" : "Drag & drop or click to select"}</p>
                        <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-wider">MP3, WAV, FLAC, AAC, M4A · Max {MAX_AUDIO_SIZE_MB}MB</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload progress */}
                {uploadStatus === "uploading" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-white/30 uppercase tracking-wider">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Cover / Thumbnail */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {mode === "music" ? "Cover Art" : "Thumbnail"}{" "}
                    <span className="text-white/20 normal-case tracking-normal font-normal">
                      {mode === "music" ? "(optional)" : "(optional — auto-generated if not set)"}
                    </span>
                  </label>
                  <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailSelect} className="hidden" />
                  {thumbnailFile ? (
                    <div className="flex items-center gap-3 p-3 border border-white/10 bg-white/3">
                      <ImageIcon className="w-5 h-5 text-green-400 shrink-0" />
                      <p className="text-sm font-mono text-white/70 truncate flex-1">{thumbnailFile.name}</p>
                      <button type="button" onClick={() => setThumbnailFile(null)} className="w-6 h-6 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setThumbDragging(true); }}
                      onDragLeave={() => setThumbDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setThumbDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleThumbnailSelect({ target: { files: e.dataTransfer.files } } as any); }}
                      onClick={() => thumbInputRef.current?.click()}
                      className={dropZoneClass(thumbDragging)}
                    >
                      <ImageIcon className={`w-7 h-7 mx-auto mb-2 transition-colors ${thumbDragging ? "text-green-400" : "text-white/20"}`} />
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-wider">{thumbDragging ? "Drop image here" : "Drag & drop or click · JPEG, PNG, WebP · Max 5MB"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="border border-white/10 bg-neutral-950 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="p-6">
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">STEP.03</div>
                <h2 className="text-sm font-semibold font-mono tracking-tight text-white mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="title" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      {mode === "music" ? "Song Title *" : "Title *"}
                    </label>
                    <Input
                      id="title"
                      placeholder={mode === "music" ? "Name your track" : "Give your content a catchy title"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:border-amber-500/50 rounded-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="description" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Description</label>
                    <textarea
                      id="description"
                      placeholder={mode === "music" ? "Tell fans about this track..." : "Describe what fans will get..."}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                      className="w-full min-h-[90px] px-3 py-2 border border-white/15 bg-white/5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>

                  {mode === "music" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="genre" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Genre</label>
                        <select
                          id="genre"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-white/15 bg-white/5 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="" className="bg-neutral-900">Select genre</option>
                          {MUSIC_GENRES.map((g) => <option key={g} value={g.toLowerCase()} className="bg-neutral-900">{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Explicit Content</label>
                        <label className="flex items-center gap-3 cursor-pointer mt-2.5">
                          <input
                            type="checkbox"
                            checked={explicit}
                            onChange={(e) => setExplicit(e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-sm font-mono text-white/40">Mark as explicit</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {mode === "video" && (
                    <div className="space-y-1.5">
                      <label htmlFor="category" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Category *</label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-white/15 bg-white/5 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50"
                      >
                        {CATEGORIES.map((cat) => <option key={cat} value={cat} className="bg-neutral-900">{cat}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border border-white/10 bg-neutral-950 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
              <div className="p-6">
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">STEP.04</div>
                <h2 className="text-sm font-semibold font-mono tracking-tight text-white mb-1">Pricing</h2>
                <p className="text-[10px] font-mono text-white/30 mb-4 uppercase tracking-wider">
                  Set how much fans pay to {mode === "music" ? "stream this track" : "access this content"}
                </p>
                <div className="space-y-3">
                  {/* Free */}
                  <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${priceType === "free" ? "border-green-500/30 bg-green-500/5" : "border-white/10 hover:border-white/20"}`}>
                    <input type="radio" checked={priceType === "free"} onChange={() => setPriceType("free")} disabled={loading} className="mt-0.5 w-4 h-4 accent-amber-500" />
                    <div>
                      <p className="text-sm font-mono font-semibold text-white">Free</p>
                      <p className="text-[10px] font-mono text-green-400/70 mt-0.5">Recommended for growing your audience</p>
                    </div>
                  </label>

                  {/* Preset */}
                  <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${priceType === "preset" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 hover:border-white/20"}`}>
                    <input type="radio" checked={priceType === "preset"} onChange={() => setPriceType("preset")} disabled={loading} className="mt-0.5 w-4 h-4 accent-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-mono font-semibold text-white">Preset Prices</p>
                      {priceType === "preset" && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {PRESET_PRICES.map((price) => (
                            <button key={price} type="button" onClick={() => setSelectedPreset(price)} disabled={loading}
                              className={`p-3 border-2 transition-all ${selectedPreset === price ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/15 text-white/50 hover:border-white/30"}`}>
                              <div className="text-xl font-bold font-mono">{price}</div>
                              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">TZS</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Custom */}
                  <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${priceType === "custom" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 hover:border-white/20"}`}>
                    <input type="radio" checked={priceType === "custom"} onChange={() => setPriceType("custom")} disabled={loading} className="mt-0.5 w-4 h-4 accent-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-mono font-semibold text-white">Custom Price</p>
                      {priceType === "custom" && (
                        <div className="mt-3">
                          <div className="relative">
                            <Input type="number" placeholder="Enter amount" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} disabled={loading} min="500" step="100"
                              className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:border-amber-500/50 rounded-none pr-14" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 uppercase tracking-wider">TZS</span>
                          </div>
                          <p className="text-[9px] font-mono text-white/20 mt-1 uppercase tracking-wider">Minimum for paid content: 500 TZS</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Content Declaration */}
            <div className="border border-amber-500/20 bg-amber-500/3 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/50" />
              <div className="p-6">
                <div className="text-[9px] font-mono text-amber-500/40 uppercase tracking-widest mb-1">STEP.05</div>
                <h2 className="text-sm font-semibold font-mono tracking-tight text-white mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Content Ownership Declaration
                </h2>
                <p className="text-[10px] font-mono text-white/30 mb-4 uppercase tracking-wider">You must confirm ownership before publishing</p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={contentDeclaration}
                    onChange={(e) => setContentDeclaration(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm font-mono text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                    I declare that I am the <strong className="text-white/80">original creator</strong> of this content or hold all necessary rights and licenses to distribute it. I confirm this content does not infringe on any third-party copyrights. I am <strong className="text-white/80">solely responsible</strong> for the content I publish.
                  </span>
                </label>
                <div className="mt-3">
                  <Link href="/creator/content-policy" target="_blank" className="text-[10px] font-mono text-amber-400 hover:text-amber-300 uppercase tracking-wider inline-flex items-center gap-1 transition-colors">
                    Read full Content Policy & Creator Agreement
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pb-8">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="inline-flex h-10 items-center px-5 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDraft(true);
                    setTimeout(() => { const form = (e.currentTarget as HTMLElement).closest("form"); if (form) form.requestSubmit(); }, 0);
                  }}
                  className="inline-flex h-10 items-center px-5 border border-white/15 text-[10px] font-mono text-white/50 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all disabled:opacity-50"
                >
                  {loading && isDraft ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="submit"
                  disabled={loading || !contentDeclaration}
                  onClick={() => setIsDraft(false)}
                  className="inline-flex h-10 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!contentDeclaration ? "Confirm content ownership to publish" : undefined}
                >
                  {loading && !isDraft ? "Publishing..." : mode === "music" ? "Publish Track" : "Publish Content"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

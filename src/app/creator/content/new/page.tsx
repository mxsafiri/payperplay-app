"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Upload, ArrowLeft, FileVideo, X, ImageIcon } from "lucide-react";

const MAX_VIDEO_SIZE_MB = 500;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_THUMB_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_THUMB_SIZE_MB = 5;

const CATEGORIES = [
  "Music",
  "Comedy",
  "Education",
  "Entertainment",
  "Sports",
  "News",
  "Gaming",
  "Lifestyle",
  "Other",
];

const PRESET_PRICES = [500, 1000, 2000];

export default function CreateContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Music");
  const [contentType, setContentType] = useState<"youtube_preview" | "upload">("youtube_preview");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [priceType, setPriceType] = useState<"free" | "preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState(500);
  const [customPrice, setCustomPrice] = useState("");

  // Upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"" | "uploading" | "done" | "error">("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError("Unsupported format. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`Video too large. Maximum ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }
    setError("");
    setVideoFile(file);
    setUploadStatus("");
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_THUMB_TYPES.includes(file.type)) {
      setError("Unsupported thumbnail format. Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_THUMB_SIZE_MB * 1024 * 1024) {
      setError(`Thumbnail too large. Maximum ${MAX_THUMB_SIZE_MB}MB.`);
      return;
    }
    setError("");
    setThumbnailFile(file);
  };

  const uploadFileToR2 = async (file: File, mediaType: "video" | "thumbnail"): Promise<string> => {
    // 1. Get presigned URL
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mediaType,
      }),
    });
    if (!presignRes.ok) {
      const data = await presignRes.json();
      throw new Error(data.error || "Failed to get upload URL");
    }
    const { uploadUrl, storageKey } = await presignRes.json();

    // 2. Upload directly to R2 with progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && mediaType === "video") {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });

    return storageKey;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate
      if (!title.trim()) {
        setError("Title is required");
        setLoading(false);
        return;
      }

      if (contentType === "youtube_preview" && !youtubeUrl.trim()) {
        setError("YouTube URL is required");
        setLoading(false);
        return;
      }

      if (contentType === "upload" && !videoFile) {
        setError("Please select a video file");
        setLoading(false);
        return;
      }

      const priceTzs = priceType === "free" ? 0 : priceType === "preset" ? selectedPreset : parseInt(customPrice);

      if (priceTzs > 0 && priceTzs < 500) {
        setError("Paid content must be at least 500 TZS");
        setLoading(false);
        return;
      }

      if (priceType === "custom" && (isNaN(priceTzs) || priceTzs < 0)) {
        setError("Please enter a valid price");
        setLoading(false);
        return;
      }

      // Upload files to R2 if direct upload
      let videoStorageKey: string | null = null;
      let thumbnailStorageKey: string | null = null;

      if (contentType === "upload" && videoFile) {
        setUploadStatus("uploading");
        setUploadProgress(0);
        try {
          videoStorageKey = await uploadFileToR2(videoFile, "video");
          if (thumbnailFile) {
            thumbnailStorageKey = await uploadFileToR2(thumbnailFile, "thumbnail");
          }
          setUploadStatus("done");
        } catch (err: unknown) {
          setUploadStatus("error");
          setError(err instanceof Error ? err.message : "Upload failed");
          setLoading(false);
          return;
        }
      }

      // Create content
      const response = await fetch("/api/creator/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          contentType,
          youtubeUrl: contentType === "youtube_preview" ? youtubeUrl : null,
          videoStorageKey,
          thumbnailStorageKey,
          priceTzs,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create content");
        setLoading(false);
        return;
      }

      const data = await response.json();
      router.push(`/creator/content/${data.content.id}/edit`);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header — frosted glass */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create New Content</h1>
              <p className="text-sm text-muted-foreground">
                Share exclusive content with your fans
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <div className="relative p-6">
                <h2 className="text-lg font-semibold tracking-tight mb-4">Basic Information</h2>
                <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title *
                  </label>
                  <Input
                    id="title"
                    placeholder="Give your content a catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="Describe what fans will get..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              </div>
            </div>

            {/* Content Type */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <div className="relative p-6">
                <h2 className="text-lg font-semibold tracking-tight mb-4">Content Type</h2>
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setContentType("youtube_preview")}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === "youtube_preview"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Youtube className="w-8 h-8 text-red-500 mb-2" />
                    <div className="font-semibold">YouTube Early Access</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Share YouTube videos before they go public
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType("upload")}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contentType === "upload"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-blue-500 mb-2" />
                    <div className="font-semibold">Upload Video</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      MP4, WebM, or MOV up to {MAX_VIDEO_SIZE_MB}MB
                    </div>
                  </button>
                </div>

                {contentType === "youtube_preview" && (
                  <div className="space-y-2">
                    <label htmlFor="youtubeUrl" className="text-sm font-medium">
                      YouTube URL *
                    </label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full YouTube video URL
                    </p>
                  </div>
                )}

                {contentType === "upload" && (
                  <div className="space-y-4">
                    {/* Video file picker */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Video File *</label>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                      {videoFile ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                          <FileVideo className="w-8 h-8 text-blue-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{videoFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setVideoFile(null); setUploadStatus(""); }}
                            className="p-1 rounded hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={loading}
                          className="w-full p-8 rounded-lg border-2 border-dashed border-white/15 hover:border-white/30 transition-colors text-center"
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to select video</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4, WebM, or MOV · Max {MAX_VIDEO_SIZE_MB}MB
                          </p>
                        </button>
                      )}

                      {uploadStatus === "uploading" && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail picker (optional) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thumbnail (optional)</label>
                      <input
                        ref={thumbInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                      />
                      {thumbnailFile ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                          <ImageIcon className="w-6 h-6 text-green-400 shrink-0" />
                          <p className="text-sm truncate flex-1">{thumbnailFile.name}</p>
                          <button
                            type="button"
                            onClick={() => setThumbnailFile(null)}
                            className="p-1 rounded hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          disabled={loading}
                          className="w-full p-4 rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 transition-colors text-center"
                        >
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, or WebP · Max {MAX_THUMB_SIZE_MB}MB
                          </p>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <div className="relative p-6">
                <h2 className="text-lg font-semibold tracking-tight mb-1">Pricing</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Set how much fans pay to access this content
                </p>
                <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="free"
                      checked={priceType === "free"}
                      onChange={() => setPriceType("free")}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <label htmlFor="free" className="text-sm font-medium">
                      Free
                    </label>
                    <span className="text-xs text-green-500 font-medium">Recommended for growing your audience</span>
                  </div>

                  {priceType === "free" && (
                    <div className="ml-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Anyone can watch this content for free. Great for building your fanbase!
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="preset"
                      checked={priceType === "preset"}
                      onChange={() => setPriceType("preset")}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <label htmlFor="preset" className="text-sm font-medium">
                      Preset Prices
                    </label>
                  </div>

                  {priceType === "preset" && (
                    <div className="grid grid-cols-3 gap-3 ml-6">
                      {PRESET_PRICES.map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setSelectedPreset(price)}
                          disabled={loading}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedPreset === price
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-2xl font-bold">{price}</div>
                          <div className="text-xs text-muted-foreground">TZS</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="custom"
                      checked={priceType === "custom"}
                      onChange={() => setPriceType("custom")}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <label htmlFor="custom" className="text-sm font-medium">
                      Custom Price
                    </label>
                  </div>

                  {priceType === "custom" && (
                    <div className="ml-6">
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          disabled={loading}
                          min="500"
                          step="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          TZS
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum for paid content: 500 TZS
                      </p>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Save as draft
                  }}
                >
                  Save as Draft
                </Button>
                <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 hover:scale-[1.02]">
                  {loading ? "Creating..." : "Publish Content"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

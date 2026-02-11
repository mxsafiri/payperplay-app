"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

const PRESET_PRICES = [300, 500, 1000];

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
  const [priceType, setPriceType] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState(300);
  const [customPrice, setCustomPrice] = useState("");

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

      const priceTzs = priceType === "preset" ? selectedPreset : parseInt(customPrice);

      if (!priceTzs || priceTzs < 100) {
        setError("Price must be at least 100 TZS");
        setLoading(false);
        return;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Content</h1>
              <p className="text-sm text-muted-foreground">
                Share exclusive content with your fans
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Content Type */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Content Type</h2>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <div className="text-3xl mb-2">🎥</div>
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
                    } opacity-50 cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-2">📤</div>
                    <div className="font-semibold">Upload</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coming soon
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
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Pricing</h2>
                <p className="text-sm text-muted-foreground">
                  Set how much fans pay to access this content
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          min="100"
                          step="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          TZS
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum: 100 TZS
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
                <Button type="submit" disabled={loading}>
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

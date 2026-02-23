"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Save, User, ExternalLink } from "lucide-react";

interface Profile {
  id: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Avatar upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setProfile(p);
        setDisplayName(p.displayName || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatarUrl);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setSaveError("Please select a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("Avatar must be under 2MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setSaveError("");

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          mediaType: "avatar",
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, storageKey } = await presignRes.json();

      // Upload to R2
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Get a read URL for the avatar
      const readRes = await fetch(`/api/upload/presign/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey }),
      });

      // For now, use the storage key and we'll generate the URL on the fly
      // Save the storage key as the avatar URL
      const avatarReadUrl = readRes.ok
        ? (await readRes.json()).url
        : `r2://${storageKey}`;

      setAvatarUrl(avatarReadUrl);

      // Auto-save avatar to profile
      await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: avatarReadUrl }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchProfile();
    } catch (error: any) {
      setSaveError(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchProfile();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
      }
    } catch (error) {
      setSaveError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/creator/dashboard")} className="hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Avatar Section */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6">
            <h2 className="text-lg font-semibold tracking-tight mb-6">Profile Picture</h2>

            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-500/30 to-purple-500/30 border-2 border-white/10">
                  {avatarUrl && !avatarUrl.startsWith("r2://") ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a profile picture. JPEG, PNG, or WebP, max 2MB.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-white/10"
                  >
                    <Camera className="w-4 h-4 mr-1.5" />
                    {uploading ? `Uploading ${uploadProgress}%...` : "Change Photo"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setAvatarUrl(null);
                        await fetch("/api/profile/me", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ avatarUrl: null }),
                        });
                        fetchProfile();
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
        </div>

        {/* Profile Details */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6 space-y-5">
            <h2 className="text-lg font-semibold tracking-tight">Profile Details</h2>

            {saveSuccess && (
              <div className="px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-sm">
                Changes saved successfully
              </div>
            )}
            {saveError && (
              <div className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Handle</label>
              <div className="flex items-center gap-2">
                <Input
                  value={`@${profile.handle}`}
                  disabled
                  className="bg-white/5 border-white/10 opacity-60"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Cannot be changed</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                placeholder="Tell your fans about yourself..."
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/500 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Email</label>
              <Input
                value={session?.user?.email || ""}
                disabled
                className="bg-white/5 border-white/10 opacity-60"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Role</label>
              <Input
                value={profile.role === "creator" ? "Creator" : "Fan"}
                disabled
                className="bg-white/5 border-white/10 opacity-60"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Member Since</label>
              <Input
                value={new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                disabled
                className="bg-white/5 border-white/10 opacity-60"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/creator/${profile.handle}`)}
                className="border-white/10"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View Public Profile
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

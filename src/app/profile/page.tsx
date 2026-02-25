"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Crown, Loader2, Save, Users } from "lucide-react";
import { FanShell } from "@/components/fan/FanShell";

interface Profile {
  id: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

type SubStatus = {
  status: "none" | "trial" | "active" | "grace" | "expired" | "creator";
  hasAccess: boolean;
  daysRemaining: number;
  trialUsed: boolean;
  expiresAt: string | null;
  graceEndsAt: string | null;
  weeklyPrice: number;
  isCreator: boolean;
};

export default function FanProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [following, setFollowing] = useState<
    Array<{ id: string; handle: string; displayName: string | null; avatarUrl: string | null }>
  >([]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    void Promise.all([fetchProfile(), fetchSubStatus(), fetchFollowing()]).finally(() => setLoading(false));
  }, [session, router]);

  const fetchProfile = async () => {
    const res = await fetch("/api/profile/me");
    if (!res.ok) return;
    const data = await res.json();
    const p = data.profile as Profile;
    setProfile(p);
    setDisplayName(p.displayName || "");
    setBio(p.bio || "");
    setAvatarUrl(p.avatarUrl);
  };

  const fetchSubStatus = async () => {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return;
    const data = (await res.json()) as SubStatus;
    setSub(data);
  };

  const fetchFollowing = async () => {
    try {
      const res = await fetch("/api/follow/following");
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error("Failed to fetch following:", error);
    }
  };

  const handleUnfollow = async (creatorId: string) => {
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      if (res.ok) {
        setFollowing((prev) => prev.filter((c) => c.id !== creatorId));
      }
    } catch (error) {
      console.error("Failed to unfollow:", error);
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
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await fetchProfile();
    } catch {
      setSaveError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
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

      // Save the R2 storage key as avatarUrl — the backend generates fresh presigned URLs
      await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: `r2://${storageKey}` }),
      });

      await fetchProfile();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const renderSubLine = () => {
    if (!sub) return "";
    if (sub.isCreator) return "Creator accounts don’t need a subscription.";

    if (sub.status === "trial") {
      return `Free trial active — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} remaining.`;
    }
    if (sub.status === "active") {
      return `Subscription active — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} remaining.`;
    }
    if (sub.status === "grace") {
      return `Grace period — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} left to renew.`;
    }
    if (sub.status === "expired") {
      return "Subscription expired — renew to keep watching.";
    }
    return "No subscription yet — start your 30-day free trial.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <FanShell title="Profile" subtitle="Manage your account and subscription">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.displayName || profile.handle}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                type="button"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">Your Profile</h1>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
              {uploading && (
                <p className="mt-2 text-xs text-muted-foreground">Uploading avatar… {uploadProgress}%</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Display name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Bio</label>
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you like" />
            </div>

            {saveError && <div className="text-sm text-red-500">{saveError}</div>}
            {saveSuccess && <div className="text-sm text-green-600 dark:text-green-400">Saved</div>}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        {/* Following Section */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Following
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {following.length === 0
              ? "You're not following any creators yet."
              : `Following ${following.length} creator${following.length !== 1 ? "s" : ""}`}
          </p>

          {following.length > 0 && (
            <div className="space-y-3">
              {following.map((creator) => (
                <div key={creator.id} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                    {creator.avatarUrl ? (
                      <Image
                        src={creator.avatarUrl}
                        alt={creator.displayName || creator.handle}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                        {(creator.displayName || creator.handle).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {creator.displayName || `@${creator.handle}`}
                    </p>
                    <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnfollow(creator.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Unfollow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Subscription</h2>
          <p className="text-sm text-muted-foreground mb-4">{renderSubLine()}</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => router.push("/subscribe")}>Go to Subscription</Button>
            <Button variant="outline" onClick={fetchSubStatus}>
              Refresh status
            </Button>
          </div>
        </div>
      </div>
    </FanShell>
  );
}

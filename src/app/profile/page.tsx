"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, Crown, Loader2, Save } from "lucide-react";
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

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    void Promise.all([fetchProfile(), fetchSubStatus()]).finally(() => setLoading(false));
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

      const readRes = await fetch("/api/upload/presign/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey }),
      });

      const avatarReadUrl = readRes.ok ? (await readRes.json()).url : `r2://${storageKey}`;
      setAvatarUrl(avatarReadUrl);

      await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: avatarReadUrl }),
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

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FanShell } from "@/components/fan/FanShell";

interface Profile {
  id: string; handle: string; displayName: string | null; bio: string | null;
  avatarUrl: string | null; role: string; createdAt: string;
}

type SubStatus = {
  status: "none" | "trial" | "active" | "grace" | "expired" | "creator";
  hasAccess: boolean; daysRemaining: number; trialUsed: boolean;
  expiresAt: string | null; graceEndsAt: string | null; weeklyPrice: number; isCreator: boolean;
};

export default function FanProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
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
    if (isPending) return;
    if (!session) { router.push("/login"); return; }
    void Promise.all([fetchProfile(), fetchSubStatus(), fetchFollowing()]).finally(() => setLoading(false));
  }, [session, isPending, router]);

  const fetchProfile = async () => {
    const res = await fetch("/api/profile/me");
    if (!res.ok) return;
    const data = await res.json();
    const p = data.profile as Profile;
    setProfile(p); setDisplayName(p.displayName || ""); setBio(p.bio || ""); setAvatarUrl(p.avatarUrl);
  };
  const fetchSubStatus = async () => {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return;
    setSub((await res.json()) as SubStatus);
  };
  const fetchFollowing = async () => {
    try {
      const res = await fetch("/api/follow/following");
      if (res.ok) { const data = await res.json(); setFollowing(data.following || []); }
    } catch { console.error("Failed to fetch following"); }
  };
  const handleUnfollow = async (creatorId: string) => {
    try {
      const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creatorId }) });
      if (res.ok) setFollowing((prev) => prev.filter((c) => c.id !== creatorId));
    } catch { console.error("Failed to unfollow"); }
  };
  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, bio, avatarUrl }) });
      if (!res.ok) { const data = await res.json(); setSaveError(data.error || "Failed to save"); return; }
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); await fetchProfile();
    } catch { setSaveError("Failed to save"); }
    finally { setSaving(false); }
  };
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { setSaveError("Please select a JPEG, PNG, or WebP image"); return; }
    if (file.size > 2 * 1024 * 1024) { setSaveError("Avatar must be under 2MB"); return; }
    setUploading(true); setUploadProgress(0); setSaveError("");
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, mediaType: "avatar" }),
      });
      if (!presignRes.ok) { const data = await presignRes.json(); throw new Error(data.error || "Failed to get upload URL"); }
      const { uploadUrl, storageKey } = await presignRes.json();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (evt) => { if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100)); });
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error("Upload failed")); };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", uploadUrl); xhr.setRequestHeader("Content-Type", file.type); xhr.send(file);
      });
      await fetch("/api/profile/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: `r2://${storageKey}` }) });
      await fetchProfile();
    } catch (err: any) { setSaveError(err?.message || "Failed to upload avatar"); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const renderSubLine = () => {
    if (!sub) return "";
    if (sub.isCreator) return "Creator accounts don't need a subscription.";
    if (sub.status === "trial") return `Free trial active — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} remaining.`;
    if (sub.status === "active") return `Subscription active — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} remaining.`;
    if (sub.status === "grace") return `Grace period — ${sub.daysRemaining} day${sub.daysRemaining === 1 ? "" : "s"} left to renew.`;
    if (sub.status === "expired") return "Subscription expired — renew to keep watching.";
    return "No subscription yet — start your 30-day free trial.";
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  return (
    <FanShell title="Profile" subtitle="Manage your account and subscription">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Profile Card */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">FAN.PROFILE</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-5">Your Profile</h2>

            <div className="flex items-start gap-5 mb-5">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-16 h-16 overflow-hidden bg-amber-500/10 border-2 border-amber-500/20">
                  {avatarUrl?.startsWith("http") ? (
                    <Image src={avatarUrl} alt={profile.displayName || profile.handle} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl font-bold font-mono text-amber-400/50">
                        {(profile.displayName || profile.handle).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-neutral-950 border border-white/20 flex items-center justify-center hover:border-amber-500/40 transition-colors"
                  type="button"
                >
                  <span className="text-[9px] text-white/40 font-mono">◎</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-white text-sm">{profile.displayName || `@${profile.handle}`}</p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">@{profile.handle}</p>
                {uploading && (
                  <div className="mt-2">
                    <div className="h-1 bg-white/10">
                      <div className="bg-amber-500 h-1 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wider">Uploading {uploadProgress}%...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Bio</label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you like"
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
              </div>

              {saveError && <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">{saveError}</div>}
              {saveSuccess && <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-400 text-[11px] font-mono">✓ Saved</div>}

              <button onClick={handleSave} disabled={saving}
                className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes →"}
              </button>
            </div>
          </div>
        </div>

        {/* Following */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">FAN.FOLLOWING</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-1">Following</h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">
              {following.length === 0
                ? "You're not following any creators yet."
                : `Following ${following.length} creator${following.length !== 1 ? "s" : ""}`}
            </p>

            {following.length > 0 && (
              <div className="space-y-2">
                {following.map((creator) => (
                  <div key={creator.id} className="flex items-center gap-3 p-2.5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="relative w-8 h-8 overflow-hidden bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                      {creator.avatarUrl?.startsWith("http") ? (
                        <Image src={creator.avatarUrl} alt={creator.displayName || creator.handle} fill className="object-cover" sizes="32px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
                          {(creator.displayName || creator.handle).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-xs text-white/70 truncate">{creator.displayName || `@${creator.handle}`}</p>
                      <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">@{creator.handle}</p>
                    </div>
                    <button onClick={() => handleUnfollow(creator.id)}
                      className="inline-flex h-7 items-center px-3 border border-white/10 text-[9px] font-mono text-white/30 uppercase tracking-widest hover:border-red-500/30 hover:text-red-400 transition-all">
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscription */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">FAN.SUBSCRIPTION</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-1">Subscription</h2>
            <p className="text-[10px] font-mono text-white/40 mb-4">{renderSubLine()}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => router.push("/subscribe")}
                className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
                Go to Subscription →
              </button>
              <button onClick={fetchSubStatus}
                className="inline-flex h-9 items-center px-5 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </FanShell>
  );
}

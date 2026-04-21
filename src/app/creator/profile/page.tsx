"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setProfile(p); setDisplayName(p.displayName || ""); setBio(p.bio || ""); setAvatarUrl(p.avatarUrl);
      }
    } catch (error) { console.error("Failed to fetch profile:", error); }
    finally { setLoading(false); }
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
      xhr.upload.addEventListener("progress", (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); });
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error("Upload failed")); };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", uploadUrl); xhr.setRequestHeader("Content-Type", file.type); xhr.send(file);
      });
      await fetch("/api/profile/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: `r2://${storageKey}` }) });
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); fetchProfile();
    } catch (error: any) { setSaveError(error.message || "Failed to upload avatar"); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() || null, bio: bio.trim() || null }),
      });
      if (res.ok) { setSaveSuccess(true); fetchProfile(); setTimeout(() => setSaveSuccess(false), 3000); }
      else { const data = await res.json(); setSaveError(data.error || "Failed to save"); }
    } catch { setSaveError("Failed to save changes"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/creator/dashboard")}
              className="inline-flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider hover:text-white hover:bg-white/5 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all"
            >
              ← Dashboard
            </button>
            <div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CREATOR.PROFILE</div>
              <h1 className="text-base font-bold font-mono tracking-tight text-white">Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Avatar Section */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">AVATAR.UPLOAD</div>
            <h2 className="text-sm font-semibold font-mono text-white mb-5">Profile Picture</h2>

            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 overflow-hidden bg-amber-500/10 border-2 border-amber-500/20 relative">
                  {avatarUrl && !avatarUrl.startsWith("r2://") ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-amber-400/50">
                        {(profile.displayName || profile.handle)[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <span className="text-white font-mono text-xs">◎</span>
                </button>
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3">
                  JPEG, PNG, or WebP · Max 2MB
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex h-8 items-center px-4 border border-white/15 text-[10px] font-mono text-white/50 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all disabled:opacity-50"
                  >
                    {uploading ? `Uploading ${uploadProgress}%...` : "Change Photo"}
                  </button>
                  {avatarUrl && (
                    <button
                      onClick={async () => {
                        setAvatarUrl(null);
                        await fetch("/api/profile/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: null }) });
                        fetchProfile();
                      }}
                      className="inline-flex h-8 items-center px-4 border border-red-500/20 text-[10px] font-mono text-red-400/70 uppercase tracking-widest hover:border-red-500/40 hover:text-red-400 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3 w-full bg-white/10 h-1">
                    <div className="bg-amber-500 h-1 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
          </div>
        </div>

        {/* Profile Details */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">PROFILE.DETAILS</div>
              <h2 className="text-sm font-semibold font-mono text-white">Profile Details</h2>
            </div>

            {saveSuccess && (
              <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-400 text-[11px] font-mono">
                ✓ Changes saved successfully
              </div>
            )}
            {saveError && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">
                {saveError}
              </div>
            )}

            {[
              { label: "Handle", value: `@${profile.handle}`, disabled: true, note: "Cannot be changed" },
            ].map(({ label, value, disabled, note }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</label>
                  {note && <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">{note}</span>}
                </div>
                <Input value={value} disabled={disabled} className="bg-white/5 border-white/10 text-white/50 font-mono text-sm rounded-none opacity-60" />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500}
                className="w-full bg-white/5 border border-white/15 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 resize-none"
                placeholder="Tell your fans about yourself..." />
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">{bio.length}/500</p>
            </div>

            {[
              { label: "Email", value: session?.user?.email || "" },
              { label: "Role", value: profile.role === "creator" ? "Creator" : "Fan" },
              { label: "Member Since", value: new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</label>
                <Input value={value} disabled className="bg-white/5 border-white/10 text-white/50 font-mono text-sm rounded-none opacity-60" />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes →"}
              </button>
              <Link href={`/creator/${profile.handle}`}
                className="inline-flex h-9 items-center px-5 border border-white/15 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all">
                View Public Profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import Image from "next/image";
import { Users, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";

type UserRole = "creator" | "fan";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<UserRole>("fan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"account" | "role" | "profile">("account");

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || result.error.code || "Signup failed");
        setLoading(false);
        return;
      }
      if (!result.data) {
        setError("Signup failed — please try again");
        setLoading(false);
        return;
      }
      setStep("role");
      setLoading(false);
    } catch (err: unknown) {
      setError((err as Error)?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, role, displayName: name }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create profile");
        setLoading(false);
        return;
      }
      router.push(role === "creator" ? "/creator/dashboard" : "/feed");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const stepLabels = {
    account: { title: "Create Account", sub: "JOIN PAYPERPLAY TODAY" },
    role: { title: "Choose Your Role", sub: "CREATOR OR FAN?" },
    profile: { title: "Your Profile", sub: "ALMOST DONE" },
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-neutral-950">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/BG.jpg" alt="" fill className="object-cover opacity-15" sizes="100vw" priority />
        <div className="absolute inset-0 tech-grid" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-pink-500/6" />
      </div>

      {/* Corner accents */}
      <div className="fixed top-6 left-6 w-8 h-8 border-t border-l border-amber-500/30 z-10" />
      <div className="fixed top-6 right-6 w-8 h-8 border-t border-r border-amber-500/30 z-10" />
      <div className="fixed bottom-6 left-6 w-8 h-8 border-b border-l border-amber-500/30 z-10" />
      <div className="fixed bottom-6 right-6 w-8 h-8 border-b border-r border-amber-500/30 z-10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="border border-white/10 bg-neutral-950/90 backdrop-blur-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />

          {/* Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-mono font-black text-sm">▶</span>
            </div>
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">
              PayPerPlay
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["account", "role", "profile"] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-6 h-0.5 ${step === s || (s === "account" && step !== "account") || (s === "role" && step === "profile") ? "bg-amber-500" : "bg-white/15"}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${step === s ? "bg-amber-500" : i < ["account","role","profile"].indexOf(step) ? "bg-amber-500/50" : "bg-white/20"}`} />
              </React.Fragment>
            ))}
            <div className="w-6 h-0.5 bg-white/15" />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-6 bg-amber-500/40" />
              <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">
                {stepLabels[step].sub}
              </span>
              <div className="h-px w-6 bg-amber-500/40" />
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
              {stepLabels[step].title}
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          {step === "account" && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Full Name</label>
                <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Email</label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Password</label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={8} className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 mt-2">
                {loading ? "Creating..." : "Continue →"}
              </button>
              <div className="text-center text-[10px] font-mono text-white/30 uppercase tracking-wider">
                Have an account?{" "}
                <Link href="/login" className="text-amber-500/70 hover:text-amber-400 transition-colors">Sign in</Link>
              </div>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole("fan")}
                  className={`p-5 border-2 transition-all relative group ${role === "fan" ? "border-amber-500 bg-amber-500/10" : "border-white/15 hover:border-amber-500/40"}`}
                >
                  {role === "fan" && <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/60" />}
                  <Users className={`w-7 h-7 mb-2 mx-auto ${role === "fan" ? "text-amber-400" : "text-white/40"}`} />
                  <div className={`font-mono font-semibold text-xs uppercase tracking-wider ${role === "fan" ? "text-amber-400" : "text-white/60"}`}>Fan</div>
                  <div className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wider">Discover creators</div>
                </button>
                <button
                  onClick={() => setRole("creator")}
                  className={`p-5 border-2 transition-all relative group ${role === "creator" ? "border-amber-500 bg-amber-500/10" : "border-white/15 hover:border-amber-500/40"}`}
                >
                  {role === "creator" && <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/60" />}
                  <Palette className={`w-7 h-7 mb-2 mx-auto ${role === "creator" ? "text-amber-400" : "text-white/40"}`} />
                  <div className={`font-mono font-semibold text-xs uppercase tracking-wider ${role === "creator" ? "text-amber-400" : "text-white/60"}`}>Creator</div>
                  <div className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wider">Share content</div>
                </button>
              </div>
              <button onClick={() => setStep("profile")} className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
                Continue as {role === "creator" ? "Creator" : "Fan"} →
              </button>
            </div>
          )}

          {step === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="handle" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">@</span>
                  <Input
                    id="handle" type="text" placeholder="username"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    required disabled={loading}
                    className="pl-8 bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none"
                    minLength={3} maxLength={20}
                  />
                </div>
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">Letters, numbers, and underscores only</p>
              </div>
              <button type="submit" disabled={loading} className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">
                {loading ? "Setting up..." : "Complete Setup →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

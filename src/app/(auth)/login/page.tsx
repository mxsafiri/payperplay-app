"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password, rememberMe: true });
      if (result.error) {
        setError(result.error.message || "Login failed");
        setLoading(false);
        return;
      }
      try {
        const profileRes = await fetch("/api/profile/me");
        if (profileRes.ok) {
          const { profile } = await profileRes.json();
          router.push(profile?.role === "creator" ? "/creator/dashboard" : "/feed");
        } else {
          router.push("/feed");
        }
      } catch {
        router.push("/feed");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
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

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-6 bg-amber-500/40" />
              <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Welcome Back</span>
              <div className="h-px w-6 bg-amber-500/40" />
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white">Sign In</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-mono text-white/30 hover:text-amber-400 uppercase tracking-wider transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>

            <div className="text-center text-[10px] font-mono text-white/30 uppercase tracking-wider">
              No account?{" "}
              <Link href="/signup" className="text-amber-500/70 hover:text-amber-400 transition-colors">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message || "Failed to send reset email");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-neutral-950">
      <div className="fixed inset-0 z-0">
        <Image src="/BG.jpg" alt="" fill className="object-cover opacity-15" sizes="100vw" priority />
        <div className="absolute inset-0 tech-grid" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-pink-500/6" />
      </div>

      <div className="fixed top-6 left-6 w-8 h-8 border-t border-l border-amber-500/30 z-10" />
      <div className="fixed top-6 right-6 w-8 h-8 border-t border-r border-amber-500/30 z-10" />
      <div className="fixed bottom-6 left-6 w-8 h-8 border-b border-l border-amber-500/30 z-10" />
      <div className="fixed bottom-6 right-6 w-8 h-8 border-b border-r border-amber-500/30 z-10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="border border-white/10 bg-neutral-950/90 backdrop-blur-xl p-8 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />

          {/* Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-mono font-black text-sm">▶</span>
            </div>
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">PayPerPlay</span>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-6 bg-amber-500/40" />
                  <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Email Sent</span>
                  <div className="h-px w-6 bg-amber-500/40" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-white">Check your inbox</h1>
              </div>
              <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                We sent a reset link to <span className="text-white/70">{email}</span>. The link expires in 1 hour.
              </p>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Didn&apos;t receive it? Check your spam folder.</p>
              <Link
                href="/login"
                className="inline-flex h-9 w-full items-center justify-center border border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-widest hover:border-white/25 hover:text-white transition-all"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-6 bg-amber-500/40" />
                  <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Password Reset</span>
                  <div className="h-px w-6 bg-amber-500/40" />
                </div>
                <h1 className="text-2xl font-bold font-mono tracking-tight text-white">Forgot password?</h1>
                <p className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-wider">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">{error}</div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <Mail className="w-3 h-3 inline mr-1" />Email
                  </label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link →"}
                </button>

                <div className="text-center text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  Remember it?{" "}
                  <Link href="/login" className="text-amber-500/70 hover:text-amber-400 transition-colors">Sign in</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

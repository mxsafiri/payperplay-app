"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, Lock } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new reset link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!token) { setError("Invalid reset token. Please request a new reset link."); return; }
    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message || "Failed to reset password");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-6 bg-amber-500/40" />
                  <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Success</span>
                  <div className="h-px w-6 bg-amber-500/40" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-white">Password updated!</h1>
              </div>
              <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                Your password has been reset. Redirecting to sign in...
              </p>
              <Link
                href="/login"
                className="inline-flex h-9 w-full items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                Sign In Now →
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-6 bg-amber-500/40" />
                  <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">New Password</span>
                  <div className="h-px w-6 bg-amber-500/40" />
                </div>
                <h1 className="text-2xl font-bold font-mono tracking-tight text-white">Set new password</h1>
                <p className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-wider">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono leading-relaxed">
                    {error}
                    {!token && (
                      <Link href="/forgot-password" className="block mt-2 text-amber-400 hover:text-amber-300 underline">
                        Request a new link →
                      </Link>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <Lock className="w-3 h-3 inline mr-1" />New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !token}
                    minLength={8}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  />
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Minimum 8 characters</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Confirm Password</label>
                  <input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading || !token}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full inline-flex h-10 items-center justify-center bg-amber-500 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password →"}
                </button>

                <div className="text-center text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  <Link href="/login" className="text-amber-500/70 hover:text-amber-400 transition-colors">← Back to Sign In</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
          <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

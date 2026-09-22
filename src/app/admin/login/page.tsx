"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid admin secret.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border border-amber-500/30 bg-neutral-900 p-8">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono text-amber-500/80 tracking-widest uppercase">PPP.ADMIN</span>
          </div>
          <h1 className="text-white font-mono font-bold text-xl mb-1">Admin Access</h1>
          <p className="text-neutral-500 font-mono text-xs mb-8">Enter the admin secret to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 tracking-widest uppercase mb-2">
                Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-red-400 font-mono text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-semibold text-sm py-2.5 transition-colors"
            >
              {loading ? "AUTHENTICATING..." : "ENTER"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

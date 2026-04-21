"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paying, setPaying] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) setSubStatus(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleStartTrial = async () => {
    setActivatingTrial(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setMessage(data.message || "Trial activated!"); setTimeout(() => router.push("/"), 2000); }
      else setError(data.error || "Failed to activate trial");
    } catch { setError("Something went wrong"); }
    finally { setActivatingTrial(false); }
  };

  const handleSubscribe = async () => {
    if (!phoneNumber.trim()) { setError("Please enter your M-Pesa phone number"); return; }
    setPaying(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.instructions || "Payment request sent! Check your phone to confirm.");
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch("/api/subscription/status");
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.hasAccess) { clearInterval(pollInterval); setMessage("Subscription activated! Redirecting..."); setTimeout(() => router.push("/"), 2000); }
          }
        }, 3000);
        setTimeout(() => clearInterval(pollInterval), 120000);
      } else setError(data.error || "Payment failed");
    } catch { setError("Something went wrong"); }
    finally { setPaying(false); }
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

  if (subStatus?.hasAccess && subStatus?.status !== "grace") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center border border-green-500/20 bg-green-500/3 p-10 relative max-w-sm mx-4">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-500/40" />
          <div className="w-12 h-12 mx-auto mb-4 border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 font-mono text-xl">✓</div>
          <p className="text-[9px] font-mono text-green-500/50 uppercase tracking-widest mb-1">SUBSCRIPTION.ACTIVE</p>
          <h1 className="text-lg font-bold font-mono text-white mb-2">Active Subscription!</h1>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-5">
            {subStatus.status === "trial" ? `Free trial — ${subStatus.daysRemaining} days remaining` : `Active — ${subStatus.daysRemaining} days remaining`}
          </p>
          <button onClick={() => router.push("/")}
            className="inline-flex h-9 items-center px-6 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors">
            Browse Content →
          </button>
        </div>
      </div>
    );
  }

  const showTrialOption = !subStatus?.trialUsed && subStatus?.status !== "grace";
  const isGrace = subStatus?.status === "grace";
  const isExpired = subStatus?.status === "expired";

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-0 w-12 h-12 border-t border-l border-amber-500/20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-12 h-12 border-t border-r border-amber-500/20 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <span className="text-black font-mono font-black text-sm">▶</span>
            </div>
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">PayPerPlay</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 bg-amber-500/40" />
            <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">
              {isGrace ? "SUBSCRIPTION.EXPIRED" : isExpired ? "SUBSCRIPTION.RENEW" : "SUBSCRIPTION.UNLOCK"}
            </span>
            <div className="h-px w-8 bg-amber-500/40" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
            {isGrace ? "Subscription Expired" : isExpired ? "Renew Subscription" : "Unlock PayPerPlay"}
          </h1>
          <p className="text-[11px] font-mono text-white/40 mt-2 uppercase tracking-wider">
            {isGrace
              ? `Grace period — ${subStatus.daysRemaining} day(s) left. Renew now!`
              : isExpired
              ? "Your access has expired. Subscribe to continue watching."
              : "Get unlimited access to all free content on the platform"}
          </p>
        </div>

        {/* Grace period warning */}
        {isGrace && (
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 font-mono text-lg flex-shrink-0">⚠</span>
              <div>
                <p className="text-xs font-mono font-semibold text-yellow-400 uppercase tracking-wider">Grace Period Active</p>
                <p className="text-[10px] font-mono text-white/40 mt-1">
                  You still have access for {subStatus.daysRemaining} more day(s). Renew now to avoid losing access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What you get */}
        <div className="border border-white/10 bg-neutral-950 relative mb-4">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">SUBSCRIPTION.BENEFITS</div>
            <div className="space-y-3">
              {[
                { icon: "◎", title: "Unlimited free content", desc: "Watch all free content from every creator on the platform" },
                { icon: "◈", title: "Premium content access", desc: "Pay per view for premium creator content at their set prices" },
                { icon: "◐", title: "7-day access + 2-day grace", desc: "Each subscription gives you 7 days of access, plus a 2-day grace period to renew" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-amber-400/60 font-mono mt-0.5 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs font-mono font-semibold text-white/70 uppercase tracking-wider">{title}</p>
                    <p className="text-[9px] font-mono text-white/30 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing + payment */}
        <div className="border border-amber-500/20 bg-amber-500/3 relative mb-4">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">WEEKLY.ACCESS</div>
                <h2 className="text-sm font-semibold font-mono text-white">Weekly Access Pass</h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-amber-400">500</div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">TZS / week</div>
              </div>
            </div>

            {/* Free trial option */}
            {showTrialOption && (
              <div className="border border-green-500/25 bg-green-500/5 p-4 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono font-semibold text-green-400 uppercase tracking-wider">30 Days Free!</p>
                    <p className="text-[9px] font-mono text-white/30 mt-0.5">Start with a free month — no payment required</p>
                  </div>
                  <button onClick={handleStartTrial} disabled={activatingTrial}
                    className="inline-flex h-8 items-center px-4 bg-green-600 text-[9px] font-mono font-semibold text-white uppercase tracking-widest hover:bg-green-500 transition-colors disabled:opacity-50 flex-shrink-0">
                    {activatingTrial ? "..." : "Start Trial"}
                  </button>
                </div>
              </div>
            )}

            {/* M-Pesa pay */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                {showTrialOption ? "Or pay now with M-Pesa:" : "Pay with M-Pesa:"}
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xs">📱</span>
                  <Input type="tel" placeholder="0712 345 678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-8 bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm rounded-none" />
                </div>
                <button onClick={handleSubscribe} disabled={paying}
                  className="inline-flex h-9 items-center px-5 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 flex-shrink-0">
                  {paying ? "..." : "Pay 500 TZS"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="p-3 border border-green-500/20 bg-green-500/5 mb-3">
            <p className="text-[11px] font-mono text-green-400">✓ {message}</p>
          </div>
        )}
        {error && (
          <div className="p-3 border border-red-500/20 bg-red-500/5 mb-3">
            <p className="text-[11px] font-mono text-red-400">⚠ {error}</p>
          </div>
        )}

        <div className="text-center">
          <button onClick={() => router.push("/")}
            className="text-[10px] font-mono text-white/25 uppercase tracking-widest hover:text-white/50 transition-colors underline underline-offset-4">
            Browse content without subscribing
          </button>
        </div>
      </div>
    </div>
  );
}

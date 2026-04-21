"use client";

import { useEffect, useState, useCallback } from "react";
import { FanShell } from "@/components/fan/FanShell";

interface WalletData {
  provisioned: boolean;
  balanceTzs: number;
  walletAddress: string | null;
  ntzsUserId?: string;
  balanceUnavailable?: boolean;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpResult, setTopUpResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((result: { success: boolean; message: string }) => {
    setTopUpResult(result);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  }, []);

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) { const data = await res.json(); setWallet(data.wallet); }
    } catch (err) { console.error("Failed to fetch wallet:", err); }
    finally { setLoading(false); }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || !phoneNumber) return;
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount < 500) { setTopUpResult({ success: false, message: "Minimum top-up is TZS 500" }); return; }
    setTopUpLoading(true); setTopUpResult(null);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountTzs: amount, phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ success: true, message: data.instructions || `M-Pesa push sent to ${phoneNumber}. Check your phone!` });
        setTopUpAmount(""); setPhoneNumber("");
        setTimeout(fetchWallet, 5000);
      } else {
        showToast({ success: false, message: data.error || "Top-up failed. Please try again." });
      }
    } catch { showToast({ success: false, message: "Network error. Please try again." }); }
    finally { setTopUpLoading(false); }
  };

  return (
    <FanShell title="My Wallet" subtitle="Manage your nTZS balance">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Balance Card */}
        <div className="border border-amber-500/20 bg-amber-500/3 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">WALLET.BALANCE</div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-wider">nTZS Wallet Balance</p>
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Powered by nTZS WaaS</p>
              </div>
              <button onClick={fetchWallet} title="Refresh balance"
                className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/30 hover:text-amber-400 hover:border-amber-500/30 transition-all font-mono">
                <span className={`text-xs ${loading ? "animate-spin inline-block" : ""}`}>↻</span>
              </button>
            </div>

            {loading ? (
              <div className="h-10 bg-white/5 animate-pulse" />
            ) : wallet?.balanceUnavailable ? (
              <div>
                <p className="text-3xl font-bold font-mono text-white/30">--</p>
                <p className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mt-1">Balance temporarily unavailable</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl font-bold font-mono tracking-tight text-white">
                  {(wallet?.balanceTzs ?? 0).toLocaleString()}
                  <span className="text-base font-normal text-white/30 ml-2">TZS</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top-Up Form */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-6 border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 font-mono text-xs">▼</div>
              <div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">WALLET.TOPUP</div>
                <h2 className="text-sm font-semibold font-mono text-white">Top Up Wallet</h2>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Deposit via M-Pesa — minimum TZS 500</p>
              </div>
            </div>

            <form onSubmit={handleTopUp} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Amount (TZS)</label>
                <input
                  type="number" min={500} step={100} value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">M-Pesa Phone Number</label>
                <input
                  type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit" disabled={topUpLoading || !topUpAmount || !phoneNumber}
                className="w-full h-10 inline-flex items-center justify-center bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {topUpLoading ? "Sending M-Pesa push..." : "Top Up Wallet"}
              </button>
            </form>
          </div>
        </div>

        {/* How it works */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">HOW.IT.WORKS</div>
            <div className="space-y-3">
              {[
                { step: "01", text: "Top up your wallet via M-Pesa" },
                { step: "02", text: "Buy content instantly from your balance — no M-Pesa push per purchase" },
                { step: "03", text: "Creators receive earnings directly to their nTZS wallet" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-mono font-bold text-amber-400/70">{step}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider leading-relaxed mt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-sm transition-all duration-300 ease-out ${
        toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        {topUpResult && (
          <div className={`flex items-start gap-3 px-4 py-3.5 border text-xs font-mono ${
            topUpResult.success
              ? "bg-neutral-950 border-green-500/30 text-green-400"
              : "bg-neutral-950 border-red-500/30 text-red-400"
          }`}>
            <span className="flex-shrink-0 mt-0.5">{topUpResult.success ? "✓" : "⚠"}</span>
            <p className="flex-1 leading-snug">{topUpResult.message}</p>
            <button onClick={() => setToastVisible(false)} className="opacity-60 hover:opacity-100 flex-shrink-0 font-mono">×</button>
          </div>
        )}
      </div>
    </FanShell>
  );
}

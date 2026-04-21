"use client";

import { useState } from "react";
import { Coins, X } from "lucide-react";

interface Props {
  contentId: string;
  creatorName: string;
  walletBalance: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [500, 1_000, 2_000, 5_000];

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${n}`;
}

export function TipPanel({ contentId, creatorName, walletBalance, isOpen, onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(1000);
  const [custom, setCustom] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const amount = custom ? parseInt(custom, 10) : selected;

  const handleSend = async () => {
    if (!amount || amount < 100) { setError("Minimum tip is 100 TZS"); return; }
    if (walletBalance !== null && amount > walletBalance) {
      setError(`You only have ${walletBalance.toLocaleString()} TZS in your wallet`);
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/content/${contentId}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountTzs: amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          setSelected(1000);
          setCustom("");
        }, 2000);
      } else if (res.status === 402) {
        setError("Not enough balance. Top up your wallet first.");
      } else {
        setError(data.error || "Failed to send tip");
      }
    } catch {
      setError("Failed to send tip");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-10" onClick={onClose} />

      {/* Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-neutral-950/98 border-t border-amber-500/20 p-5 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40" />

        {success ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 mx-auto mb-3 border border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-white font-mono font-bold text-sm uppercase tracking-widest">Tip Sent!</p>
            <p className="text-white/40 font-mono text-[11px] mt-1 uppercase tracking-wider">
              {amount?.toLocaleString()} TZS → {creatorName}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">Tip Creator</p>
                </div>
                <p className="text-white font-mono font-bold text-sm">{creatorName}</p>
                {walletBalance !== null && (
                  <p className="text-[10px] font-mono text-white/30 mt-0.5 uppercase tracking-wider">
                    Wallet: {walletBalance.toLocaleString()} TZS
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 hover:bg-white/5 transition-all"
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelected(p); setCustom(""); setError(""); }}
                  className={`py-2.5 text-[11px] font-mono font-bold transition-all border ${
                    selected === p && !custom
                      ? "border-amber-500 bg-amber-500/15 text-amber-400"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mb-3">
              <input
                type="number"
                min={100}
                max={500000}
                placeholder="Custom amount (TZS)"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(null); setError(""); }}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-mono text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-mono mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="text-red-500">!</span> {error}
                {error.includes("Top up") && (
                  <a href="/wallet" className="underline text-amber-400 ml-1">Top up</a>
                )}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={!amount || amount < 100 || sending}
              className="w-full py-3 bg-amber-500 text-black text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending
                ? "Sending..."
                : amount && amount >= 100
                ? `Send ${amount.toLocaleString()} TZS`
                : "Select an amount"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

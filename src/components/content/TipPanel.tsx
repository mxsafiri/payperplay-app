"use client";

import { useState } from "react";

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
    if (!amount || amount < 100) {
      setError("Minimum tip is 100 TZS");
      return;
    }
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
        setError(`Not enough balance. Top up your wallet first.`);
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
      <div
        className="absolute inset-0 z-10"
        onClick={onClose}
      />

      {/* Panel — slides up from bottom of video */}
      <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl bg-neutral-900/95 backdrop-blur-md p-5 shadow-2xl">
        {success ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-white font-bold text-lg">Tip sent!</p>
            <p className="text-neutral-400 text-sm mt-1">
              {amount?.toLocaleString()} TZS sent to {creatorName}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold text-base">Tip {creatorName} 💰</p>
                {walletBalance !== null && (
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Wallet: {walletBalance.toLocaleString()} TZS
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelected(p); setCustom(""); setError(""); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selected === p && !custom
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-3">
              <input
                type="number"
                min={100}
                max={500000}
                placeholder="Custom amount (TZS)"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setSelected(null);
                  setError("");
                }}
                className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
                <span>⚠️</span> {error}
                {error.includes("Top up") && (
                  <a href="/wallet" className="underline ml-1">Top up →</a>
                )}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={!amount || amount < 100 || sending}
              className="w-full py-3 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
            >
              {sending
                ? "Sending..."
                : amount && amount >= 100
                ? `Send ${amount.toLocaleString()} TZS 💰`
                : "Select an amount"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

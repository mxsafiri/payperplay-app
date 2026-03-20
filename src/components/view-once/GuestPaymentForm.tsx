"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { collectDeviceSignals } from "@/lib/fingerprint";

interface GuestPaymentFormProps {
  slug: string;
  priceTzs: number;
  creatorName: string;
  onPaymentComplete: () => void;
}

type PaymentState = "idle" | "submitting" | "polling" | "success" | "error";

export function GuestPaymentForm({
  slug,
  priceTzs,
  creatorName,
  onPaymentComplete,
}: GuestPaymentFormProps) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!phone.trim()) {
        setError("Enter your phone number");
        return;
      }

      setState("submitting");

      try {
        const deviceFingerprint = collectDeviceSignals(slug);

        // Step 1: Initiate payment
        const payRes = await fetch(`/api/view-once/${slug}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone.trim(), deviceFingerprint }),
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          setError(payData.error || "Payment failed");
          setState("error");
          return;
        }

        setInstructions(payData.instructions || "Check your phone for the M-Pesa prompt");
        setState("polling");

        // Step 2: Poll for confirmation
        const { purchaseId, depositId } = payData;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5s intervals)

        pollRef.current = setInterval(async () => {
          attempts++;

          if (attempts >= maxAttempts) {
            if (pollRef.current) clearInterval(pollRef.current);
            setError("Payment timed out. Please try again.");
            setState("error");
            return;
          }

          try {
            const verifyRes = await fetch(`/api/view-once/${slug}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ purchaseId, depositId }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.status === "paid") {
              if (pollRef.current) clearInterval(pollRef.current);
              setState("success");
              // Small delay to show success, then load video
              setTimeout(() => onPaymentComplete(), 1000);
            } else if (verifyData.status === "failed") {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(verifyData.error || "Payment failed");
              setState("error");
            }
            // "pending" — keep polling
          } catch {
            // Network error — keep polling
          }
        }, 5000);
      } catch (err) {
        console.error("Payment error:", err);
        setError("Something went wrong. Please try again.");
        setState("error");
      }
    },
    [phone, slug, onPaymentComplete]
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-zinc-400">Unlock this video</p>
          <p className="text-2xl font-bold text-amber-500">
            {priceTzs.toLocaleString()} TZS
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Goes to</p>
          <p className="text-sm font-medium text-white">{creatorName}</p>
        </div>
      </div>

      {state === "success" ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-green-400 font-semibold">Payment confirmed!</p>
          <p className="text-zinc-500 text-sm mt-1">Loading video...</p>
        </div>
      ) : state === "polling" ? (
        <div className="text-center py-4">
          <div className="animate-pulse">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-amber-400 font-semibold">
              {instructions || "Check your phone..."}
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Enter your M-Pesa PIN to confirm
            </p>
          </div>
          {/* Cancel */}
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setState("idle");
            }}
            className="mt-4 text-xs text-zinc-600 underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Phone input */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Phone number (M-Pesa)
            </label>
            <div className="flex items-center bg-zinc-800 rounded-xl border border-zinc-700 focus-within:border-amber-500 transition-colors">
              <span className="text-zinc-500 text-sm pl-3 pr-1">+255</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7XX XXX XXX"
                className="flex-1 bg-transparent px-2 py-3 text-white outline-none text-sm"
                maxLength={12}
                disabled={state === "submitting"}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Pay button */}
          <button
            type="submit"
            disabled={state === "submitting"}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            {state === "submitting" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Sending M-Pesa prompt...
              </span>
            ) : (
              `Pay ${priceTzs.toLocaleString()} TZS with M-Pesa`
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="text-[10px] text-zinc-600">🔒 Secure payment</span>
            <span className="text-[10px] text-zinc-600">⚡ Instant access</span>
            <span className="text-[10px] text-zinc-600">📱 No app needed</span>
          </div>
        </form>
      )}
    </div>
  );
}

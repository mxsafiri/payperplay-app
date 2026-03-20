"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FanShell } from "@/components/fan/FanShell";
import { Wallet, ArrowDownCircle, RefreshCw, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

interface WalletData {
  provisioned: boolean;
  balanceTzs: number;
  walletAddress: string | null;
  ntzsUserId?: string;
  balanceUnavailable?: boolean;
}

type DepositStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('idle');
  const [depositMessage, setDepositMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentDepositIdRef = useRef<string | null>(null);

  const showToast = useCallback((status: DepositStatus, message: string) => {
    setDepositStatus(status);
    setDepositMessage(message);
    setToastVisible(true);
    
    // Auto-hide toast for completed/failed states after 5 seconds
    if (status === 'completed' || status === 'failed') {
      setTimeout(() => {
        setToastVisible(false);
        setDepositStatus('idle');
      }, 5000);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollDepositStatus = useCallback(async (depositId: string) => {
    try {
      const res = await fetch(`/api/wallet/deposit/status?depositId=${depositId}`);
      if (!res.ok) {
        stopPolling();
        showToast('failed', 'Failed to check deposit status');
        return;
      }

      const data = await res.json();
      const status = data.status?.toLowerCase() || 'pending';

      if (status === 'completed' || status === 'success') {
        stopPolling();
        showToast('completed', `Deposit successful! ${data.amountTzs.toLocaleString()} TZS added to your wallet.`);
        await fetchWallet();
      } else if (status === 'failed' || status === 'error') {
        stopPolling();
        showToast('failed', 'Deposit failed. Please try again or contact support.');
      } else if (status === 'processing') {
        showToast('processing', 'Processing your payment...');
      }
    } catch (error) {
      console.error('Error polling deposit status:', error);
    }
  }, [stopPolling, showToast]);

  const startPolling = useCallback((depositId: string) => {
    currentDepositIdRef.current = depositId;
    stopPolling();
    
    // Poll immediately
    pollDepositStatus(depositId);
    
    // Then poll every 3 seconds for up to 2 minutes
    let pollCount = 0;
    const maxPolls = 40; // 2 minutes at 3-second intervals
    
    pollIntervalRef.current = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        stopPolling();
        showToast('failed', 'Deposit verification timed out. Please check your balance or contact support.');
        return;
      }
      pollDepositStatus(depositId);
    }, 3000);
  }, [pollDepositStatus, stopPolling, showToast]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || !phoneNumber) return;

    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount < 500) {
      showToast('failed', "Minimum top-up is TZS 500");
      return;
    }

    setTopUpLoading(true);
    stopPolling();

    try {
      // Show pending toast immediately
      showToast('pending', `Sending M-Pesa push to ${phoneNumber}...`);

      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountTzs: amount, phoneNumber }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update to processing state
        showToast('processing', data.instructions || `M-Pesa push sent! Check your phone to complete the payment.`);
        
        // Clear form
        setTopUpAmount("");
        setPhoneNumber("");
        
        // Start polling for status updates
        if (data.depositId) {
          startPolling(data.depositId);
        }
      } else {
        showToast('failed', data.error || "Failed to initiate deposit. Please try again.");
      }
    } catch (error) {
      console.error('Deposit error:', error);
      showToast('failed', "Network error. Please check your connection and try again.");
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <FanShell title="My Wallet" subtitle="Manage your nTZS balance">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Balance Card */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">nTZS Wallet Balance</p>
                <p className="text-xs text-muted-foreground/60">Powered by nTZS WaaS</p>
              </div>
            </div>
            <button
              onClick={fetchWallet}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ) : wallet?.balanceUnavailable ? (
            <div>
              <p className="text-3xl font-bold text-muted-foreground">--</p>
              <p className="text-xs text-amber-400 mt-1">Balance temporarily unavailable</p>
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold tracking-tight">
                {(wallet?.balanceTzs ?? 0).toLocaleString()}
                <span className="text-lg font-normal text-muted-foreground ml-2">TZS</span>
              </p>
            </div>
          )}
        </div>

        {/* Top-Up Form */}
        <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold">Top Up Wallet</h2>
              <p className="text-xs text-muted-foreground">Deposit via M-Pesa — minimum TZS 500</p>
            </div>
          </div>

          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount (TZS)</label>
              <input
                type="number"
                min={500}
                step={100}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712345678"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={topUpLoading || !topUpAmount || !phoneNumber}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {topUpLoading ? "Sending M-Pesa push..." : "Top Up Wallet"}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-white/10 bg-background/20 p-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">How it works</h3>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "Top up your wallet via M-Pesa" },
              { step: "2", text: "Buy content instantly from your balance — no M-Pesa push per purchase" },
              { step: "3", text: "Creators receive earnings directly to their nTZS wallet" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </div>
                <p className="text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Animated toast notification */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-sm transition-all duration-300 ease-out ${
          toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {depositMessage && (
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-2xl border backdrop-blur-xl text-sm ${
              depositStatus === 'completed'
                ? "bg-green-950/90 border-green-500/30 text-green-300"
                : depositStatus === 'failed'
                ? "bg-red-950/90 border-red-500/30 text-red-300"
                : depositStatus === 'processing'
                ? "bg-blue-950/90 border-blue-500/30 text-blue-300"
                : "bg-amber-950/90 border-amber-500/30 text-amber-300"
            }`}
          >
            {depositStatus === 'completed' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" />
            ) : depositStatus === 'failed' ? (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
            ) : depositStatus === 'processing' || depositStatus === 'pending' ? (
              <Loader2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-400 animate-spin" />
            ) : null}
            <p className="flex-1 leading-snug">{depositMessage}</p>
            {(depositStatus === 'completed' || depositStatus === 'failed') && (
              <button
                onClick={() => {
                  setToastVisible(false);
                  setDepositStatus('idle');
                }}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </FanShell>
  );
}

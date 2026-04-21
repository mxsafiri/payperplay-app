"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Wallet, TrendingUp, Coins, Banknote, Phone, Clock, CheckCircle, AlertCircle, CreditCard, PiggyBank, X } from "lucide-react";

interface WalletData {
  wallet: {
    id: string; balance: number; totalEarned: number; totalWithdrawn: number;
    totalFees: number; ntzsBalance: number | null; ntzsWalletAddress: string | null;
  };
  transactions: {
    id: string; type: string; status: string; amount: number;
    balanceAfter: number; description: string | null; createdAt: string;
  }[];
}

export default function EarningsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "earning" | "withdrawal">("all");

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchData();
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const [walletRes] = await Promise.all([fetch("/api/creator/wallet")]);
      if (walletRes.ok) setWalletData(await walletRes.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault(); setWithdrawError(""); setWithdrawSuccess(""); setWithdrawLoading(true);
    try {
      const res = await fetch("/api/creator/wallet/withdraw", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(withdrawAmount), phoneNumber: withdrawPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawError(data.error || "Withdrawal failed"); setWithdrawLoading(false); return; }
      setWithdrawSuccess(`${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}!`);
      setWithdrawAmount(""); setWithdrawPhone(""); fetchData();
    } catch { setWithdrawError("An unexpected error occurred"); } finally { setWithdrawLoading(false); }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.EARNINGS</p>
        </div>
      </div>
    );
  }

  const wallet = walletData?.wallet;
  const transactions = walletData?.transactions || [];
  const filteredTx = txFilter === "all" ? transactions : transactions.filter((tx) => tx.type === txFilter);
  const earningsTx = transactions.filter((tx) => tx.type === "earning");
  const withdrawalTx = transactions.filter((tx) => tx.type === "withdrawal");

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px w-4 bg-amber-500/40" />
                <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Studio</span>
              </div>
              <h1 className="text-lg font-bold font-mono tracking-tight text-white">Earnings</h1>
            </div>
            <button
              onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }}
              disabled={!wallet || wallet.balance < 1000}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Banknote className="w-3.5 h-3.5" />
              Withdraw
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-5">
        {/* Wallet Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { index: "01", label: "Available Balance", value: wallet?.balance || 0, icon: Wallet, accent: true },
            { index: "02", label: "Total Earned", value: wallet?.totalEarned || 0, icon: TrendingUp, accent: false },
            { index: "03", label: "Withdrawn", value: wallet?.totalWithdrawn || 0, icon: Banknote, accent: false },
            { index: "04", label: "Platform Fees (15%)", value: wallet?.totalFees || 0, icon: CreditCard, accent: false },
          ].map((s) => (
            <div key={s.label} className={`border p-4 relative group hover:border-amber-500/20 transition-colors ${s.accent ? "border-amber-500/25 bg-amber-500/3" : "border-white/10 bg-neutral-950"}`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{s.index}</div>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-2xl font-bold font-mono ${s.accent ? "text-amber-400" : "text-white"}`}>
                    {s.value.toLocaleString()}
                    <span className="text-[10px] font-normal text-white/30 ml-1">TZS</span>
                  </div>
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
                <s.icon className="w-4 h-4 text-amber-400/40 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* nTZS On-Chain */}
        {wallet?.ntzsBalance !== null && wallet?.ntzsBalance !== undefined && (
          <div className="border border-white/10 bg-neutral-950 relative p-5">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-white/10 bg-white/3 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-amber-400/60" />
                </div>
                <div>
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">NTZS.ON-CHAIN</div>
                  <p className="text-[10px] font-mono text-white/30 truncate max-w-[280px]">{wallet?.ntzsWalletAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-amber-400">{wallet.ntzsBalance.toLocaleString()}</div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-wider">TZS</div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">TX.HISTORY</div>
              <div className="flex items-center gap-1">
                {(["all", "earning", "withdrawal"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={`px-3 py-1.5 text-[9px] font-mono font-semibold uppercase tracking-widest border transition-all ${
                      txFilter === filter ? "border-amber-500 bg-amber-500 text-black" : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white bg-transparent"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "earning" ? "Earnings" : "Withdrawals"}
                    <span className="ml-1 opacity-60">
                      {filter === "all" ? transactions.length : filter === "earning" ? earningsTx.length : withdrawalTx.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-7 h-7 text-white/10 mx-auto mb-3" />
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">NO.TRANSACTIONS</p>
                <p className="text-sm font-mono text-white/30 mt-1">
                  {txFilter === "all" ? "Earnings appear when fans purchase your content" : `No ${txFilter}s found`}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 flex items-center justify-center border text-[11px] font-mono ${
                        tx.type === "earning" ? "border-green-500/30 bg-green-500/8 text-green-400" :
                        tx.type === "withdrawal" ? "border-red-500/30 bg-red-500/8 text-red-400" :
                        "border-white/10 text-white/30"
                      }`}>
                        {tx.type === "earning" ? "▼" : tx.type === "withdrawal" ? "▲" : "○"}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-semibold text-white/70 capitalize">{tx.type}</div>
                        <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                          {tx.description || new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold font-mono ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} TZS
                      </div>
                      <div className={`text-[9px] font-mono uppercase tracking-wider ${
                        tx.status === "completed" ? "text-green-400/50" : tx.status === "pending" ? "text-yellow-400/50" : "text-white/20"
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-md mx-4 border border-white/15 bg-neutral-950 overflow-hidden">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/50" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/50" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">WALLET.WITHDRAW</div>
                  <h3 className="text-base font-bold font-mono text-white tracking-tight">Withdraw Earnings</h3>
                </div>
                <button onClick={() => setShowWithdrawModal(false)} className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all font-mono">×</button>
              </div>
              {withdrawSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-4 border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 font-mono text-xl">✓</div>
                  <p className="text-sm font-mono text-green-400">{withdrawSuccess}</p>
                  <button onClick={() => setShowWithdrawModal(false)} className="mt-5 inline-flex h-9 items-center px-6 border border-white/15 text-[10px] font-mono text-white/50 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all">Done</button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-center">
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Available balance</p>
                    <p className="text-xl font-bold font-mono text-amber-400">{(wallet?.balance || 0).toLocaleString()} TZS</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Amount (TZS)</label>
                    <Input type="number" placeholder="5,000" min={5000} max={wallet?.balance || 0} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm rounded-none focus:border-amber-500/50" />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">Min: 5,000 TZS</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Mobile Money Number</label>
                    <Input type="tel" placeholder="0712345678" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm rounded-none focus:border-amber-500/50" />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">M-Pesa, Airtel Money, Mixx by Yas, or HaloPesa</p>
                  </div>
                  {withdrawError && <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">{withdrawError}</div>}
                  <button type="submit" disabled={withdrawLoading || !withdrawAmount || !withdrawPhone} className="w-full h-10 inline-flex items-center justify-center bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {withdrawLoading ? "Processing..." : `Withdraw ${withdrawAmount ? `${parseInt(withdrawAmount).toLocaleString()} TZS` : ""}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

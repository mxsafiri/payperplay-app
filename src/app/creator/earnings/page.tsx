"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Banknote,
  Phone,
  TrendingUp,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  PiggyBank,
} from "lucide-react";

interface WalletData {
  wallet: {
    id: string;
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
    totalFees: number;
    ntzsBalance: number | null;
    ntzsWalletAddress: string | null;
  };
  transactions: {
    id: string;
    type: string;
    status: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }[];
}

interface StatsData {
  totalContent: number;
  publishedContent: number;
  totalViews: number;
  totalEarnings: number;
}

export default function EarningsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "earning" | "withdrawal">("all");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) fetchData();
  }, [session, isPending, router]);

  const fetchData = async () => {
    try {
      const [walletRes, statsRes] = await Promise.all([
        fetch("/api/creator/wallet"),
        fetch("/api/creator/stats"),
      ]);
      if (walletRes.ok) setWalletData(await walletRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");
    setWithdrawLoading(true);

    try {
      const res = await fetch("/api/creator/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(withdrawAmount), phoneNumber: withdrawPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || "Withdrawal failed");
        setWithdrawLoading(false);
        return;
      }
      setWithdrawSuccess(`${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}!`);
      setWithdrawAmount("");
      setWithdrawPhone("");
      fetchData();
    } catch {
      setWithdrawError("An unexpected error occurred");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading earnings...</p>
        </div>
      </div>
    );
  }

  const wallet = walletData?.wallet;
  const transactions = walletData?.transactions || [];
  const filteredTx = txFilter === "all"
    ? transactions
    : transactions.filter((tx) => tx.type === txFilter);

  const earningsTx = transactions.filter((tx) => tx.type === "earning");
  const withdrawalTx = transactions.filter((tx) => tx.type === "withdrawal");
  const platformFees = wallet?.totalFees || 0;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Earnings</h1>
              <p className="text-sm text-muted-foreground">Your revenue and withdrawal history</p>
            </div>
            <Button
              onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }}
              disabled={!wallet || wallet.balance < 1000}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Banknote className="w-4 h-4 mr-1" />
              Withdraw
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Balance */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md p-4 sm:p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">Available</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
                {(wallet?.balance || 0).toLocaleString()}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">TZS</span>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md p-4 sm:p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">Total Earned</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {(wallet?.totalEarned || 0).toLocaleString()}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">TZS</span>
              </div>
            </div>
          </div>

          {/* Total Withdrawn */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md p-4 sm:p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">Withdrawn</span>
                <ArrowUpFromLine className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {(wallet?.totalWithdrawn || 0).toLocaleString()}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">TZS</span>
              </div>
            </div>
          </div>

          {/* Platform Fees */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-4 sm:p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">Platform Fees</span>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-muted-foreground">
                {platformFees.toLocaleString()}
                <span className="text-[10px] sm:text-xs font-normal ml-1">TZS</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1">15% commission</p>
            </div>
          </div>
        </div>

        {/* nTZS On-Chain Balance */}
        {wallet?.ntzsBalance !== null && wallet?.ntzsBalance !== undefined && (
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 backdrop-blur-md p-5">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">nTZS On-Chain Balance</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[300px]">{wallet?.ntzsWalletAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-purple-400">{wallet.ntzsBalance.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">TZS</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold">Transaction History</h2>
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                {(["all", "earning", "withdrawal"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      txFilter === filter ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "earning" ? "Earnings" : "Withdrawals"}
                    <span className="ml-1 text-[10px] opacity-60">
                      {filter === "all" ? transactions.length : filter === "earning" ? earningsTx.length : withdrawalTx.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {txFilter === "all" ? "Earnings will appear when fans purchase your content" : `No ${txFilter}s found`}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === "earning" ? "bg-green-500/15 text-green-400" :
                        tx.type === "withdrawal" ? "bg-blue-500/15 text-blue-400" :
                        "bg-neutral-500/15 text-neutral-400"
                      }`}>
                        {tx.type === "earning" ? <ArrowDownToLine className="w-4 h-4" /> :
                         tx.type === "withdrawal" ? <ArrowUpFromLine className="w-4 h-4" /> :
                         <Coins className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium capitalize">{tx.type}</div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{tx.description || "—"}</span>
                          <span>·</span>
                          <span>{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} TZS
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <span className={`inline-flex items-center gap-0.5 ${tx.status === "completed" ? "text-green-400/60" : tx.status === "pending" ? "text-yellow-400/60" : "text-muted-foreground/40"}`}>
                          {tx.status === "completed" ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                          {tx.status}
                        </span>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Withdraw to M-Pesa</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {withdrawSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-green-400 font-medium">{withdrawSuccess}</p>
                  <Button onClick={() => setShowWithdrawModal(false)} className="mt-6 bg-white/10 hover:bg-white/15 text-foreground">Done</Button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-xs text-muted-foreground">Available balance</p>
                    <p className="text-xl font-bold text-amber-400">{(wallet?.balance || 0).toLocaleString()} TZS</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Amount (TZS)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="number" placeholder="5,000" min={5000} max={wallet?.balance || 0} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required className="pl-10 bg-white/5 border-white/10 focus:border-amber-500/50" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Min: 5,000 TZS</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">M-Pesa Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="tel" placeholder="0712345678" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} required className="pl-10 bg-white/5 border-white/10 focus:border-amber-500/50" />
                    </div>
                  </div>
                  {withdrawError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{withdrawError}</div>}
                  <Button type="submit" disabled={withdrawLoading || !withdrawAmount || !withdrawPhone} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50">
                    {withdrawLoading ? (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</div>
                    ) : (
                      <><Banknote className="w-4 h-4 mr-1.5" />Withdraw {withdrawAmount ? `${parseInt(withdrawAmount).toLocaleString()} TZS` : ""}</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

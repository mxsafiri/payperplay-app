"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

interface CreatorStats {
  totalContent: number;
  publishedContent: number;
  totalEarnings: number;
  totalViews: number;
}

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

interface MediaItem {
  id: string;
  mediaType: string;
  url: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priceTzs: number;
  viewCount: number;
  createdAt: string;
  media?: MediaItem[];
}

const NAV_ITEMS = [
  { href: "/creator/dashboard", label: "Dashboard", short: "DASH" },
  { href: "/creator/content/new", label: "Create Content", short: "CREATE" },
  { href: "/creator/playlists", label: "Playlists", short: "LISTS" },
  { href: "/creator/profile", label: "Profile", short: "PROFILE" },
];

const MAX_VISIBLE_TX = 5;

export default function CreatorDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [showAllTx, setShowAllTx] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) fetchDashboardData();
  }, [session, isPending, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, contentRes, walletRes] = await Promise.all([
        fetch("/api/creator/stats"),
        fetch("/api/creator/content?limit=5"),
        fetch("/api/creator/wallet"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (contentRes.ok) { const d = await contentRes.json(); setRecentContent(d.content || []); }
      if (walletRes.ok) setWalletData(await walletRes.json());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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
      if (!res.ok) { setWithdrawError(data.error || "Withdrawal failed"); setWithdrawLoading(false); return; }
      setWithdrawSuccess(`Withdrawal of ${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}. Check your phone!`);
      setWithdrawAmount(""); setWithdrawPhone("");
      fetchDashboardData();
    } catch { setWithdrawError("An unexpected error occurred"); }
    finally { setWithdrawLoading(false); }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-1 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.DASHBOARD</p>
        </div>
      </div>
    );
  }

  const visibleTx = showAllTx
    ? walletData?.transactions || []
    : (walletData?.transactions || []).slice(0, MAX_VISIBLE_TX);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-amber-500/3 blur-[120px] pointer-events-none" />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 z-40 flex-col border-r border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-mono font-black text-sm">▶</span>
            </div>
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase italic -skew-x-6 inline-block">PayPerPlay</span>
          </Link>
        </div>

        {/* Status */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Creator.Studio</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-widest transition-all border-l-2 ${
                  isActive
                    ? "border-amber-500 text-amber-400 bg-amber-500/5"
                    : "border-transparent text-white/40 hover:text-white hover:border-white/20 hover:bg-white/3"
                }`}
              >
                {isActive && <span className="text-amber-500">◈</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            href="/feed"
            className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all border-l-2 border-transparent hover:border-white/20"
          >
            Fan View →
          </Link>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        <div className="flex items-stretch h-16">
          {[
            { href: "/creator/dashboard", label: "DASH" },
            { href: "/creator/playlists", label: "LISTS" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center text-[9px] font-mono font-semibold uppercase tracking-wider transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + "/") ? "text-amber-400" : "text-white/30"
              }`}
            >{item.label}</Link>
          ))}
          {/* Center FAB */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/creator/content/new"
              className="w-11 h-11 bg-amber-500 flex items-center justify-center -mt-3 transition-all hover:bg-amber-400 active:scale-95"
            >
              <span className="text-black font-mono font-black text-lg">+</span>
            </Link>
          </div>
          {[
            { href: "/creator/profile", label: "PROFILE" },
            { href: "/feed", label: "FAN" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center text-[9px] font-mono font-semibold uppercase tracking-wider transition-colors ${
                pathname === item.href ? "text-amber-400" : "text-white/30"
              }`}
            >{item.label}</Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:ml-56">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-px w-4 bg-amber-500/40" />
                  <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">Creator.Dashboard</span>
                </div>
                <h1 className="text-lg font-bold font-mono tracking-tight text-white">Overview</h1>
              </div>
              <Link
                href="/creator/content/new"
                className="inline-flex h-8 items-center px-4 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                + Create
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { index: "01", label: "Total Content", value: stats?.totalContent || 0 },
              { index: "02", label: "Published", value: stats?.publishedContent || 0 },
              { index: "03", label: "Total Views", value: stats?.totalViews || 0 },
              { index: "04", label: "Total Earnings", value: stats?.totalEarnings || 0, suffix: "TZS" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative border border-white/10 bg-neutral-950 p-4 hover:border-amber-500/20 transition-colors group"
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.index}</div>
                <div className="text-2xl font-bold font-mono tracking-tight text-white">
                  {stat.value.toLocaleString()}
                  {stat.suffix && <span className="text-xs font-normal text-white/30 ml-1">{stat.suffix}</span>}
                </div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Content */}
          <div className="border border-white/10 bg-neutral-950 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/30" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">CONTENT.RECENT</div>
                  <h2 className="text-sm font-semibold font-mono tracking-tight text-white">Recent Content</h2>
                </div>
                <Link
                  href="/creator/content"
                  className="text-[10px] font-mono text-white/30 uppercase tracking-widest hover:text-amber-400 transition-colors"
                >
                  View All →
                </Link>
              </div>

              {recentContent.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-2">NO.CONTENT</p>
                  <p className="font-mono text-sm text-white/40 mb-4">Start creating exclusive content for your fans</p>
                  <Link
                    href="/creator/content/new"
                    className="inline-flex h-8 items-center px-5 bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                  >
                    Create First Content
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentContent.map((item) => {
                    const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-4 p-3 border border-white/5 hover:border-amber-500/20 bg-white/[0.01] hover:bg-amber-500/3 transition-all cursor-pointer"
                        onClick={() => router.push(`/content/${item.id}`)}
                      >
                        <div className="relative w-12 h-12 overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
                          {thumb ? (
                            <Image src={thumb} alt={item.title} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 font-mono text-lg">▶</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono font-medium text-xs text-white/70 truncate group-hover:text-white transition-colors">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-white/30 uppercase tracking-wider">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span>{item.viewCount} views</span>
                            <span>·</span>
                            <span className="text-amber-500/70">{item.priceTzs === 0 ? "Free" : `${item.priceTzs} TZS`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`hidden sm:inline px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                            item.status === "published"
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                          }`}>{item.status}</span>
                          <Link
                            href={`/creator/content/${item.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all font-mono text-xs"
                          >✎</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Wallet + Transactions */}
          {walletData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Balance Card */}
              <div className="lg:col-span-1 border border-amber-500/20 bg-amber-500/3 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
                <div className="p-5">
                  <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-1">WALLET.BALANCE</div>
                  <div className="text-3xl font-bold font-mono tracking-tight text-white mb-0.5">
                    {walletData.wallet.balance.toLocaleString()}
                    <span className="text-sm font-normal text-white/30 ml-1.5">TZS</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[9px] font-mono uppercase tracking-wider">
                    <div className="flex items-center gap-1 text-green-400/70">
                      <span>▼</span>
                      <span>{walletData.wallet.totalEarned.toLocaleString()} earned</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400/70">
                      <span>▲</span>
                      <span>{walletData.wallet.totalWithdrawn.toLocaleString()} withdrawn</span>
                    </div>
                  </div>
                  {walletData.wallet.ntzsBalance !== null && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider">
                        <span className="text-white/30">nTZS On-chain</span>
                        <span className="text-amber-400">{walletData.wallet.ntzsBalance.toLocaleString()} TZS</span>
                      </div>
                      {walletData.wallet.ntzsWalletAddress && (
                        <p className="text-[8px] text-white/20 font-mono truncate mt-1">
                          {walletData.wallet.ntzsWalletAddress}
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }}
                    disabled={walletData.wallet.balance < 1000}
                    className="mt-4 w-full h-9 inline-flex items-center justify-center border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Withdraw Earnings
                  </button>
                </div>
              </div>

              {/* Transactions */}
              <div className="lg:col-span-2 border border-white/10 bg-neutral-950 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">TX.RECENT</div>
                      <h3 className="text-sm font-semibold font-mono text-white">Recent Transactions</h3>
                    </div>
                    {walletData.transactions.length > MAX_VISIBLE_TX && (
                      <button
                        onClick={() => setShowAllTx(!showAllTx)}
                        className="text-[10px] font-mono text-white/30 uppercase tracking-widest hover:text-amber-400 transition-colors"
                      >
                        {showAllTx ? "Show Less" : `All (${walletData.transactions.length})`}
                      </button>
                    )}
                  </div>
                  {walletData.transactions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/5">
                      <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">NO.TRANSACTIONS</p>
                      <p className="text-xs font-mono text-white/30 mt-1">Earnings appear when fans purchase your content</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {visibleTx.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-2.5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono ${
                              tx.type === "earning" ? "border-green-500/30 bg-green-500/10 text-green-400" :
                              tx.type === "withdrawal" ? "border-red-500/30 bg-red-500/10 text-red-400" :
                              "border-white/10 text-white/30"
                            }`}>
                              {tx.type === "earning" ? "▼" : tx.type === "withdrawal" ? "▲" : "○"}
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-white/70 capitalize">{tx.type}</div>
                              <div className="text-[9px] font-mono text-white/30 truncate max-w-[180px] uppercase tracking-wider">
                                {tx.description || new Date(tx.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-sm font-bold font-mono whitespace-nowrap ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} TZS
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all font-mono"
                >×</button>
              </div>

              {withdrawSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-4 border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 font-mono text-xl">✓</div>
                  <p className="text-sm font-mono text-green-400">{withdrawSuccess}</p>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="mt-5 inline-flex h-9 items-center px-6 border border-white/15 text-[10px] font-mono text-white/60 uppercase tracking-widest hover:border-white/30 hover:text-white transition-all"
                  >Done</button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Amount (TZS)</label>
                    <Input
                      type="number"
                      placeholder="5,000"
                      min={5000}
                      max={walletData?.wallet.balance || 0}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm rounded-none focus:border-amber-500/50"
                    />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">
                      Available: {walletData?.wallet.balance.toLocaleString()} TZS · Min: 5,000 TZS
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Mobile Money Number</label>
                    <Input
                      type="tel"
                      placeholder="0712345678"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm rounded-none focus:border-amber-500/50"
                    />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-wider">M-Pesa, Airtel Money, Mixx by Yas, or HaloPesa</p>
                  </div>

                  {withdrawError && (
                    <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-mono">
                      {withdrawError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={withdrawLoading || !withdrawAmount || !withdrawPhone}
                    className="w-full h-10 inline-flex items-center justify-center bg-amber-500 text-[10px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawLoading ? "Processing..." : `Withdraw ${withdrawAmount ? `${parseInt(withdrawAmount).toLocaleString()} TZS` : ""}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Rocket,
  Eye,
  Coins,
  Film,
  Plus,
  Pencil,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Phone,
  Banknote,
  ExternalLink,
  X,
  Share2,
  BarChart3,
} from "lucide-react";

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

export default function CreatorDashboard() {
  const router = useRouter();
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
      if (contentRes.ok) {
        const data = await contentRes.json();
        setRecentContent(data.content || []);
      }
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
        body: JSON.stringify({
          amount: parseInt(withdrawAmount),
          phoneNumber: withdrawPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || "Withdrawal failed");
        setWithdrawLoading(false);
        return;
      }
      setWithdrawSuccess(
        `Withdrawal of ${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}!`
      );
      setWithdrawAmount("");
      setWithdrawPhone("");
      fetchDashboardData();
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
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {greeting}, {session?.user?.name?.split(" ")[0] || "Creator"} 👋
              </h1>
              <p className="text-sm text-muted-foreground">Here&apos;s how your content is performing</p>
            </div>
            <Link href="/creator/content/new" className="hidden sm:block">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Content", value: stats?.totalContent || 0, icon: Package, iconColor: "text-blue-400", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20", link: "/creator/content" },
            { label: "Published", value: stats?.publishedContent || 0, icon: Rocket, iconColor: "text-green-400", gradient: "from-green-500/10 to-emerald-500/10", border: "border-green-500/20", link: "/creator/content" },
            { label: "Total Views", value: stats?.totalViews || 0, icon: Eye, iconColor: "text-purple-400", gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20", link: "/creator/analytics" },
            { label: "Earnings", value: stats?.totalEarnings || 0, icon: Coins, iconColor: "text-amber-400", gradient: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20", suffix: "TZS", link: "/creator/earnings" },
          ].map((stat) => (
            <Link key={stat.label} href={stat.link}>
              <div className={`group relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {stat.value.toLocaleString()}
                    {stat.suffix && <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">{stat.suffix}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column: Content + Wallet */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Recent Content — 3/5 */}
          <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold tracking-tight">Recent Content</h2>
                <Link href="/creator/content">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8">View All →</Button>
                </Link>
              </div>

              {recentContent.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Film className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">No content yet</h3>
                  <p className="text-xs text-muted-foreground mb-3">Upload your first video to start earning</p>
                  <Link href="/creator/content/new">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs">Create Your First Content</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentContent.map((item) => {
                    const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
                        onClick={() => router.push(`/creator/content/${item.id}/edit`)}
                      >
                        <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                          {thumb ? (
                            <Image src={thumb} alt={item.title} fill className="object-cover" sizes="64px" />
                          ) : (
                            <Film className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>{item.status}</span>
                            <span>{item.viewCount} views</span>
                            <span className="text-amber-500 font-medium">{item.priceTzs === 0 ? "Free" : `${item.priceTzs.toLocaleString()} TZS`}</span>
                          </div>
                        </div>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Wallet + Quick Actions — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            {walletData && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-muted-foreground">Wallet Balance</span>
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    {walletData.wallet.balance.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">TZS</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    <div className="flex items-center gap-1 text-green-400">
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>{walletData.wallet.totalEarned.toLocaleString()} earned</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <ArrowUpFromLine className="w-3 h-3" />
                      <span>{walletData.wallet.totalWithdrawn.toLocaleString()} withdrawn</span>
                    </div>
                  </div>
                  {walletData.wallet.ntzsBalance !== null && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">nTZS on-chain</span>
                        <span className="text-amber-400 font-semibold">{walletData.wallet.ntzsBalance.toLocaleString()} TZS</span>
                      </div>
                    </div>
                  )}
                  <Button onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }} disabled={walletData.wallet.balance < 1000} className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 text-xs" size="sm">
                    <Banknote className="w-3.5 h-3.5 mr-1" />
                    Withdraw to M-Pesa
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50 p-5">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <div className="relative">
                <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-1.5">
                  {[
                    { label: "Create New Content", href: "/creator/content/new", icon: Plus, color: "text-amber-400" },
                    { label: "View Analytics", href: "/creator/analytics", icon: BarChart3, color: "text-purple-400" },
                    { label: "Manage Playlists", href: "/creator/playlists", icon: Film, color: "text-blue-400" },
                    { label: "Share & Earn Links", href: "/creator/share-earn", icon: Share2, color: "text-green-400" },
                  ].map((action) => (
                    <Link key={action.href} href={action.href} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/5 transition-all group">
                      <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center ${action.color}`}>
                        <action.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {walletData && walletData.transactions.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50 p-5">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Recent Transactions</h3>
                    <Link href="/creator/earnings" className="text-[10px] text-muted-foreground hover:text-foreground">See all →</Link>
                  </div>
                  <div className="space-y-1">
                    {walletData.transactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${tx.type === "earning" ? "bg-green-500/15 text-green-400" : tx.type === "withdrawal" ? "bg-red-500/15 text-red-400" : "bg-neutral-500/15 text-neutral-400"}`}>
                            {tx.type === "earning" ? <ArrowDownToLine className="w-3 h-3" /> : tx.type === "withdrawal" ? <ArrowUpFromLine className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className="text-xs font-medium capitalize">{tx.type}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{tx.description || new Date(tx.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} TZS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold">Withdraw Earnings</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {withdrawSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                    <ArrowUpFromLine className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-green-400 font-medium">{withdrawSuccess}</p>
                  <Button onClick={() => setShowWithdrawModal(false)} className="mt-6 bg-white/10 hover:bg-white/15 text-foreground">Done</Button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Amount (TZS)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="number" placeholder="5,000" min={5000} max={walletData?.wallet.balance || 0} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required className="pl-10 bg-white/5 border-white/10 focus:border-amber-500/50" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Available: {walletData?.wallet.balance.toLocaleString()} TZS · Min: 5,000 TZS</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Mobile Money Number</label>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Package, Rocket, Eye, Coins, Film, Plus, Pencil, Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, X, Phone, Banknote, User, LayoutDashboard, ListVideo, Menu, ChevronRight } from "lucide-react";
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
  { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/creator/content/new", label: "Create Content", icon: Plus },
  { href: "/creator/playlists", label: "Playlists", icon: ListVideo },
  { href: "/creator/profile", label: "Profile", icon: User },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      fetchDashboardData();
    }
  }, [session, isPending, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, contentRes, walletRes] = await Promise.all([
        fetch("/api/creator/stats"),
        fetch("/api/creator/content?limit=5"),
        fetch("/api/creator/wallet"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setRecentContent(contentData.content || []);
      }

      if (walletRes.ok) {
        const walletJson = await walletRes.json();
        setWalletData(walletJson);
      }
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
        `Withdrawal of ${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}. Check your phone!`
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const visibleTx = showAllTx
    ? walletData?.transactions || []
    : (walletData?.transactions || []).slice(0, MAX_VISIBLE_TX);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 z-40 flex-col border-r border-white/10 backdrop-blur-xl bg-background/80">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PayPerPlay</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2">
            <ThemeSwitch />
            <span className="text-xs text-muted-foreground">Theme</span>
          </div>
          <Link href="/feed" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Eye className="w-4.5 h-4.5" />
            View as Fan
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-white/10 backdrop-blur-xl bg-background/95">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">PayPerPlay</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <Link href="/feed" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Eye className="w-4.5 h-4.5" />
                View as Fan
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main content area — offset for sidebar on desktop */}
      <div className="lg:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Overview of your content and earnings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="lg:hidden"><ThemeSwitch /></div>
                <Link href="/creator/content/new">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Content", value: stats?.totalContent || 0, icon: Package, iconColor: "text-blue-400", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
              { label: "Published", value: stats?.publishedContent || 0, icon: Rocket, iconColor: "text-green-400", gradient: "from-green-500/10 to-emerald-500/10", border: "border-green-500/20" },
              { label: "Total Views", value: stats?.totalViews || 0, icon: Eye, iconColor: "text-purple-400", gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20" },
              { label: "Total Earnings", value: stats?.totalEarnings || 0, icon: Coins, iconColor: "text-amber-400", gradient: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20", suffix: "TZS" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`group relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-md p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {stat.value.toLocaleString()}
                    {stat.suffix && (
                      <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">{stat.suffix}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Content — FIRST */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold tracking-tight">Recent Content</h2>
                <Link href="/creator/content">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
                    View All →
                  </Button>
                </Link>
              </div>

              {recentContent.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Film className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-semibold mb-1">No content yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                    Start creating exclusive content for your fans
                  </p>
                  <Link href="/creator/content/new">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                      Create Your First Content
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentContent.map((item) => {
                    const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                    return (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 hover:border-white/10 cursor-pointer"
                        onClick={() => router.push(`/content/${item.id}`)}
                      >
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                          {thumb ? (
                            <Image src={thumb} alt={item.title} fill className="object-cover" sizes="56px" />
                          ) : (
                            <Film className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="relative flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-white/5">{item.category}</span>
                            <span>{item.viewCount} views</span>
                            <span className="text-amber-500 font-medium">{item.priceTzs === 0 ? "Free" : `${item.priceTzs} TZS`}</span>
                          </div>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <span
                            className={`hidden sm:inline px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "published"
                                ? "bg-green-500/15 text-green-400"
                                : "bg-yellow-500/15 text-yellow-400"
                            }`}
                          >
                            {item.status}
                          </span>
                          <Link href={`/creator/content/${item.id}/edit`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Wallet + Transactions — SECOND */}
          {walletData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Balance Card */}
              <div className="lg:col-span-1 relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium text-muted-foreground">Wallet Balance</span>
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    {walletData.wallet.balance.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">TZS</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-1 text-green-400">
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>{walletData.wallet.totalEarned.toLocaleString()} earned</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <ArrowUpFromLine className="w-3 h-3" />
                      <span>{walletData.wallet.totalWithdrawn.toLocaleString()} withdrawn</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }}
                    disabled={walletData.wallet.balance < 1000}
                    className="mt-5 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Banknote className="w-4 h-4 mr-1.5" />
                    Withdraw
                  </Button>
                </div>
              </div>

              {/* Recent Transactions — limited */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold tracking-tight">Recent Transactions</h3>
                    {walletData.transactions.length > MAX_VISIBLE_TX && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllTx(!showAllTx)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showAllTx ? "Show Less" : `View All (${walletData.transactions.length})`}
                      </Button>
                    )}
                  </div>
                  {walletData.transactions.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Earnings appear when fans purchase your content</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {visibleTx.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              tx.type === "earning" ? "bg-green-500/15 text-green-400" :
                              tx.type === "withdrawal" ? "bg-red-500/15 text-red-400" :
                              "bg-neutral-500/15 text-neutral-400"
                            }`}>
                              {tx.type === "earning" ? <ArrowDownToLine className="w-3.5 h-3.5" /> :
                               tx.type === "withdrawal" ? <ArrowUpFromLine className="w-3.5 h-3.5" /> :
                               <Coins className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium capitalize">{tx.type}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {tx.description || new Date(tx.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-sm font-semibold whitespace-nowrap ${
                            tx.amount > 0 ? "text-green-400" : "text-red-400"
                          }`}>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight">Withdraw Earnings</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {withdrawSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                    <ArrowUpFromLine className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-green-400 font-medium">{withdrawSuccess}</p>
                  <Button
                    onClick={() => setShowWithdrawModal(false)}
                    className="mt-6 bg-white/10 hover:bg-white/15 text-foreground"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Amount (TZS)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="5,000"
                        min={5000}
                        max={walletData?.wallet.balance || 0}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                        className="pl-10 bg-white/5 border-white/10 focus:border-amber-500/50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {walletData?.wallet.balance.toLocaleString()} TZS · Min: 5,000 TZS
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Mobile Money Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="0712345678"
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                        required
                        className="pl-10 bg-white/5 border-white/10 focus:border-amber-500/50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">M-Pesa, Airtel Money, Mixx by Yas, or HaloPesa</p>
                  </div>

                  {withdrawError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                      {withdrawError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={withdrawLoading || !withdrawAmount || !withdrawPhone}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {withdrawLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 mr-1.5" />
                        Withdraw {withdrawAmount ? `${parseInt(withdrawAmount).toLocaleString()} TZS` : ""}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

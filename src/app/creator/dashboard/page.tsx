"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WalletData {
  wallet: {
    balance: number;
    totalEarned: number;
    totalWithdrawn: number;
    ntzsBalance: number | null;
    ntzsWalletAddress: string | null;
  };
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    createdAt: string;
  }[];
}

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priceTzs: number;
  viewCount: number;
  media?: { mediaType: string; url: string | null }[];
}

interface PayLink {
  id: string;
  slug: string;
  priceTzs: number;
  purchaseCount: number;
  isActive: boolean;
  createdAt: string;
  content: { id: string; title: string };
}

// ── Quick Link Modal ──────────────────────────────────────────────────────────

function QuickLinkModal({
  content,
  onClose,
  onCreated,
}: {
  content: ContentItem;
  onClose: () => void;
  onCreated: (link: PayLink) => void;
}) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState<{ slug: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const SUGGESTED = [200, 500, 1000, 2000, 5000];

  const handleCreate = async () => {
    const priceTzs = parseInt(price);
    if (!priceTzs || priceTzs < 100) { setError("Minimum price is 100 TZS"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/view-once", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id, priceTzs, teaserSeconds: 10 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create link"); return; }
      setCreatedLink({ slug: data.link.slug, url: data.link.url });
      onCreated({
        id: data.link.id,
        slug: data.link.slug,
        priceTzs,
        purchaseCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        content: { id: content.id, title: content.title },
      });
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const copy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!createdLink) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Watch "${content.title}" exclusively on PayPerPlay — pay with M-Pesa, no account needed.\n\n${createdLink.url}`)}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 border border-border bg-background overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/60" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/60" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/60" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">
                SHARE & EARN
              </div>
              <h3 className="text-sm font-bold font-mono text-foreground tracking-tight">
                {createdLink ? "Your Pay Link is Ready" : "Generate Pay Link"}
              </h3>
              <p className="text-[10px] font-mono text-foreground/40 mt-0.5 truncate max-w-[260px]">
                {content.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center border border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-all font-mono text-base"
            >×</button>
          </div>

          {createdLink ? (
            /* ── Success state ── */
            <div className="space-y-4">
              {/* Link display */}
              <div className="border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-1.5">
                  YOUR PAY LINK
                </div>
                <p className="text-[11px] font-mono text-amber-400 break-all leading-relaxed">
                  {createdLink.url}
                </p>
              </div>

              {/* Copy */}
              <button
                onClick={copy}
                className={`w-full h-10 inline-flex items-center justify-center text-[11px] font-mono font-bold uppercase tracking-widest transition-all ${
                  copied
                    ? "bg-green-500 text-black"
                    : "bg-amber-500 hover:bg-amber-400 text-black"
                }`}
              >
                {copied ? "✓ COPIED!" : "COPY LINK"}
              </button>

              {/* Share shortcuts */}
              <div>
                <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest mb-2">
                  QUICK SHARE
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareWhatsApp}
                    className="h-9 border border-border text-[10px] font-mono text-foreground/50 hover:text-foreground hover:border-foreground/25 transition-all uppercase tracking-widest"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdLink.url);
                      window.open("https://www.tiktok.com", "_blank");
                    }}
                    className="h-9 border border-border text-[10px] font-mono text-foreground/50 hover:text-foreground hover:border-foreground/25 transition-all uppercase tracking-widest"
                  >
                    TikTok / IG
                  </button>
                </div>
              </div>

              <p className="text-[9px] font-mono text-foreground/25 text-center leading-relaxed">
                Fans pay with M-Pesa — no PayPerPlay account needed
              </p>
            </div>
          ) : (
            /* ── Create state ── */
            <div className="space-y-4">
              {/* Price input */}
              <div>
                <label className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest block mb-1.5">
                  Set Your Price (TZS)
                </label>
                <Input
                  type="number"
                  placeholder="500"
                  min={100}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-foreground/30 font-mono text-sm rounded-none focus:border-amber-500/50"
                />
                {/* Suggested prices */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[9px] font-mono text-foreground/25 uppercase tracking-wider">Suggested:</span>
                  {SUGGESTED.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrice(String(p))}
                      className={`px-2 py-0.5 text-[9px] font-mono border transition-colors ${
                        price === String(p)
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                          : "border-border text-foreground/30 hover:border-foreground/25 hover:text-foreground/60"
                      }`}
                    >
                      {p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-2.5 border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-mono">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={loading || !price}
                className="w-full h-10 inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-[11px] font-mono font-bold text-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate Pay Link →"}
              </button>

              <p className="text-[9px] font-mono text-foreground/25 text-center leading-relaxed">
                Share this link on TikTok, Instagram, WhatsApp — fans pay with M-Pesa, no account needed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function CreatorDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [payLinks, setPayLinks] = useState<PayLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  // Pay link modal
  const [linkModalContent, setLinkModalContent] = useState<ContentItem | null>(null);

  // UI state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showAllTx, setShowAllTx] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchAll();
  }, [session, isPending, router]);

  const fetchAll = async () => {
    try {
      const [contentRes, walletRes, linksRes] = await Promise.all([
        fetch("/api/creator/content?limit=10"),
        fetch("/api/creator/wallet"),
        fetch("/api/creator/view-once-links"),
      ]);
      if (contentRes.ok) { const d = await contentRes.json(); setContent(d.content || []); }
      if (walletRes.ok) setWalletData(await walletRes.json());
      if (linksRes.ok) { const d = await linksRes.json(); setPayLinks(d.links || []); }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(""); setWithdrawSuccess(""); setWithdrawLoading(true);
    try {
      const res = await fetch("/api/creator/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(withdrawAmount), phoneNumber: withdrawPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawError(data.error || "Withdrawal failed"); return; }
      setWithdrawSuccess(`${parseInt(withdrawAmount).toLocaleString()} TZS sent to ${withdrawPhone}`);
      setWithdrawAmount(""); setWithdrawPhone("");
      fetchAll();
    } catch { setWithdrawError("An unexpected error occurred"); }
    finally { setWithdrawLoading(false); }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/v/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
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

  // Derived data
  const publishedContent = content.filter((c) => c.status === "published");
  const linkedContentIds = new Set(payLinks.map((l) => l.content.id));
  const topLinks = [...payLinks]
    .sort((a, b) => b.purchaseCount * b.priceTzs - a.purchaseCount * a.priceTzs)
    .slice(0, 5);
  const totalLinkRevenue = payLinks.reduce((s, l) => s + l.purchaseCount * l.priceTzs, 0);
  const totalLinkSales = payLinks.reduce((s, l) => s + l.purchaseCount, 0);
  const visibleTx = showAllTx
    ? walletData?.transactions || []
    : (walletData?.transactions || []).slice(0, 4);

  // Share & Earn section state
  const hasNoContent = publishedContent.length === 0;
  const hasContentNoLinks = publishedContent.length > 0 && payLinks.length === 0;
  const hasLinks = payLinks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid opacity-20 pointer-events-none" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10 space-y-5">

        {/* ── Page title ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-px w-4 bg-amber-500/40" />
              <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Dashboard</span>
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">Overview</h1>
          </div>
          <Link
            href="/creator/content/new"
            className="inline-flex h-8 items-center px-4 bg-amber-500 hover:bg-amber-400 text-[10px] font-mono font-bold text-black uppercase tracking-widest transition-colors"
          >
            + Create
          </Link>
        </div>

        {/* ── Wallet Strip ─────────────────────────────────────────── */}
        {walletData && (
          <div className="border border-amber-500/25 bg-amber-500/[0.04] relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/50" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/50" />
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Balance */}
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">WALLET.BALANCE</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
                    {walletData.wallet.balance.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-foreground/30">TZS</span>
                </div>
              </div>
              {/* Earned / Withdrawn */}
              <div className="flex items-center gap-5 text-[10px] font-mono uppercase tracking-wider">
                <div>
                  <span className="text-foreground/25 block">Earned</span>
                  <span className="text-green-500 font-semibold">+{walletData.wallet.totalEarned.toLocaleString()} TZS</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <span className="text-foreground/25 block">Withdrawn</span>
                  <span className="text-foreground/50 font-semibold">{walletData.wallet.totalWithdrawn.toLocaleString()} TZS</span>
                </div>
                {walletData.wallet.ntzsBalance !== null && (
                  <>
                    <div className="w-px h-6 bg-border" />
                    <div>
                      <span className="text-foreground/25 block">nTZS On-chain</span>
                      <span className="text-amber-500 font-semibold">{walletData.wallet.ntzsBalance.toLocaleString()} TZS</span>
                    </div>
                  </>
                )}
              </div>
              {/* Withdraw button */}
              <button
                onClick={() => { setShowWithdrawModal(true); setWithdrawError(""); setWithdrawSuccess(""); }}
                disabled={walletData.wallet.balance < 1000}
                className="flex-shrink-0 h-9 px-5 border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Withdraw →
              </button>
            </div>
          </div>
        )}

        {/* ── Share & Earn — the hero section ──────────────────────── */}
        <div className="border border-border bg-card relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />

          {/* ── State 1: No published content ── */}
          {hasNoContent && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-mono font-bold">◈</div>
                <span className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">SHARE & EARN — YOUR #1 TOOL</span>
              </div>

              <h2 className="text-base font-bold font-mono text-foreground mb-2 leading-snug">
                This is how you get paid on PayPerPlay
              </h2>
              <p className="text-[11px] font-mono text-foreground/50 leading-relaxed mb-6 max-w-xl">
                You don't wait for the platform to grow. You bring your own audience. Upload a video,
                generate a pay link, and post it on TikTok, Instagram, WhatsApp — wherever your fans
                already are. They pay with M-Pesa. No PayPerPlay account needed.
              </p>

              {/* Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
                {[
                  { n: "01", title: "Upload your content", desc: "Any video, music, or exclusive content you create" },
                  { n: "02", title: "Generate a pay link", desc: "Set your price and get a shareable link in seconds" },
                  { n: "03", title: "Share & get paid", desc: "Post on TikTok, WhatsApp, Instagram — fans pay via M-Pesa" },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-3 p-3 border border-border bg-muted/40">
                    <div className="w-7 h-7 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-500 text-[10px] font-mono font-bold flex-shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-semibold text-foreground/80">{s.title}</p>
                      <p className="text-[9px] font-mono text-foreground/40 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/creator/content/new"
                className="inline-flex h-9 items-center px-5 bg-amber-500 hover:bg-amber-400 text-[10px] font-mono font-bold text-black uppercase tracking-widest transition-colors"
              >
                Upload Your First Content →
              </Link>
            </div>
          )}

          {/* ── State 2: Has published content, zero pay links ── */}
          {hasContentNoLinks && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-mono font-bold">◈</div>
                <span className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">SHARE & EARN — START HERE</span>
              </div>

              <h2 className="text-base font-bold font-mono text-foreground mb-1.5">
                You have content — now generate pay links to earn
              </h2>
              <p className="text-[11px] font-mono text-foreground/50 mb-5 leading-relaxed max-w-xl">
                A pay link lets anyone pay to watch your content — directly from a link you share on
                social media. Set a price, copy the link, post it anywhere. No PayPerPlay account needed
                to pay.
              </p>

              <div className="space-y-1.5">
                {publishedContent.slice(0, 5).map((item) => {
                  const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-border bg-muted/30 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                    >
                      <div className="w-9 h-9 flex-shrink-0 bg-muted border border-border overflow-hidden">
                        {thumb ? (
                          <Image src={thumb} alt={item.title} width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20 font-mono text-sm">▶</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-semibold text-foreground/70 truncate">{item.title}</p>
                        <p className="text-[9px] font-mono text-foreground/30 uppercase tracking-wider">{item.category}</p>
                      </div>
                      <button
                        onClick={() => setLinkModalContent(item)}
                        className="flex-shrink-0 h-7 px-3 bg-amber-500 hover:bg-amber-400 text-[9px] font-mono font-bold text-black uppercase tracking-widest transition-colors"
                      >
                        Get Pay Link →
                      </button>
                    </div>
                  );
                })}
              </div>

              {publishedContent.length > 5 && (
                <p className="text-[9px] font-mono text-foreground/30 mt-2 uppercase tracking-wider">
                  + {publishedContent.length - 5} more — <Link href="/creator/content" className="text-amber-500/70 hover:text-amber-500">view all</Link>
                </p>
              )}
            </div>
          )}

          {/* ── State 3: Has pay links — show performance ── */}
          {hasLinks && (
            <div className="p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-mono font-bold">◈</div>
                  <div>
                    <span className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest block">SHARE & EARN</span>
                    <span className="text-sm font-bold font-mono text-foreground">Your Pay Links</span>
                  </div>
                </div>
                <Link
                  href="/creator/share-earn"
                  className="text-[9px] font-mono text-foreground/30 uppercase tracking-widest hover:text-amber-500 transition-colors"
                >
                  View All ({payLinks.length}) →
                </Link>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Active Links", value: payLinks.filter((l) => l.isActive).length },
                  { label: "Total Sales", value: totalLinkSales },
                  { label: "Link Revenue", value: `${totalLinkRevenue.toLocaleString()} TZS` },
                ].map((s) => (
                  <div key={s.label} className="border border-border bg-muted/30 p-3 text-center">
                    <div className="text-base font-bold font-mono text-amber-500">{s.value}</div>
                    <div className="text-[9px] font-mono text-foreground/30 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Top links */}
              <div className="space-y-1.5 mb-4">
                {topLinks.map((link, i) => {
                  const earned = link.purchaseCount * link.priceTzs;
                  return (
                    <div key={link.id} className="flex items-center gap-3 p-3 border border-border bg-muted/20 hover:border-border hover:bg-muted/40 transition-colors group">
                      <div className="text-[9px] font-mono text-foreground/20 w-4 flex-shrink-0">#{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono font-semibold text-foreground/70 truncate group-hover:text-foreground transition-colors">
                          {link.content.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-foreground/30 uppercase tracking-wider">
                          <span className="text-amber-500">{link.priceTzs.toLocaleString()} TZS</span>
                          <span>·</span>
                          <span>{link.purchaseCount} paid</span>
                          {earned > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-green-500">+{earned.toLocaleString()} earned</span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyLink(link.slug)}
                          className={`h-7 px-3 text-[9px] font-mono font-bold uppercase tracking-widest transition-all border ${
                            copiedSlug === link.slug
                              ? "border-green-500/40 bg-green-500/10 text-green-600"
                              : "border-border text-foreground/40 hover:border-amber-500/40 hover:text-amber-500 hover:bg-amber-500/5"
                          }`}
                        >
                          {copiedSlug === link.slug ? "✓" : "Copy"}
                        </button>
                        <button
                          onClick={() => window.open(`/v/${link.slug}`, "_blank")}
                          className="h-7 px-2 border border-border text-[10px] font-mono text-foreground/30 hover:border-foreground/25 hover:text-foreground transition-all"
                          title="Preview link"
                        >↗</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create another link */}
              {publishedContent.some((c) => !linkedContentIds.has(c.id)) && (
                <div className="border border-dashed border-border p-3">
                  <p className="text-[10px] font-mono text-foreground/40 mb-2">
                    {publishedContent.filter((c) => !linkedContentIds.has(c.id)).length} content{" "}
                    item{publishedContent.filter((c) => !linkedContentIds.has(c.id)).length > 1 ? "s" : ""}{" "}
                    without a pay link yet
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {publishedContent
                      .filter((c) => !linkedContentIds.has(c.id))
                      .slice(0, 3)
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setLinkModalContent(item)}
                          className="h-7 px-3 border border-border text-[9px] font-mono text-foreground/40 hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5 transition-all uppercase tracking-wider truncate max-w-[160px]"
                        >
                          + {item.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Recent Content ────────────────────────────────────────── */}
        <div className="border border-border bg-card relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/10" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest mb-0.5">CONTENT.RECENT</div>
                <h2 className="text-sm font-semibold font-mono text-foreground">Your Content</h2>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/creator/content" className="text-[9px] font-mono text-foreground/30 uppercase tracking-widest hover:text-amber-500 transition-colors">
                  View All →
                </Link>
              </div>
            </div>

            {content.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border">
                <p className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest mb-1">NO.CONTENT.YET</p>
                <p className="text-xs font-mono text-foreground/40 mb-4">Upload your first video or audio to start earning</p>
                <Link
                  href="/creator/content/new"
                  className="inline-flex h-8 items-center px-5 bg-amber-500 hover:bg-amber-400 text-[10px] font-mono font-bold text-black uppercase tracking-widest transition-colors"
                >
                  Create Content
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {content.map((item) => {
                  const thumb = item.media?.find((m) => m.mediaType === "thumbnail")?.url;
                  const hasLink = linkedContentIds.has(item.id);
                  const itemLinks = payLinks.filter((l) => l.content.id === item.id);
                  const itemEarned = itemLinks.reduce((s, l) => s + l.purchaseCount * l.priceTzs, 0);

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2.5 border border-border/50 hover:border-border bg-foreground/[0.01] hover:bg-foreground/[0.03] transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-10 h-10 flex-shrink-0 bg-muted border border-border overflow-hidden">
                        {thumb ? (
                          <Image src={thumb} alt={item.title} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20 font-mono">▶</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-medium text-xs text-foreground/65 truncate group-hover:text-foreground/90 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-foreground/30 uppercase tracking-wider">
                          <span className="truncate">{item.category}</span>
                          <span>·</span>
                          <span className={`flex-shrink-0 ${item.status === "published" ? "text-green-500/80" : "text-yellow-500/80"}`}>
                            {item.status}
                          </span>
                        </div>
                        {itemEarned > 0 && (
                          <p className="text-[9px] font-mono text-green-500 mt-0.5">+{itemEarned.toLocaleString()} TZS</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.status === "published" ? (
                          hasLink ? (
                            <button
                              onClick={() => {
                                const link = itemLinks[0];
                                if (link) copyLink(link.slug);
                              }}
                              className={`h-7 px-2.5 text-[9px] font-mono font-semibold uppercase tracking-widest border transition-all ${
                                itemLinks[0] && copiedSlug === itemLinks[0].slug
                                  ? "border-green-500/40 bg-green-500/10 text-green-600"
                                  : "border-amber-500/30 bg-amber-500/8 text-amber-600 hover:bg-amber-500/15 hover:border-amber-500/50"
                              }`}
                            >
                              {itemLinks[0] && copiedSlug === itemLinks[0].slug ? "✓ Copied" : "Copy Link"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setLinkModalContent(item)}
                              className="h-7 px-2.5 text-[9px] font-mono font-semibold uppercase tracking-widest border border-border text-foreground/40 hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5 transition-all"
                            >
                              + Pay Link
                            </button>
                          )
                        ) : (
                          <span className="text-[9px] font-mono text-foreground/20 uppercase tracking-wider px-2">Draft</span>
                        )}
                        <Link
                          href={`/creator/content/${item.id}/edit`}
                          className="w-7 h-7 flex items-center justify-center border border-border/60 text-foreground/30 hover:text-foreground/60 hover:border-border transition-all font-mono text-xs"
                        >✎</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Transactions ─────────────────────────────────────────── */}
        {walletData && walletData.transactions.length > 0 && (
          <div className="border border-border/60 bg-card relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/10" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[9px] font-mono text-foreground/20 uppercase tracking-widest mb-0.5">TX.HISTORY</div>
                  <h3 className="text-sm font-semibold font-mono text-foreground/70">Transactions</h3>
                </div>
                {walletData.transactions.length > 4 && (
                  <button
                    onClick={() => setShowAllTx(!showAllTx)}
                    className="text-[9px] font-mono text-foreground/30 uppercase tracking-widest hover:text-amber-500 transition-colors"
                  >
                    {showAllTx ? "Show Less" : `All (${walletData.transactions.length})`}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {visibleTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 border border-border/50 hover:border-border transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 flex items-center justify-center border text-[9px] font-mono ${
                        tx.type === "earning" ? "border-green-500/25 bg-green-500/8 text-green-600" :
                        tx.type === "withdrawal" ? "border-red-500/25 bg-red-500/8 text-red-500" :
                        "border-border text-foreground/25"
                      }`}>
                        {tx.type === "earning" ? "▼" : tx.type === "withdrawal" ? "▲" : "○"}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-semibold text-foreground/60 capitalize">{tx.type}</div>
                        <div className="text-[9px] font-mono text-foreground/30 truncate max-w-[180px] uppercase tracking-wider">
                          {tx.description || new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold font-mono ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} TZS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Pay Link Modal ───────────────────────────────────────── */}
      {linkModalContent && (
        <QuickLinkModal
          content={linkModalContent}
          onClose={() => setLinkModalContent(null)}
          onCreated={(newLink) => {
            setPayLinks((prev) => [newLink, ...prev]);
            // Don't close — let them copy the link first
          }}
        />
      )}

      {/* ── Withdraw Modal ───────────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-md mx-4 border border-border bg-background overflow-hidden">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/50" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/50" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mb-0.5">WALLET.WITHDRAW</div>
                  <h3 className="text-base font-bold font-mono text-foreground tracking-tight">Withdraw Earnings</h3>
                </div>
                <button onClick={() => setShowWithdrawModal(false)} className="w-7 h-7 flex items-center justify-center border border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-all font-mono text-base">×</button>
              </div>

              {withdrawSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-4 border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-600 font-mono text-xl">✓</div>
                  <p className="text-sm font-mono text-green-600">{withdrawSuccess}</p>
                  <p className="text-[10px] font-mono text-foreground/30 mt-1">Check your phone for the M-Pesa prompt</p>
                  <button onClick={() => setShowWithdrawModal(false)} className="mt-5 inline-flex h-9 items-center px-6 border border-border text-[10px] font-mono text-foreground/60 uppercase tracking-widest hover:border-foreground/30 hover:text-foreground transition-all">Done</button>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Amount (TZS)</label>
                    <Input type="number" placeholder="5,000" min={5000} max={walletData?.wallet.balance || 0} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required className="bg-muted border-border text-foreground placeholder:text-foreground/30 font-mono text-sm rounded-none focus:border-amber-500/50" />
                    <p className="text-[9px] font-mono text-foreground/25 uppercase tracking-wider">Available: {walletData?.wallet.balance.toLocaleString()} TZS · Min: 5,000 TZS</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Mobile Money Number</label>
                    <Input type="tel" placeholder="0712345678" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} required className="bg-muted border-border text-foreground placeholder:text-foreground/30 font-mono text-sm rounded-none focus:border-amber-500/50" />
                    <p className="text-[9px] font-mono text-foreground/25 uppercase tracking-wider">M-Pesa, Airtel Money, Mixx by Yas, or HaloPesa</p>
                  </div>
                  {withdrawError && <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-mono">{withdrawError}</div>}
                  <button type="submit" disabled={withdrawLoading || !withdrawAmount || !withdrawPhone} className="w-full h-10 inline-flex items-center justify-center bg-amber-500 text-[10px] font-mono font-bold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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

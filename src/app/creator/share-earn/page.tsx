"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Share2,
  Link2,
  Copy,
  ExternalLink,
  Coins,
  Clock,
  CheckCircle,
  Film,
  Users,
} from "lucide-react";

interface ViewOnceLink {
  id: string;
  slug: string;
  priceTzs: number;
  teaserDurationSec: number;
  isActive: boolean;
  maxPurchases: number | null;
  purchaseCount: number;
  expiresAt: string | null;
  createdAt: string;
  content: { id: string; title: string };
}

export default function ShareEarnPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [links, setLinks] = useState<ViewOnceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) fetchLinks();
  }, [session, isPending, router]);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/creator/view-once-links");
      if (res.ok) { const data = await res.json(); setLinks(data.links || []); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/watch/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 border border-amber-500/30 animate-spin" />
            <div className="absolute inset-2 border border-amber-500/20 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">LOADING.LINKS</p>
        </div>
      </div>
    );
  }

  const totalPurchases = links.reduce((sum, l) => sum + l.purchaseCount, 0);
  const totalRevenue = links.reduce((sum, l) => sum + l.purchaseCount * l.priceTzs, 0);
  const activeLinks = links.filter((l) => l.isActive);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-neutral-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-px w-4 bg-amber-500/40" />
            <span className="text-[9px] font-mono text-amber-500/50 tracking-widest uppercase">Creator.Studio</span>
          </div>
          <h1 className="text-lg font-bold font-mono tracking-tight text-white">Share & Earn</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { index: "01", label: "Active Links", value: activeLinks.length, icon: Link2, color: "text-amber-400" },
            { index: "02", label: "Purchases", value: totalPurchases, icon: Users, color: "text-white" },
            { index: "03", label: "Revenue (TZS)", value: totalRevenue.toLocaleString(), icon: Coins, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/10 bg-neutral-950 p-4 relative group hover:border-amber-500/20 transition-colors">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.index}</div>
              <div className="flex items-start justify-between">
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <stat.icon className="w-4 h-4 text-amber-400/50 mt-1" />
              </div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">HOW.IT.WORKS</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "01", title: "Create a link", desc: "Go to any content's edit page and create a view-once link", icon: Link2 },
                { step: "02", title: "Share anywhere", desc: "Send via WhatsApp, social media, or DMs", icon: Share2 },
                { step: "03", title: "Get paid", desc: "Fans pay with M-Pesa — no account needed", icon: Coins },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400 text-[10px] font-mono font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-[11px] font-mono font-semibold text-white/80">{item.title}</p>
                    <p className="text-[10px] font-mono text-white/30 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Links list */}
        <div className="border border-white/10 bg-neutral-950 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20" />
          <div className="p-5">
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-4">YOUR.LINKS</div>

            {links.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10">
                <div className="w-12 h-12 mx-auto mb-4 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-amber-400/60" />
                </div>
                <p className="text-[11px] font-mono text-white/40 mb-1">NO.VIEW-ONCE.LINKS.YET</p>
                <p className="text-[10px] font-mono text-white/20 mb-4">Create from any content&apos;s edit page</p>
                <button
                  onClick={() => router.push("/creator/content")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors"
                >
                  <Film className="w-3.5 h-3.5" />
                  Go to Content
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[12px] font-mono font-semibold text-white/80 truncate">{link.content.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-white/30 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-400" />
                            {link.priceTzs.toLocaleString()} TZS
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {link.purchaseCount} purchases
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {link.teaserDurationSec}s teaser
                          </span>
                          {link.maxPurchases && (
                            <span>Limit: {link.purchaseCount}/{link.maxPurchases}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 truncate max-w-[200px]">
                            /watch/{link.slug}
                          </code>
                          <span className={`inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${
                            link.isActive
                              ? "border-green-500/30 text-green-400 bg-green-500/5"
                              : "border-red-500/30 text-red-400 bg-red-500/5"
                          }`}>
                            {link.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => copyLink(link.slug)}
                          className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 hover:bg-white/5 transition-all"
                          title="Copy link"
                        >
                          {copiedSlug === link.slug ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-white/40" />
                          )}
                        </button>
                        <button
                          onClick={() => window.open(`/watch/${link.slug}`, "_blank")}
                          className="w-8 h-8 border border-white/10 flex items-center justify-center hover:border-white/25 hover:bg-white/5 transition-all"
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

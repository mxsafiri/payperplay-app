"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Link2,
  Copy,
  ExternalLink,
  Eye,
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
  content: {
    id: string;
    title: string;
  };
}

export default function ShareEarnPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [links, setLinks] = useState<ViewOnceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) fetchLinks();
  }, [session, isPending, router]);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/creator/view-once-links");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/watch/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading links...</p>
        </div>
      </div>
    );
  }

  const totalPurchases = links.reduce((sum, l) => sum + l.purchaseCount, 0);
  const totalRevenue = links.reduce((sum, l) => sum + (l.purchaseCount * l.priceTzs), 0);
  const activeLinks = links.filter((l) => l.isActive);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Share & Earn</h1>
              <p className="text-sm text-muted-foreground">View-once links for sharing content anywhere</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground">Active Links</span>
                <Link2 className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold">{activeLinks.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground">Purchases</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground">Revenue</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">TZS</span></div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50 p-5">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative">
            <h2 className="text-sm font-semibold mb-3">How View-Once Links Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Create a link", desc: "Go to any content's edit page and create a view-once link", icon: Link2 },
                { step: "2", title: "Share anywhere", desc: "Send the link via WhatsApp, social media, or DMs", icon: Share2 },
                { step: "3", title: "Get paid", desc: "Fans pay with M-Pesa — no account needed", icon: Coins },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Links list */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-card/50">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative p-5">
            <h2 className="text-base font-semibold mb-4">Your Links</h2>

            {links.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">No view-once links yet</h3>
                <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">
                  Create your first view-once link from any content&apos;s edit page
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/creator/content")}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                >
                  <Film className="w-3.5 h-3.5 mr-1" />
                  Go to Content
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium truncate">{link.content.title}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
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
                            <span className="flex items-center gap-1">
                              Limit: {link.purchaseCount}/{link.maxPurchases}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-[10px] text-muted-foreground/60 bg-white/5 px-2 py-1 rounded font-mono truncate max-w-[200px]">
                            /watch/{link.slug}
                          </code>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            link.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                          }`}>
                            {link.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => copyLink(link.slug)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                          title="Copy link"
                        >
                          {copiedSlug === link.slug ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => window.open(`/watch/${link.slug}`, "_blank")}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
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

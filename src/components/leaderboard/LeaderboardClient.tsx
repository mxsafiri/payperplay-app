"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Container } from "@/components/dashboard/Container";

type Creator = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number | string | null;
};

type RisingCreator = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  thisMonth: number;
  lastMonth: number;
  growthPct: number | null;
};

type Props = {
  topEarners: Creator[];
  topByViews: Creator[];
  topByFollowers: Creator[];
  topRising: RisingCreator[];
};

type TabId = "earners" | "views" | "followers" | "rising";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "earners",   label: "Top Earners",   short: "EARNERS" },
  { id: "views",     label: "Most Watched",  short: "VIEWS" },
  { id: "followers", label: "Most Followed", short: "FOLLOWERS" },
  { id: "rising",    label: "Rising Star",   short: "RISING" },
];

const PRIZES = [
  {
    rank: "01",
    label: "TOP EARNER",
    amount: "100,000 TZS",
    borderClass: "border-amber-500/40",
    accentClass: "text-amber-400",
    bgClass: "bg-amber-500/5",
    qualify: "Highest total TZS earned in the calendar month",
  },
  {
    rank: "02",
    label: "RISING STAR",
    amount: "50,000 TZS",
    borderClass: "border-amber-500/25",
    accentClass: "text-amber-500",
    bgClass: "bg-amber-500/3",
    qualify: "Highest % earnings growth vs previous month (min 5,000 TZS this month)",
  },
  {
    rank: "03",
    label: "MOST CONSISTENT",
    amount: "30,000 TZS",
    borderClass: "border-white/15",
    accentClass: "text-white/60",
    bgClass: "bg-white/3",
    qualify: "Highest total plays across all weeks of the month",
  },
];

function formatScore(score: number | string | null, tab: Exclude<TabId, "rising">): string {
  const n = Number(score) || 0;
  if (tab === "earners") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TZS`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K TZS`;
    return `${n} TZS`;
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

function formatTzs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TZS`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K TZS`;
  return `${n} TZS`;
}

function scoreLabel(tab: Exclude<TabId, "rising">): string {
  if (tab === "earners") return "earned";
  if (tab === "views") return "views";
  return "followers";
}

function getInitials(name: string | null, handle: string): string {
  return (name || handle).slice(0, 2).toUpperCase();
}

function isHttpUrl(url: string | null): url is string {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

function Avatar({ creator }: { creator: { handle: string; displayName: string | null; avatarUrl: string | null } }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden bg-amber-500/10 border border-white/10">
      {isHttpUrl(creator.avatarUrl) ? (
        <Image src={creator.avatarUrl} alt={creator.handle} fill className="object-cover" sizes="40px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-mono font-bold text-amber-400">
          {getInitials(creator.displayName, creator.handle)}
        </div>
      )}
    </div>
  );
}

export function LeaderboardClient({ topEarners, topByViews, topByFollowers, topRising }: Props) {
  const [activeTab, setActiveTab] = React.useState<TabId>("earners");
  const [tabKey, setTabKey] = React.useState(0);

  const [heroRef, heroVisible] = useScrollReveal(0.05);
  const [rankingsRef, rankingsVisible] = useScrollReveal(0.05);

  function switchTab(id: TabId) {
    setActiveTab(id);
    setTabKey((k) => k + 1);
  }

  const isRising = activeTab === "rising";
  const creators: Creator[] =
    activeTab === "earners" ? topEarners :
    activeTab === "views" ? topByViews :
    activeTab === "followers" ? topByFollowers : [];

  return (
    <>
      {/* Hero */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        className="relative overflow-hidden py-20 bg-neutral-950 border-b border-white/5"
      >
        <div className="absolute inset-0 tech-grid opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/6 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-amber-500/30" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-amber-500/30" />

        <Container className="relative">
          <div className="text-center mb-12">
            <div
              className={`flex items-center justify-center gap-3 mb-4 ${heroVisible ? "anim-fade-up" : "reveal-hidden"}`}
            >
              <div className="h-px w-8 bg-amber-500/40" />
              <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
                RANKINGS
              </span>
              <div className="h-px w-8 bg-amber-500/40" />
            </div>
            <h1
              className={`text-4xl font-bold font-mono tracking-tight text-white sm:text-5xl ${
                heroVisible ? "anim-fade-up" : "reveal-hidden"
              }`}
              style={{ animationDelay: "80ms" }}
            >
              Creator Leaderboard
            </h1>
            <p
              className={`mt-3 text-sm font-mono text-white/40 tracking-wider ${
                heroVisible ? "anim-fade-up" : "reveal-hidden"
              }`}
              style={{ animationDelay: "160ms" }}
            >
              TANZANIA'S TOP CREATORS · EARNING REAL MONEY · EVERY MONTH
            </p>
          </div>

          {/* Prize cards */}
          <div className="grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
            {PRIZES.map((prize, i) => (
              <div
                key={prize.rank}
                className={`group relative overflow-hidden border ${prize.borderClass} ${prize.bgClass} p-5 transition-all hover:border-amber-500/40 ${
                  heroVisible ? "anim-scale-in" : "reveal-hidden"
                }`}
                style={{ animationDelay: `${240 + i * 100}ms` }}
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center">
                  <div className={`text-[9px] font-mono tracking-widest uppercase ${prize.accentClass} opacity-60 mb-1`}>
                    #{prize.rank}
                  </div>
                  <div className={`text-xs font-mono font-semibold ${prize.accentClass} tracking-widest uppercase`}>
                    {prize.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">{prize.amount}</div>
                  <div className="mt-0.5 text-[9px] font-mono text-white/30 uppercase tracking-widest">Monthly Cash Prize</div>
                </div>
                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="text-[9px] font-mono font-semibold text-white/30 uppercase tracking-widest mb-2">How to qualify</p>
                  <p className="text-[10px] font-mono text-white/40 leading-relaxed">
                    ✓ {prize.qualify}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`mt-5 text-center text-[10px] font-mono text-white/25 uppercase tracking-widest ${
              heroVisible ? "anim-fade-up" : "reveal-hidden"
            }`}
            style={{ animationDelay: "560ms" }}
          >
            Winners announced on the 1st of each month. Start posting to compete.
          </p>
        </Container>
      </section>

      {/* Rankings */}
      <section
        ref={rankingsRef as React.RefObject<HTMLElement>}
        className="py-12 bg-neutral-950"
      >
        <Container>
          {/* Tabs */}
          <div
            className={`flex gap-1.5 overflow-x-auto pb-2 mb-8 ${rankingsVisible ? "anim-fade-up" : "reveal-hidden"}`}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-widest transition-all border ${
                  activeTab === tab.id
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-white/15 text-white/40 hover:border-amber-500/40 hover:text-white bg-transparent"
                }`}
              >
                {tab.short}
              </button>
            ))}
          </div>

          {/* Rising Star tab */}
          {isRising ? (
            topRising.length === 0 ? (
              <EmptyState />
            ) : (
              <div key={tabKey} className="space-y-2">
                {topRising.map((creator, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const growthLabel = creator.growthPct !== null ? `+${creator.growthPct.toFixed(0)}%` : "NEW";
                  return (
                    <div
                      key={creator.id}
                      className={`group flex items-center gap-4 border p-4 transition-all anim-slide-left ${
                        isTop3
                          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                          : "border-white/10 bg-transparent hover:border-white/20"
                      }`}
                      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                    >
                      <div className="w-10 flex-shrink-0 text-[11px] font-mono font-bold text-white/40 text-center">
                        #{String(rank).padStart(2, '0')}
                      </div>
                      <Avatar creator={creator} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-semibold text-sm text-white truncate">
                          {creator.displayName || creator.handle}
                        </div>
                        <div className="text-[10px] font-mono text-white/30">@{creator.handle}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold font-mono text-base text-amber-400">{growthLabel}</div>
                        <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                          {formatTzs(creator.thisMonth)} this month
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : creators.length === 0 ? (
            <EmptyState />
          ) : (
            <div key={tabKey} className="space-y-2">
              {creators.map((creator, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                return (
                  <div
                    key={creator.id}
                    className={`group flex items-center gap-4 border p-4 transition-all amber-glow-hover anim-slide-left ${
                      isTop3
                        ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                        : "border-white/10 bg-transparent hover:border-white/20"
                    }`}
                    style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                  >
                    <div className="w-10 flex-shrink-0 text-[11px] font-mono font-bold text-white/40 text-center">
                      #{String(rank).padStart(2, '0')}
                    </div>
                    <Avatar creator={creator} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm text-white truncate">
                        {creator.displayName || creator.handle}
                      </div>
                      <div className="text-[10px] font-mono text-white/30">@{creator.handle}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-bold font-mono text-base ${isTop3 ? "text-amber-400" : "text-white/80"}`}>
                        {formatScore(creator.score, activeTab as Exclude<TabId, "rising">)}
                      </div>
                      <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                        {scoreLabel(activeTab as Exclude<TabId, "rising">)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div
            className={`mt-10 border border-amber-500/20 bg-amber-500/5 p-8 text-center relative overflow-hidden ${
              rankingsVisible ? "anim-fade-up" : "reveal-hidden"
            }`}
            style={{ animationDelay: "300ms" }}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/40" />
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-8 bg-amber-500/30" />
              <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase">JOIN.THE.MOVEMENT</span>
              <div className="h-px w-8 bg-amber-500/30" />
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-white">Ready to compete?</h2>
            <p className="mt-2 text-xs font-mono text-white/40">
              Join thousands of creators already earning on PayPerPlay.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center bg-amber-500 px-7 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                Start Creating
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center border border-white/20 px-7 text-[11px] font-mono font-semibold text-white/60 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all"
              >
                Explore Content
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase mb-3">NO.DATA</div>
      <p className="font-mono font-medium text-white/50">No creators yet — be the first to top the board!</p>
      <Link
        href="/signup"
        className="mt-6 inline-flex h-10 items-center bg-amber-500 px-6 text-[11px] font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
      >
        Start Creating
      </Link>
    </div>
  );
}

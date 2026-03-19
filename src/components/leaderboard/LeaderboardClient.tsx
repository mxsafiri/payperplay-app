"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

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

const TABS: { id: TabId; label: string }[] = [
  { id: "earners", label: "Top Earners 💰" },
  { id: "views", label: "Most Watched 👁️" },
  { id: "followers", label: "Most Followed ❤️" },
  { id: "rising", label: "Rising Star 🚀" },
];

const PRIZES = [
  {
    rank: 1,
    emoji: "🥇",
    label: "Top Earner",
    amount: "100,000 TZS",
    bgClass: "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    textClass: "text-yellow-500",
    qualify: ["Highest total TZS earned in the calendar month"],
  },
  {
    rank: 2,
    emoji: "🚀",
    label: "Rising Star",
    amount: "50,000 TZS",
    bgClass: "bg-gradient-to-br from-primary-500/20 to-primary-500/5 border-primary-500/30",
    textClass: "text-primary-500",
    qualify: ["Highest % earnings growth vs previous month (minimum 5,000 TZS earned this month)"],
  },
  {
    rank: 3,
    emoji: "🎯",
    label: "Most Consistent",
    amount: "30,000 TZS",
    bgClass: "bg-gradient-to-br from-amber-700/20 to-amber-700/5 border-amber-700/30",
    textClass: "text-amber-600",
    qualify: ["Highest total plays across all weeks of the month"],
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
    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-primary-500/20">
      {isHttpUrl(creator.avatarUrl) ? (
        <Image
          src={creator.avatarUrl}
          alt={creator.handle}
          fill
          className="object-cover"
          sizes="48px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary-500">
          {getInitials(creator.displayName, creator.handle)}
        </div>
      )}
    </div>
  );
}

export function LeaderboardClient({ topEarners, topByViews, topByFollowers, topRising }: Props) {
  const [activeTab, setActiveTab] = React.useState<TabId>("earners");

  const isRising = activeTab === "rising";

  const creators: Creator[] =
    activeTab === "earners"
      ? topEarners
      : activeTab === "views"
      ? topByViews
      : activeTab === "followers"
      ? topByFollowers
      : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-b from-primary-500/10 via-transparent to-transparent">
        <Container>
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Creator Leaderboard
            </h1>
            <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
              Tanzania's top creators — earning real money, every month.
            </p>
          </div>

          {/* Prize cards */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {PRIZES.map((prize) => (
              <div
                key={prize.rank}
                className={`relative overflow-hidden rounded-2xl border p-6 ${prize.bgClass}`}
              >
                <div className="text-center">
                  <div className="text-4xl">{prize.emoji}</div>
                  <div className={`mt-3 text-sm font-semibold ${prize.textClass}`}>
                    {prize.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold">{prize.amount}</div>
                  <div className="mt-1 text-xs text-neutral-500">Monthly Cash Prize</div>
                </div>

                <div className="mt-4 border-t border-current/10 pt-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                    How to qualify
                  </p>
                  <ul className="space-y-1.5">
                    {prize.qualify.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="mt-0.5 flex-shrink-0">✓</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Winners announced on the 1st of each month. Start posting to compete!
          </p>
        </Container>
      </section>

      {/* Rankings */}
      <section className="py-12">
        <Container>
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rising Star tab */}
          {isRising ? (
            topRising.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {topRising.map((creator, index) => {
                  const rank = index + 1;
                  const rankDisplay =
                    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
                  const isTop3 = rank <= 3;
                  const growthLabel =
                    creator.growthPct !== null
                      ? `+${creator.growthPct.toFixed(0)}%`
                      : "New 🆕";

                  return (
                    <div
                      key={creator.id}
                      className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                        isTop3
                          ? "border-primary-500/20 bg-primary-500/5"
                          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50"
                      }`}
                    >
                      <div
                        className={`w-10 flex-shrink-0 text-center text-xl font-bold ${
                          isTop3 ? "" : "text-neutral-500"
                        }`}
                      >
                        {rankDisplay}
                      </div>

                      <Avatar creator={creator} />

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {creator.displayName || creator.handle}
                        </div>
                        <div className="text-sm text-neutral-500">@{creator.handle}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg text-primary-500">{growthLabel}</div>
                        <div className="text-xs text-neutral-500">
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
            <div className="space-y-3">
              {creators.map((creator, index) => {
                const rank = index + 1;
                const rankDisplay =
                  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={creator.id}
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                      isTop3
                        ? "border-primary-500/20 bg-primary-500/5"
                        : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50"
                    }`}
                  >
                    <div
                      className={`w-10 flex-shrink-0 text-center text-xl font-bold ${
                        isTop3 ? "" : "text-neutral-500"
                      }`}
                    >
                      {rankDisplay}
                    </div>

                    <Avatar creator={creator} />

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {creator.displayName || creator.handle}
                      </div>
                      <div className="text-sm text-neutral-500">@{creator.handle}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-lg">
                        {formatScore(creator.score, activeTab as Exclude<TabId, "rising">)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {scoreLabel(activeTab as Exclude<TabId, "rising">)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-12 rounded-2xl border border-primary-500/20 bg-primary-500/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to compete?</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Join thousands of creators already earning on PayPerPlay.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white hover:bg-primary-400"
              >
                Start Creating
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-6 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
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
    <div className="text-center py-20 text-neutral-500">
      <div className="text-5xl mb-4">🎬</div>
      <p className="text-lg font-medium">No creators yet — be the first to top the board!</p>
      <Link
        href="/signup"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white hover:bg-primary-400"
      >
        Start Creating
      </Link>
    </div>
  );
}

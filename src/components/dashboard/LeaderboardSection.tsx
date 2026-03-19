import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "./Container";

type Creator = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number | string | null;
};

function formatTzs(score: number | string | null): string {
  const n = Number(score) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M TZS`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K TZS`;
  return `${n} TZS`;
}

function getInitials(name: string | null, handle: string): string {
  return (name || handle).slice(0, 2).toUpperCase();
}

const RANK_STYLES = [
  {
    emoji: "🥇",
    bgClass: "bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/30",
    labelClass: "text-yellow-500",
    prize: "100K TZS",
  },
  {
    emoji: "🥈",
    bgClass: "bg-gradient-to-br from-neutral-400/20 to-transparent border-neutral-400/30",
    labelClass: "text-neutral-400",
    prize: "50K TZS",
  },
  {
    emoji: "🥉",
    bgClass: "bg-gradient-to-br from-amber-700/20 to-transparent border-amber-700/30",
    labelClass: "text-amber-600",
    prize: "30K TZS",
  },
];

export function LeaderboardSection({ topEarners }: { topEarners: Creator[] }) {
  const top3 = topEarners.slice(0, 3);

  return (
    <section className="py-16" id="community">
      <Container>
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-bold tracking-tight">Creator Leaderboard</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Top earners this month — winning real cash prizes.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-500 hover:text-primary-400 transition-colors"
          >
            See all rankings →
          </Link>
        </div>

        {/* Top 3 cards */}
        {top3.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {top3.map((creator, index) => {
              const style = RANK_STYLES[index];
              return (
                <div
                  key={creator.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 ${style.bgClass}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-primary-500/20">
                      {creator.avatarUrl?.startsWith("http") ? (
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
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">
                        {creator.displayName || creator.handle}
                      </div>
                      <div className="text-xs text-neutral-500">@{creator.handle}</div>
                    </div>
                    <div className="text-2xl">{style.emoji}</div>
                  </div>

                  <div className="text-2xl font-bold">{formatTzs(creator.score)}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">total earned</div>

                  <div className={`mt-3 text-xs font-semibold ${style.labelClass}`}>
                    Prize: {style.prize}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 p-10 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="font-medium">No top earners yet — be the first!</p>
            <Link
              href="/signup"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-400"
            >
              Start Creating
            </Link>
          </div>
        )}

        {/* Prize teaser banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5">
          <div className="text-center sm:text-left">
            <p className="font-semibold">Monthly prizes up for grabs 🎁</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Top Earner: 100K · Rising Star: 50K · Most Consistent: 30K
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/leaderboard"
              className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 transition-colors"
            >
              Full Leaderboard
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white hover:bg-primary-400 transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>

        {/* Mobile link */}
        <div className="mt-4 text-center sm:hidden">
          <Link href="/leaderboard" className="text-sm font-semibold text-primary-500">
            See all rankings →
          </Link>
        </div>
      </Container>
    </section>
  );
}

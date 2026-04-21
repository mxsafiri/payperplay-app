"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
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
    rank: "01",
    label: "GOLD",
    borderClass: "border-amber-500/40",
    accentClass: "text-amber-400",
    bgClass: "bg-amber-500/8",
    barClass: "bg-amber-500",
    prize: "100K TZS",
  },
  {
    rank: "02",
    label: "SILVER",
    borderClass: "border-neutral-400/30",
    accentClass: "text-neutral-300",
    bgClass: "bg-neutral-400/5",
    barClass: "bg-neutral-400",
    prize: "50K TZS",
  },
  {
    rank: "03",
    label: "BRONZE",
    borderClass: "border-amber-700/30",
    accentClass: "text-amber-600",
    bgClass: "bg-amber-700/5",
    barClass: "bg-amber-700",
    prize: "30K TZS",
  },
];

export function LeaderboardSection({ topEarners }: { topEarners: Creator[] }) {
  const [ref, visible] = useScrollReveal(0.1);
  const top3 = topEarners.slice(0, 3);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-16 bg-neutral-950"
      id="community"
    >
      <Container>
        {/* Section header */}
        <div
          className={`flex items-end justify-between mb-10 ${visible ? "anim-slide-left" : "reveal-hidden"}`}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 max-w-[32px] bg-amber-500/40" />
              <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
                LEADERBOARD
              </span>
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-white sm:text-3xl">
              Creator Rankings
            </h2>
            <p className="text-xs font-mono text-white/40 mt-1 tracking-wider">
              TOP EARNERS THIS MONTH · REAL CASH PRIZES
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-500 uppercase tracking-wider hover:text-amber-400 transition-colors"
          >
            ALL RANKINGS →
          </Link>
        </div>

        {/* Top 3 cards */}
        {top3.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {top3.map((creator, index) => {
              const style = RANK_STYLES[index];
              return (
                <div
                  key={creator.id}
                  className={`group relative overflow-hidden border ${style.borderClass} ${style.bgClass} p-5 transition-all hover:border-amber-500/50 amber-glow-hover ${
                    visible ? "anim-fade-up" : "reveal-hidden"
                  }`}
                  style={{ animationDelay: `${120 + index * 100}ms` }}
                >
                  {/* Rank label */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-mono font-bold ${style.accentClass} opacity-40`}>
                      #{style.rank}
                    </span>
                  </div>
                  <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${style.borderClass} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden bg-amber-500/10 border border-white/10">
                      {creator.avatarUrl?.startsWith("http") ? (
                        <Image
                          src={creator.avatarUrl}
                          alt={creator.handle}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center text-xs font-mono font-bold ${style.accentClass}`}>
                          {getInitials(creator.displayName, creator.handle)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold text-sm text-white truncate">
                        {creator.displayName || creator.handle}
                      </div>
                      <div className="text-[10px] font-mono text-white/30">@{creator.handle}</div>
                    </div>
                  </div>

                  <div className={`text-xl font-bold font-mono ${style.accentClass}`}>
                    {formatTzs(creator.score)}
                  </div>
                  <div className="text-[10px] font-mono text-white/30 mt-0.5 uppercase tracking-wider">total earned</div>

                  <div className="mt-3 h-px bg-white/5">
                    <div className={`h-px ${style.barClass} opacity-50`} style={{ width: `${100 - index * 25}%` }} />
                  </div>

                  <div className={`mt-3 text-[10px] font-mono font-semibold ${style.accentClass} uppercase tracking-wider`}>
                    PRIZE: {style.prize}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-white/10 p-10 text-center">
            <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">NO.DATA</p>
            <p className="font-mono font-medium text-white/60">No top earners yet — be the first!</p>
            <Link
              href="/signup"
              className="mt-4 inline-flex h-9 items-center bg-amber-500 px-5 text-xs font-mono font-semibold text-black uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Start Creating
            </Link>
          </div>
        )}

        {/* Prize teaser banner */}
        <div
          className={`mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-500/20 bg-amber-500/5 p-5 relative overflow-hidden ${
            visible ? "anim-fade-up" : "reveal-hidden"
          }`}
          style={{ animationDelay: "450ms" }}
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40" />
          <div className="text-center sm:text-left">
            <p className="font-mono font-semibold text-sm text-white tracking-wider">
              MONTHLY PRIZES UP FOR GRABS
            </p>
            <p className="text-[10px] font-mono text-white/40 tracking-wider mt-0.5 uppercase">
              Top Earner: 100K · Rising Star: 50K · Most Consistent: 30K
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/leaderboard"
              className="inline-flex h-9 items-center border border-white/20 px-4 text-[10px] font-mono font-semibold text-white/70 uppercase tracking-wider hover:border-amber-500/40 hover:text-white transition-all"
            >
              Leaderboard
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center bg-amber-500 px-4 text-[10px] font-mono font-semibold text-black uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Link href="/leaderboard" className="text-[11px] font-mono font-semibold text-amber-500 uppercase tracking-wider">
            All Rankings →
          </Link>
        </div>
      </Container>
    </section>
  );
}

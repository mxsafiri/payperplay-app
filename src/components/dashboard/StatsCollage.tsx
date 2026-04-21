"use client";

import * as React from "react";

import type { DashboardStat } from "@/data/dashboard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

import { Container } from "./Container";

export function StatsCollage({ stats }: { stats: DashboardStat[] }) {
  const [ref, visible] = useScrollReveal(0.2);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative -mt-8 z-10"
    >
      <Container>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`group relative overflow-hidden border border-white/10 bg-neutral-950/80 p-5 backdrop-blur-xl transition-all hover:border-amber-500/30 amber-glow-hover ${
                visible ? "anim-fade-up" : "reveal-hidden"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-pink-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-[9px] font-mono text-white/30 tracking-widest uppercase mb-1">
                    STAT_{String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {s.metric}
                  </div>
                  <div className="text-xs font-mono text-white/50 tracking-wider mt-0.5">
                    {s.label}
                  </div>
                </div>
                <div className="text-3xl leading-none opacity-60">{s.icon}</div>
              </div>

              {/* Bottom bar */}
              <div className="relative mt-3 h-px bg-white/5">
                <div className="h-px bg-gradient-to-r from-amber-500/40 to-transparent w-1/2 group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

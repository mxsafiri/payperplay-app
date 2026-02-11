import * as React from "react";

import type { DashboardStat } from "@/data/dashboard";

import { Container } from "./Container";

export function StatsCollage({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="relative -mt-10">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/70 p-5 backdrop-blur transition-colors dark:border-neutral-800 dark:bg-neutral-950/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold text-neutral-950 dark:text-white">
                    {s.metric}
                  </div>
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    {s.label}
                  </div>
                </div>
                <div className="text-2xl leading-none">{s.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

import * as React from "react";

import type { MonetizationFeature } from "@/data/dashboard";

import { Container } from "./Container";

function accentChip(accent: MonetizationFeature["accent"]) {
  return accent === "secondary"
    ? "bg-secondary-500/15 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-200"
    : "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200";
}

export function MonetizationSection({
  title,
  features,
}: {
  title: string;
  features: MonetizationFeature[];
}) {
  return (
    <section id="how-it-works" className="bg-neutral-50 py-16 dark:bg-neutral-950/40">
      <Container className="space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            Built for the modern content economy — monetize moments, reward
            creators, and keep the experience premium.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-neutral-950 dark:text-white">
                    {f.title}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    {f.description}
                  </div>
                </div>
                <div className={"flex h-12 w-12 items-center justify-center rounded-2xl text-xl " + accentChip(f.accent)}>
                  {f.icon}
                </div>
              </div>
              <div className="mt-6 h-10 rounded-2xl bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-transparent dark:from-primary-500/15 dark:via-secondary-500/15" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

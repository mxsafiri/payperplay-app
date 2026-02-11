import * as React from "react";
import Image from "next/image";

import { Container } from "./Container";
import { placeholderCreators } from "@/data/placeholder-creators";

export function FinalCTASection() {
  const displayCreators = placeholderCreators.slice(6, 14);

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/15 via-transparent to-secondary-500/15 dark:from-primary-500/25 dark:to-secondary-500/20" />

      <Container className="relative">
        {/* Creator Images Showcase */}
        <div className="mb-8 flex justify-center">
          <div className="flex -space-x-4">
            {displayCreators.map((creator) => (
              <div
                key={creator.id}
                className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white dark:border-neutral-950 shadow-lg hover:scale-110 transition-transform"
              >
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-8 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
                Don't Miss a Beat
              </h2>
              <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
                Join thousands of fans enjoying exclusive content from Tanzania's top creators.
                Sign up now and start playing in a creator-first economy.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <a
                id="get-started"
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white hover:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                Get Started
              </a>
              <a
                href="#start-playing"
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white/70 px-6 text-sm font-semibold text-neutral-900 backdrop-blur hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-100 dark:hover:bg-neutral-950"
              >
                Start Playing
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

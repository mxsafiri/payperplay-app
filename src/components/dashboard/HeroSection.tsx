import * as React from "react";
import Image from "next/image";

import { Container } from "./Container";
import { Pill } from "./Pill";
import { Typewriter } from "@/components/ui/typewriter";
import { placeholderCreators } from "@/data/placeholder-creators";

export function HeroSection() {
  const featuredCreators = placeholderCreators.slice(0, 6);

  return (
    <section className="relative overflow-hidden">
      <Image
        src="/BG.jpg"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-white/70 dark:bg-black/60" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60 dark:from-primary-500/20 dark:via-transparent dark:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 via-transparent to-secondary-500/10 dark:from-secondary-500/15" />

      <Container className="relative flex flex-col justify-center gap-10 py-16 lg:min-h-hero lg:py-24 lg:flex-row lg:items-center">
        <div className="max-w-2xl lg:flex-1">
          <div className="flex flex-wrap gap-2">
            <Pill>Creator-first</Pill>
            <Pill>Pay-per-play</Pill>
            <Pill>Premium discovery</Pill>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-6xl">
            <Typewriter
              text="Create, post and get-paid!"
              speed={70}
            />
          </h1>

          <p className="mt-4 max-w-xl text-base text-neutral-700 dark:text-neutral-300 sm:text-lg">
            Discover creators, pay per play, and turn every moment into a premium experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#get-started"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 hover:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              Play Content
            </a>
          </div>
        </div>

        {/* Featured Creators Grid */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-center">
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {featuredCreators.map((creator, index) => (
              <div
                key={creator.id}
                className="relative aspect-square overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg hover:scale-105 transition-transform"
                style={{
                  transform: index % 2 === 0 ? 'translateY(-10px)' : 'translateY(10px)',
                }}
              >
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-semibold text-white truncate">{creator.name}</p>
                  <p className="text-xs text-white/80">{creator.followers}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Container } from "./Container";
import { placeholderCreators } from "@/data/placeholder-creators";

export function FinalCTASection() {
  const [ref, visible] = useScrollReveal(0.1);
  const displayCreators = placeholderCreators.slice(6, 14);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative overflow-hidden py-16 bg-neutral-950 border-t border-white/5"
    >
      {/* Background */}
      <div className="absolute inset-0 tech-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-pink-500/6" />
      <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-amber-500/30" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-amber-500/30" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-amber-500/30" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-amber-500/30" />

      <Container className="relative">
        {/* Creator avatar stack */}
        <div className="mb-8 flex justify-center">
          <div className="flex -space-x-3">
            {displayCreators.map((creator, i) => (
              <div
                key={creator.id}
                className={`relative h-12 w-12 overflow-hidden border-2 border-neutral-950 hover:scale-110 transition-transform ${
                  visible ? "anim-scale-in" : "reveal-hidden"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main CTA block */}
        <div
          className={`relative border border-amber-500/20 bg-neutral-950/80 p-8 backdrop-blur sm:p-10 overflow-hidden ${
            visible ? "anim-fade-up" : "reveal-hidden"
          }`}
          style={{ animationDelay: "420ms" }}
        >
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500/50" />

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-amber-500/40" />
            <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
              JOIN.THE.MOVEMENT
            </span>
            <div className="flex-1 h-px bg-amber-500/10" />
          </div>

          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold font-mono tracking-tight text-white sm:text-3xl">
                Don't Miss a Beat
              </h2>
              <p className="max-w-xl text-xs font-mono text-white/40 sm:text-sm leading-relaxed">
                Join thousands of fans enjoying exclusive content from Tanzania's top creators.
                Sign up now and start playing in a creator-first economy.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <a
                id="get-started"
                href="/signup"
                className="group relative inline-flex h-11 items-center justify-center bg-amber-500 px-7 text-xs font-mono font-semibold text-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                Get Started →
              </a>
              <a
                href="#start-playing"
                className="inline-flex h-11 items-center justify-center border border-white/20 bg-transparent px-7 text-xs font-mono font-semibold text-white/70 uppercase tracking-widest hover:border-amber-500/40 hover:text-white transition-all"
              >
                Start Playing
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-8 opacity-30">
            <span className="text-[9px] font-mono text-white">∞</span>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-[9px] font-mono text-white/60">PAYPERPLAY.PROTOCOL</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

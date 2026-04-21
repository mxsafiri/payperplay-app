"use client";

import * as React from "react";

import type { MonetizationFeature } from "@/data/dashboard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Container } from "./Container";

function accentBar(accent: MonetizationFeature["accent"]) {
  return accent === "secondary" ? "bg-pink-500" : "bg-amber-500";
}
function accentText(accent: MonetizationFeature["accent"]) {
  return accent === "secondary" ? "text-pink-400" : "text-amber-400";
}

export function MonetizationSection({
  title,
  features,
}: {
  title: string;
  features: MonetizationFeature[];
}) {
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="how-it-works"
      className="bg-neutral-950/60 py-16 border-t border-white/5"
    >
      <Container className="space-y-10">
        {/* Header */}
        <div
          className={`space-y-3 text-center ${visible ? "anim-fade-up" : "reveal-hidden"}`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-8 bg-amber-500/40" />
            <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
              HOW IT WORKS
            </span>
            <div className="h-px w-8 bg-amber-500/40" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-xs font-mono text-white/40 sm:text-sm leading-relaxed">
            Built for the modern content economy — monetize moments, reward
            creators, and keep the experience premium.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden border border-white/10 bg-neutral-950 p-6 hover:border-amber-500/30 transition-all amber-glow-hover ${
                visible ? "anim-scale-in" : "reveal-hidden"
              }`}
              style={{ animationDelay: `${120 + i * 100}ms` }}
            >
              {/* Index label */}
              <div className="absolute top-3 right-3 text-[9px] font-mono text-white/20 tracking-wider">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10 group-hover:border-amber-500/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10 group-hover:border-amber-500/40 transition-colors" />

              <div className={`text-2xl mb-4 ${accentText(f.accent)} opacity-80`}>
                {f.icon}
              </div>

              <div className="text-sm font-mono font-semibold text-white tracking-wider uppercase mb-2">
                {f.title}
              </div>
              <div className="text-xs font-mono text-white/40 leading-relaxed">
                {f.description}
              </div>

              <div className="mt-5 h-px bg-white/5">
                <div className={`h-px ${accentBar(f.accent)} opacity-0 group-hover:opacity-40 transition-opacity w-full`} />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

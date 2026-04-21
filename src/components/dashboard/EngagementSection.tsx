"use client";

import * as React from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Container } from "./Container";
import { PhoneMockup } from "./PhoneMockup";

const features = [
  {
    id: "01",
    title: "Live Q&A",
    desc: "Ask questions while the moment is fresh.",
    icon: "◎",
    accent: "amber",
  },
  {
    id: "02",
    title: "Reactions",
    desc: "Keep it playful, never chaotic.",
    icon: "◈",
    accent: "pink",
  },
];

export function EngagementSection() {
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="community"
      className="bg-neutral-950 py-16 border-t border-white/5"
    >
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Section label */}
          <div
            className={`flex items-center gap-3 ${visible ? "anim-slide-left" : "reveal-hidden"}`}
          >
            <div className="h-px flex-1 max-w-[32px] bg-pink-500/40" />
            <span className="text-[10px] font-mono text-pink-500/70 tracking-widest uppercase">
              ENGAGEMENT
            </span>
          </div>

          <h2
            className={`text-2xl font-bold font-mono tracking-tight text-white sm:text-3xl leading-tight ${
              visible ? "anim-fade-up" : "reveal-hidden"
            }`}
            style={{ animationDelay: "80ms" }}
          >
            Collaborate, Ask Questions
            <br />
            <span className="text-amber-500">in Real-Time</span>
          </h2>

          <p
            className={`max-w-xl text-sm font-mono text-white/40 leading-relaxed ${
              visible ? "anim-fade-up" : "reveal-hidden"
            }`}
            style={{ animationDelay: "160ms" }}
          >
            A premium chat layer turns every play into a shared moment. Reactions
            are delightful, gifts feel personal, and creators stay in control.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.id}
                className={`group relative border border-white/10 bg-white/3 p-4 hover:border-amber-500/30 transition-all amber-glow-hover ${
                  visible ? "anim-fade-up" : "reveal-hidden"
                }`}
                style={{ animationDelay: `${240 + i * 100}ms` }}
              >
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-3">
                  <span className={`text-lg font-mono ${f.accent === "amber" ? "text-amber-500" : "text-pink-500"} opacity-70 mt-0.5`}>
                    {f.icon}
                  </span>
                  <div>
                    <div className="text-xs font-mono font-semibold text-white tracking-wider uppercase">
                      {f.title}
                    </div>
                    <div className="mt-1 text-xs font-mono text-white/40 leading-relaxed">
                      {f.desc}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-px bg-white/5">
                  <div className={`h-px w-0 group-hover:w-full transition-all duration-500 ${f.accent === "amber" ? "bg-amber-500/40" : "bg-pink-500/40"}`} />
                </div>
              </div>
            ))}
          </div>

          <div
            className={`flex items-center gap-2 opacity-30 ${visible ? "anim-fade-up" : "reveal-hidden"}`}
            style={{ animationDelay: "460ms" }}
          >
            <span className="text-[9px] font-mono text-white">◈</span>
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-[9px] font-mono text-white/60">REALTIME.MODULE</span>
          </div>
        </div>

        <div
          className={`order-first lg:order-none flex justify-center ${
            visible ? "anim-slide-right" : "reveal-hidden"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          <PhoneMockup />
        </div>
      </Container>
    </section>
  );
}

"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";

function Bubble({
  align = "left",
  accent = "amber",
  visible,
  children,
}: {
  align?: "left" | "right";
  accent?: "amber" | "pink";
  visible: boolean;
  children: React.ReactNode;
}) {
  const isRight = align === "right";
  const bubbleClass =
    accent === "pink"
      ? "bg-pink-500/15 text-pink-300 border border-pink-500/20"
      : "bg-amber-500/15 text-amber-300 border border-amber-500/20";

  return (
    <div
      className={`flex transition-all duration-500 ${isRight ? "justify-end" : "justify-start"} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className={`w-fit max-w-[80%] px-3 py-2 text-[11px] font-mono font-medium ${bubbleClass}`}>
        {children}
      </div>
    </div>
  );
}

const MESSAGES = [
  { text: "New drop was insane 🔥", align: "left" as const, accent: "amber" as const },
  { text: "Can you do a behind-the-scenes?", align: "right" as const, accent: "pink" as const },
  { text: "Yes! Q&A after the next play.", align: "left" as const, accent: "amber" as const },
  { text: "Sending a gift now 🎁", align: "right" as const, accent: "pink" as const },
];

export function PhoneMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [showThumb, setShowThumb] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(t);
    };

    const runCycle = () => {
      if (cancelled) return;
      timers = [];
      setVisibleCount(0);
      setShowHeart(false);
      setShowThumb(false);
      MESSAGES.forEach((_, i) => {
        schedule(() => setVisibleCount(i + 1), 400 + i * 600);
      });
      schedule(() => setShowHeart(true), 800);
      schedule(() => setShowThumb(true), 1800);
      const totalDuration = 400 + MESSAGES.length * 600 + 3000;
      schedule(() => {
        setVisibleCount(0);
        setShowHeart(false);
        setShowThumb(false);
        schedule(runCycle, 600);
      }, totalDuration);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          runCycle();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(ref.current);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-xs">
      {/* Floating reaction chips */}
      <div
        className={`absolute -left-8 top-8 hidden lg:flex h-10 w-10 items-center justify-center border border-pink-500/30 bg-pink-500/10 text-base transition-all duration-500 ${
          showHeart ? "opacity-100 scale-100" : "opacity-0 scale-0"
        }`}
      >
        ❤️
      </div>
      <div
        className={`absolute -right-8 top-20 hidden lg:flex h-10 w-10 items-center justify-center border border-amber-500/30 bg-amber-500/10 text-base transition-all duration-500 ${
          showThumb ? "opacity-100 scale-100" : "opacity-0 scale-0"
        }`}
      >
        👍
      </div>

      {/* Device frame */}
      <div className="border border-white/10 bg-neutral-950 p-2 relative">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/50" />

        {/* Screen area */}
        <div className="border border-white/5 bg-black p-3">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[8px] font-mono text-amber-500/70 tracking-widest uppercase">LIVE.CHAT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-pink-400/70 uppercase tracking-wider">Reactions</span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-pulse" />
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2 min-h-[140px]">
            {MESSAGES.map((msg, i) => (
              <Bubble key={i} align={msg.align} accent={msg.accent} visible={i < visibleCount}>
                {msg.text}
              </Bubble>
            ))}
          </div>

          {/* Input bar */}
          <div
            className={`mt-3 flex items-center gap-2 border border-white/10 bg-white/3 px-3 py-2 transition-all duration-500 ${
              visibleCount >= MESSAGES.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse" />
            <div className="text-[10px] font-mono text-white/25 tracking-wider">Type a message...</div>
          </div>

          {/* Bottom notation */}
          <div className="flex items-center gap-1 mt-2 opacity-20">
            <div className="flex-1 h-px bg-amber-500/40" />
            <span className="text-[7px] font-mono text-amber-400 tracking-widest">PPP.REALTIME</span>
            <div className="flex-1 h-px bg-amber-500/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";

import { cn } from "@/lib/cn";

function Bubble({
  align = "left",
  accent = "primary",
  visible,
  children,
}: {
  align?: "left" | "right";
  accent?: "primary" | "secondary";
  visible: boolean;
  children: React.ReactNode;
}) {
  const isRight = align === "right";
  const accentClass =
    accent === "secondary"
      ? "bg-secondary-500/15 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-200"
      : "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200";

  return (
    <div
      className={cn(
        "flex transition-all duration-500",
        isRight ? "justify-end" : "justify-start",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95",
      )}
    >
      <div
        className={cn(
          "w-fit max-w-xs rounded-2xl px-4 py-3 text-sm font-medium sm:max-w-sm",
          accentClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}

const MESSAGES = [
  { text: "New drop was insane 🔥", align: "left" as const, accent: "primary" as const },
  { text: "Can you do a behind-the-scenes?", align: "right" as const, accent: "secondary" as const },
  { text: "Yes! Q&A after the next play.", align: "left" as const, accent: "primary" as const },
  { text: "Sending a gift now 🎁", align: "right" as const, accent: "secondary" as const },
];

export function PhoneMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [showThumb, setShowThumb] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startAnimation();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const startAnimation = () => {
    // Stagger messages every 600ms
    MESSAGES.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), 400 + i * 600);
    });

    // Pop in reactions after first and second messages
    setTimeout(() => setShowHeart(true), 800);
    setTimeout(() => setShowThumb(true), 1800);
  };

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm">
      {/* Floating reaction: Heart */}
      <div
        className={cn(
          "absolute -left-6 top-10 hidden h-12 w-12 items-center justify-center rounded-2xl bg-secondary-500/20 text-xl dark:bg-secondary-500/25 lg:flex transition-all duration-500",
          showHeart
            ? "opacity-100 scale-100"
            : "opacity-0 scale-0",
        )}
      >
        ❤️
      </div>

      {/* Floating reaction: Thumbs up */}
      <div
        className={cn(
          "absolute -right-6 top-24 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 text-xl dark:bg-primary-500/25 lg:flex transition-all duration-500",
          showThumb
            ? "opacity-100 scale-100"
            : "opacity-0 scale-0",
        )}
      >
        👍
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Live Chat
            </div>
            <div className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-200">
              Reactions
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {MESSAGES.map((msg, i) => (
              <Bubble key={i} align={msg.align} accent={msg.accent} visible={i < visibleCount}>
                {msg.text}
              </Bubble>
            ))}
          </div>

          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-500",
              visibleCount >= MESSAGES.length
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2",
            )}
          >
            <div className="h-2 w-2 rounded-full bg-secondary-500 animate-pulse" />
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Type a message...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

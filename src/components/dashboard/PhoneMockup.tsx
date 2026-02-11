import * as React from "react";

import { cn } from "@/lib/cn";

function Bubble({
  align = "left",
  accent = "primary",
  children,
}: {
  align?: "left" | "right";
  accent?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const isRight = align === "right";
  const accentClass =
    accent === "secondary"
      ? "bg-secondary-500/15 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-200"
      : "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200";

  return (
    <div className={cn("flex", isRight ? "justify-end" : "justify-start")}>
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

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -left-6 top-10 hidden h-12 w-12 items-center justify-center rounded-2xl bg-secondary-500/20 text-xl dark:bg-secondary-500/25 lg:flex">
        ❤️
      </div>
      <div className="absolute -right-6 top-24 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20 text-xl dark:bg-primary-500/25 lg:flex">
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
            <Bubble accent="primary">New drop was insane 🔥</Bubble>
            <Bubble align="right" accent="secondary">
              Can you do a behind-the-scenes?
            </Bubble>
            <Bubble accent="primary">Yes! Q&A after the next play.</Bubble>
            <Bubble align="right" accent="secondary">
              Sending a gift now 🎁
            </Bubble>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="h-2 w-2 rounded-full bg-secondary-500" />
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Type a message...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

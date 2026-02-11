import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";
import type { DashboardContentItem } from "@/data/dashboard";

import { Pill } from "./Pill";

function accentClasses(accent: DashboardContentItem["accent"]) {
  if (accent === "secondary") {
    return {
      bg: "from-secondary-500/30 via-neutral-900/10 to-neutral-900/40 dark:from-secondary-500/25",
      pill: "secondary" as const,
      ring: "group-hover:ring-secondary-500/30",
    };
  }

  return {
    bg: "from-primary-500/30 via-neutral-900/10 to-neutral-900/40 dark:from-primary-500/25",
    pill: "primary" as const,
    ring: "group-hover:ring-primary-500/30",
  };
}

export function ContentCard({ item }: { item: DashboardContentItem }) {
  const accent = accentClasses(item.accent);

  return (
    <a
      href={`/content/${item.id}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-950",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
      )}
    >
      <div
        className={cn(
          "relative aspect-portrait overflow-hidden",
          "bg-gradient-to-br",
          accent.bg,
        )}
      >
        {item.imagePath && (
          <Image
            src={item.imagePath}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent dark:from-neutral-950/70" />

        <div className="absolute left-4 top-4">
          <Pill variant={accent.pill}>{item.priceLabel}</Pill>
        </div>

        <div className="absolute right-4 top-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 dark:bg-neutral-950/70 dark:text-neutral-100">
            ▶
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-neutral-900 backdrop-blur dark:bg-neutral-950/70 dark:text-neutral-100">
              {item.creatorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {item.creatorName}
              </div>
              <div className="truncate text-sm text-neutral-200">{item.title}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-0 rounded-2xl ring-1 ring-transparent transition-colors",
          accent.ring,
        )}
      />
    </a>
  );
}

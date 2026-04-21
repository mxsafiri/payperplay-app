import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";
import type { DashboardContentItem } from "@/data/dashboard";

function accentClasses(accent: DashboardContentItem["accent"]) {
  if (accent === "secondary") {
    return {
      bg: "from-pink-500/20 via-neutral-900/10 to-neutral-900/40",
      border: "group-hover:border-pink-500/40",
      bar: "bg-pink-500",
      pill: "border-pink-500/40 text-pink-400",
    };
  }
  return {
    bg: "from-amber-500/20 via-neutral-900/10 to-neutral-900/40",
    border: "group-hover:border-amber-500/40",
    bar: "bg-amber-500",
    pill: "border-amber-500/40 text-amber-400",
  };
}

export function ContentCard({ item }: { item: DashboardContentItem }) {
  const accent = accentClasses(item.accent);

  return (
    <a
      href={`/content/${item.id}`}
      className={cn(
        "group relative overflow-hidden border border-white/10 bg-neutral-950 transition-all hover:-translate-y-0.5 amber-glow-hover",
        accent.border,
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/40",
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/0 group-hover:border-amber-500/50 transition-colors z-10" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/0 group-hover:border-amber-500/50 transition-colors z-10" />

      <div
        className={cn(
          "relative aspect-portrait overflow-hidden bg-gradient-to-br",
          accent.bg,
        )}
      >
        {item.imagePath && (
          <Image
            src={item.imagePath}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-103 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />

        {/* Price pill */}
        <div className="absolute left-3 top-3">
          <span className={cn(
            "inline-flex items-center border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-black/50 backdrop-blur-sm",
            accent.pill,
          )}>
            {item.priceLabel}
          </span>
        </div>

        {/* Play button */}
        <div className="absolute right-3 top-3">
          <div className="flex h-9 w-9 items-center justify-center bg-white/10 text-white backdrop-blur border border-white/20 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-black transition-all">
            <span className="text-xs">▶</span>
          </div>
        </div>

        {/* Creator info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-white/10 text-xs font-mono font-bold text-white backdrop-blur border border-white/20 flex-shrink-0">
              {item.creatorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-mono font-semibold text-white tracking-wider">
                {item.creatorName}
              </div>
              <div className="truncate text-[10px] font-mono text-white/50">{item.title}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom amber bar on hover */}
      <div className={`h-px ${accent.bar} opacity-0 group-hover:opacity-60 transition-opacity`} />
    </a>
  );
}

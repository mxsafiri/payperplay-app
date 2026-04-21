"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import type { DashboardCategory } from "@/data/dashboard";

export function CategoryFilters({
  categories,
  value,
  onChange,
}: {
  categories: DashboardCategory[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex w-full justify-start sm:justify-center">
      <div className="flex w-full max-w-full gap-1.5 overflow-x-auto pb-2 sm:pb-0">
        {categories.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center border px-4 text-[10px] font-mono font-medium uppercase tracking-widest transition-all",
                active
                  ? "border-amber-500 bg-amber-500 text-black"
                  : "border-white/15 bg-transparent text-white/40 hover:border-amber-500/40 hover:text-white",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

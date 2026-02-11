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
      <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 sm:pb-0">
        {categories.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-neutral-200 bg-white/60 text-neutral-800 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-200 dark:hover:bg-neutral-950",
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

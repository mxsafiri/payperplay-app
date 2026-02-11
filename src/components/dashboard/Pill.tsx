import * as React from "react";

import { cn } from "@/lib/cn";

type PillVariant = "default" | "primary" | "secondary";

const variantClasses: Record<PillVariant, string> = {
  default:
    "border border-neutral-200 bg-white/70 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-100",
  primary:
    "bg-primary-500 text-white hover:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-400",
  secondary:
    "bg-secondary-500 text-white hover:bg-secondary-400 dark:bg-secondary-500 dark:hover:bg-secondary-400",
};

export function Pill({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: PillVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

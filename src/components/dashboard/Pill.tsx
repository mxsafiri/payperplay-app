import * as React from "react";

import { cn } from "@/lib/cn";

type PillVariant = "default" | "primary" | "secondary";

const variantClasses: Record<PillVariant, string> = {
  default:
    "border border-white/20 bg-transparent text-white/60 font-mono tracking-widest uppercase",
  primary:
    "border border-amber-500/50 bg-amber-500/10 text-amber-400 font-mono tracking-widest uppercase hover:bg-amber-500/20",
  secondary:
    "border border-pink-500/50 bg-pink-500/10 text-pink-400 font-mono tracking-widest uppercase hover:bg-pink-500/20",
};

export function Pill({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: PillVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-[10px] font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

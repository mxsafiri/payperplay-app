import * as React from "react";

import { cn } from "@/lib/cn";

export type LogoProps = {
  className?: string;
  title?: string;
};

export function Logo({ className, title = "PayPerPlay" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-7 w-auto", className)}
      role="img"
      aria-label={title}
    >
      {/* Play button icon */}
      <rect x="0" y="2" width="36" height="36" rx="10" className="fill-amber-500" />
      <path d="M14 11L27 20L14 29V11Z" fill="white" />

      {/* "Pay" */}
      <text
        x="44"
        y="28"
        className="fill-current"
        style={{ fontSize: "22px", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}
      >
        Pay
      </text>
      {/* "Per" */}
      <text
        x="89"
        y="28"
        className="fill-amber-500"
        style={{ fontSize: "22px", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}
      >
        Per
      </text>
      {/* "Play" */}
      <text
        x="127"
        y="28"
        className="fill-current"
        style={{ fontSize: "22px", fontWeight: 700, fontFamily: "system-ui, sans-serif" }}
      >
        Play
      </text>
    </svg>
  );
}

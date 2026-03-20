"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"

function Grid({
  cellSize = 12,
  strokeWidth = 1,
  patternOffset = [0, 0] as [number, number],
  className,
}: {
  cellSize?: number
  strokeWidth?: number
  patternOffset?: [number, number]
  className?: string
}) {
  const id = React.useId()
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 text-white/10",
        className,
      )}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={`grid-${id}`}
          x={patternOffset[0] - 1}
          y={patternOffset[1] - 1}
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
        </pattern>
      </defs>
      <rect fill={`url(#grid-${id})`} width="100%" height="100%" />
    </svg>
  )
}

interface BannerProps {
  show: boolean
  onHide: () => void
  icon?: React.ReactNode
  title: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  learnMoreUrl?: string
  variant?: "info" | "warning" | "success"
}

const variantStyles = {
  info: {
    container: "border-amber-500/20 bg-gradient-to-r from-amber-950/60 to-orange-950/40",
    grid: "text-amber-500/20",
    text: "text-amber-100",
    link: "text-amber-300 hover:text-amber-200",
    button: "border-amber-500/40 text-amber-200 hover:bg-amber-500/15",
    close: "text-amber-400 hover:text-amber-200",
  },
  warning: {
    container: "border-red-500/20 bg-gradient-to-r from-red-950/60 to-rose-950/40",
    grid: "text-red-500/20",
    text: "text-red-100",
    link: "text-red-300 hover:text-red-200",
    button: "border-red-500/40 text-red-200 hover:bg-red-500/15",
    close: "text-red-400 hover:text-red-200",
  },
  success: {
    container: "border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 to-green-950/40",
    grid: "text-emerald-500/20",
    text: "text-emerald-100",
    link: "text-emerald-300 hover:text-emerald-200",
    button: "border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/15",
    close: "text-emerald-400 hover:text-emerald-200",
  },
}

export function Banner({
  show,
  onHide,
  icon,
  title,
  action,
  learnMoreUrl,
  variant = "info",
}: BannerProps) {
  if (!show) return null

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-between gap-3 overflow-hidden rounded-lg border py-3 pl-4 pr-12 sm:flex-row sm:items-center sm:py-2",
        styles.container,
      )}
    >
      <Grid
        cellSize={13}
        patternOffset={[0, -1]}
        className={cn(
          styles.grid,
          "mix-blend-overlay [mask-image:linear-gradient(to_right,white,transparent)] md:[mask-image:linear-gradient(to_right,white_60%,transparent)]",
        )}
      />
      <div className="flex items-center gap-3">
        {icon && (
          <div className="hidden rounded-full border border-white/20 bg-white/5 p-1 shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.1)] sm:block">
            {icon}
          </div>
        )}
        <p className={cn("text-sm", styles.text)}>
          {title}
          {learnMoreUrl && (
            <>
              {" "}
              <a
                href={learnMoreUrl}
                target="_blank"
                className={cn("underline transition-colors", styles.link)}
              >
                Learn more
              </a>
            </>
          )}
        </p>
      </div>
      {action && (
        <div className="flex items-center sm:-my-1">
          <button
            type="button"
            className={cn(
              "whitespace-nowrap rounded-md border px-3 py-1 text-sm transition-colors",
              styles.button,
            )}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      )}
      <button
        type="button"
        className={cn(
          "absolute inset-y-0 right-2.5 p-1 text-sm transition-colors",
          styles.close,
        )}
        onClick={onHide}
      >
        <X className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}

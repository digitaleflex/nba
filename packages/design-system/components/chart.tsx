"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { useMediaQuery } from "../hooks/use-media-query"
import { BottomSheet, BottomSheetContent, BottomSheetHeader } from "./bottom-sheet"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"

export type ChartColor = "primary" | "emerald" | "rose" | "blue"

export interface ChartDatum {
  label: string
  value: number
  color?: ChartColor
}

interface ChartProps {
  type: "bar" | "line" | "funnel"
  data: ChartDatum[]
  className?: string
  emptyText?: string
  height?: number
}

const COLOR_BAR: Record<ChartColor, string> = {
  primary: "bg-primary/30 border-t border-primary/60",
  emerald: "bg-emerald-500/30 border-t border-emerald-500/60",
  rose: "bg-rose-500/30 border-t border-rose-500/60",
  blue: "bg-blue-500/30 border-t border-blue-500/60",
}
const COLOR_SOLID: Record<ChartColor, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  blue: "bg-blue-500",
}
const COLOR_TEXT: Record<ChartColor, string> = {
  primary: "text-primary",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  blue: "text-blue-600",
}
const COLOR_DOT: Record<ChartColor, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  blue: "bg-blue-500",
}

function resolveColor(color?: ChartColor) {
  return color ?? "primary"
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <span className="size-8 rounded-full bg-muted/60" />
      <p className="text-[11px]">{text}</p>
    </div>
  )
}

function Tooltip({ datum, children, isMobile }: { datum: ChartDatum; children: React.ReactNode; isMobile: boolean }) {
  if (isMobile) return <>{children}</>
  return (
    <Popover>
      <PopoverTrigger className="flex-1 cursor-pointer outline-none">{children}</PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-2 text-[11px]" side="top">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", COLOR_DOT[resolveColor(datum.color)])} />
          <span className="font-semibold text-foreground">{datum.label}</span>
          <span className="font-bold">{datum.value}</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Chart({ type, data, className, emptyText = "Pas assez de données", height = 192 }: ChartProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [active, setActive] = React.useState<ChartDatum | null>(null)

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className={cn("w-full", className)}>
        <EmptyState text={emptyText} />
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      {type === "bar" && (
        <div className="flex h-full w-full items-end justify-between gap-1 px-1">
          {data.map((d, i) => {
            const pct = (d.value / maxValue) * 100
            return (
              <Tooltip key={i} datum={d} isMobile={isMobile}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => isMobile && setActive(d)}
                  className="flex w-full flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-bold text-foreground">{d.value}</span>
                  <div
                    style={{ height: `${Math.max(4, pct * 0.8)}%` }}
                    className={cn("w-full max-w-[28px] rounded-t-xs transition-all", COLOR_BAR[resolveColor(d.color)])}
                  />
                  <span className="max-w-full truncate text-[9px] font-semibold text-muted-foreground">{d.label}</span>
                </div>
              </Tooltip>
            )
          })}
        </div>
      )}

      {type === "funnel" && (
        <div className="flex h-full flex-col justify-center gap-2 overflow-y-auto px-1">
          {data.map((d, i) => {
            const pct = (d.value / maxValue) * 100
            return (
              <Tooltip key={i} datum={d} isMobile={isMobile}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => isMobile && setActive(d)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="w-40 shrink-0 truncate text-[11px] text-muted-foreground">{d.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded bg-muted/40">
                    <div style={{ width: `${Math.max(2, pct)}%` }} className={cn("h-full rounded transition-all", COLOR_SOLID[resolveColor(d.color)])} />
                  </div>
                  <span className={cn("w-12 shrink-0 text-right text-[11px] font-bold", COLOR_TEXT[resolveColor(d.color)])}>{d.value}</span>
                </div>
              </Tooltip>
            )
          })}
        </div>
      )}

      {type === "line" && (
        <div className="relative h-full w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              points={data
                .map((d, i) => {
                  const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
                  const y = 100 - (d.value / maxValue) * 90
                  return `${x},${y}`
                })
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-primary"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-between px-1">
            {data.map((d, i) => (
              <Tooltip key={i} datum={d} isMobile={isMobile}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => isMobile && setActive(d)}
                  className="flex flex-col items-center"
                  style={{ left: `${data.length === 1 ? 50 : (i / (data.length - 1)) * 100}%`, position: "absolute", bottom: `${(d.value / maxValue) * 90}%` }}
                >
                  <span className={cn("size-2 rounded-full ring-2 ring-card", COLOR_DOT[resolveColor(d.color)])} />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: bottom-sheet detail on tap */}
      {isMobile && active && (
        <BottomSheet open onOpenChange={(o: boolean) => !o && setActive(null)}>
          <BottomSheetContent>
            <BottomSheetHeader title="Détail" onClose={() => setActive(null)} />
            <div className="flex items-center gap-2 px-1 py-2">
              <span className={cn("size-2.5 rounded-full", COLOR_DOT[resolveColor(active.color)])} />
              <span className="text-sm font-semibold text-foreground">{active.label}</span>
              <span className={cn("ml-auto text-sm font-bold", COLOR_TEXT[resolveColor(active.color)])}>{active.value}</span>
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </div>
  )
}

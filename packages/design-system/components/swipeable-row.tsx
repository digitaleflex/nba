"use client"

import * as React from "react"
import { cn } from "../lib/utils"

interface SwipeableRowProps {
  className?: string
  /** Actions revealed when swiping the content to the RIGHT (content moves right, left actions show). */
  leftActions?: React.ReactNode
  /** Actions revealed when swiping the content to the LEFT (content moves left, right actions show). */
  rightActions?: React.ReactNode
  /** Width in px of the action area revealed on each side. */
  actionWidth?: number
  /** Disable swiping entirely (e.g. on desktop). */
  disabled?: boolean
  children: React.ReactNode
}

export function SwipeableRow({
  className,
  leftActions,
  rightActions,
  actionWidth = 140,
  disabled = false,
  children,
}: SwipeableRowProps) {
  const [offset, setOffset] = React.useState(0)
  const [openSide, setOpenSide] = React.useState<"left" | "right" | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const startX = React.useRef<number | null>(null)
  const liveOffset = React.useRef(0)
  const width = React.useRef(typeof window !== "undefined" ? window.innerWidth : 0)

  React.useEffect(() => {
    const onResize = () => (width.current = window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Snap helper: decide resting position after release
  const snap = React.useCallback(
    (raw: number) => {
      const max = actionWidth
      if (raw > max * 0.4) {
        liveOffset.current = max
        setOffset(max)
        setOpenSide("left")
      } else if (raw < -max * 0.4) {
        liveOffset.current = -max
        setOffset(-max)
        setOpenSide("right")
      } else {
        liveOffset.current = 0
        setOffset(0)
        setOpenSide(null)
      }
    },
    [actionWidth],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || (!leftActions && !rightActions)) return
    startX.current = e.clientX
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || startX.current === null) return
    const delta = e.clientX - startX.current
    const max = actionWidth
    let next = delta + liveOffset.current
    if (next > max) next = max + (next - max) * 0.3
    if (next < -max) next = -max + (next + max) * 0.3
    // Respect which sides are available
    if (!leftActions && next > 0) next = 0
    if (!rightActions && next < 0) next = 0
    liveOffset.current = next
    setOffset(next)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    startX.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    snap(liveOffset.current)
  }

  const close = () => {
    liveOffset.current = 0
    setOffset(0)
    setOpenSide(null)
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Action layers */}
      <div className="pointer-events-none absolute inset-0 flex">
        {leftActions && (
          <div
            className="flex h-full items-stretch"
            style={{ width: actionWidth, marginLeft: openSide === "left" ? 0 : -actionWidth }}
          >
            {leftActions}
          </div>
        )}
        <div className="flex-1" />
        {rightActions && (
          <div
            className="flex h-full items-stretch"
            style={{ width: actionWidth, marginRight: openSide === "right" ? 0 : -actionWidth }}
          >
            {rightActions}
          </div>
        )}
      </div>

      {/* Foreground content */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative z-10 touch-pan-y bg-card/30",
          !disabled && (leftActions || rightActions) && "cursor-grab active:cursor-grabbing select-none",
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }}
        onClickCapture={(e) => {
          if (openSide && Math.abs(offset) > 0) {
            e.preventDefault()
            e.stopPropagation()
            close()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}

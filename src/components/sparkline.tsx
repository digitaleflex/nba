"use client"

import { cn } from "@nba/design-system"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 64,
  height = 28,
  stroke = "hsl(var(--primary))",
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x},${y}`
  })

  const d = `M${points.join(" L")}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`Sparkline: ${data.join(", ")}`}
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

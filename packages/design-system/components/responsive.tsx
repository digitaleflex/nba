"use client"

import { useMediaQuery } from "../hooks/use-media-query"
import type { ReactNode } from "react"

interface ResponsiveProps {
  mobile: ReactNode
  desktop: ReactNode
  fallback?: ReactNode
}

export function Responsive({ mobile, desktop, fallback }: ResponsiveProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (!isDesktop && fallback === undefined) {
    return <>{mobile}</>
  }

  return <>{isDesktop ? desktop : mobile}</>
}

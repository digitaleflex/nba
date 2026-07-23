"use client"

import { useMediaQuery } from "../hooks/use-media-query"
import type { ReactNode } from "react"

interface DualRenderProps {
  mobile: ReactNode
  desktop: ReactNode
  breakpoint?: string
}

export function DualRender({ mobile, desktop, breakpoint = "(min-width: 768px)" }: DualRenderProps) {
  const isDesktop = useMediaQuery(breakpoint)
  return <>{isDesktop ? desktop : mobile}</>
}

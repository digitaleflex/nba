"use client"

import { useMediaQuery } from "./use-media-query"

export function useIsMobile(): boolean {
  return useMediaQuery("(pointer: coarse) and (max-width: 767.98px)")
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)")
}

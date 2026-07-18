"use client"

import { useRouter as useNextRouter } from "next/navigation"
import { useCallback } from "react"

type Url = string | URL
type NavigateOptions = { scroll?: boolean }

export function useNavigation() {
  const router = useNextRouter()

  const push = useCallback(
    (url: Url, options?: NavigateOptions) => {
      const str = typeof url === "string" ? url : url.href
      const samePage =
        typeof window !== "undefined" &&
        new URL(str, window.location.origin).pathname === window.location.pathname

      if (!samePage) {
        ;(window as any).__topLoaderStart?.()
      }
      router.push(str, options)
    },
    [router],
  )

  const replace = useCallback(
    (url: Url, options?: NavigateOptions) => {
      const str = typeof url === "string" ? url : url.href
      const samePage =
        typeof window !== "undefined" &&
        new URL(str, window.location.origin).pathname === window.location.pathname

      if (!samePage) {
        ;(window as any).__topLoaderStart?.()
      }
      router.replace(str, options)
    },
    [router],
  )

  return { ...router, push, replace }
}

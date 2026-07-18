"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"

const IDLE = 0
const LOADING = 1
const COMPLETING = 2

const MAX_PROGRESS = 90
const INTERVAL_MS = 350

function noop() {}

export function TopLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState(IDLE)
  const [width, setWidth] = useState(0)
  const intervalRef = useRef<number>(0)
  const timeoutRef = useRef<number>(0)
  const prevUrlRef = useRef("")

  const cleanup = useCallback(() => {
    window.clearInterval(intervalRef.current)
    window.clearTimeout(timeoutRef.current)
    intervalRef.current = 0
    timeoutRef.current = 0
  }, [])

  const done = useCallback(() => {
    cleanup()
    setState(COMPLETING)
    setWidth(100)
    timeoutRef.current = window.setTimeout(() => {
      setState(IDLE)
      setWidth(0)
    }, 200)
  }, [cleanup])

  const start = useCallback(() => {
    cleanup()
    setState(LOADING)
    setWidth(10)

    timeoutRef.current = window.setTimeout(() => {
      let p = 10
      intervalRef.current = window.setInterval(() => {
        p += Math.random() * 12 + 3
        if (p >= MAX_PROGRESS) {
          p = MAX_PROGRESS
          window.clearInterval(intervalRef.current)
        }
        setWidth(p)
      }, INTERVAL_MS)
    }, 120)

    timeoutRef.current = window.setTimeout(() => done(), 20000)
  }, [cleanup, done])

  useEffect(() => {
    const url = `${pathname}${searchParams}`
    if (prevUrlRef.current && url !== prevUrlRef.current) {
      done()
    }
    prevUrlRef.current = url
  }, [pathname, searchParams, done])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a")
      if (!link) return
      if (link.target || link.hasAttribute("download") || link.hasAttribute("data-no-loader")) return
      try {
        const url = new URL(link.href, window.location.origin)
        if (
          url.origin === window.location.origin &&
          url.pathname + url.search !== window.location.pathname + window.location.search
        ) {
          start()
        }
      } catch {
        noop()
      }
    }

    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [start])

  useEffect(() => {
    ;(window as any).__topLoaderStart = start
    ;(window as any).__topLoaderDone = done
    return () => {
      delete (window as any).__topLoaderStart
      delete (window as any).__topLoaderDone
    }
  }, [start, done])

  if (state === IDLE) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden"
      style={{
        opacity: state === COMPLETING ? 0 : 1,
        transition: "opacity 200ms ease-out",
        WebkitTransition: "opacity 200ms ease-out",
        boxShadow: "0 0 8px var(--top-loader-glow, color-mix(in srgb, var(--color-primary) 40%, transparent))",
      }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          transition: "width 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          background: `linear-gradient(90deg,
            var(--color-primary),
            color-mix(in srgb, var(--color-primary) 70%, transparent) 50%,
            color-mix(in srgb, var(--color-primary) 30%, transparent) 100%)`,
        }}
      />
      <div
        className="absolute top-0 h-full w-[60px] rounded-full opacity-60"
        style={{
          left: `${width - 20}%`,
          transition: "left 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-primary-foreground) 50%, transparent), transparent)`,
          filter: "blur(3px)",
        }}
      />
    </div>
  )
}

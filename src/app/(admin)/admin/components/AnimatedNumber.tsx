"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  easeOut?: boolean
}

export function AnimatedNumber({ value, duration = 600, easeOut = true }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = displayValue
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOut ? 1 - Math.pow(1 - progress, 3) : progress
      setDisplayValue(Math.round(start + diff * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, easeOut])

  return <span>{displayValue}</span>
}

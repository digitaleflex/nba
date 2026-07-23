"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@nba/design-system"

type AnimationType = "slideUp" | "slideRight" | "fadeIn" | "scaleIn"

interface AnimatedContainerProps {
  animation?: AnimationType
  delay?: number
  duration?: number
  children: React.ReactNode
  className?: string
  once?: boolean
}

const ANIMATION_CLASSES: Record<AnimationType, string> = {
  slideUp: "animate-slide-up",
  slideRight: "animate-slide-right",
  fadeIn: "animate-fade-in",
  scaleIn: "animate-scale-in",
}

export function AnimatedContainer({
  animation = "fadeIn",
  delay = 0,
  duration = 400,
  children,
  className,
  once = true,
}: AnimatedContainerProps) {
  const [visible, setVisible] = useState(!once)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!once) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const animClass = ANIMATION_CLASSES[animation]

  return (
    <div
      ref={ref}
      className={cn(
        visible ? animClass : "opacity-0",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  )
}

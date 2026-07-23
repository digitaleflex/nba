"use client"

import { AnimatedNumber } from "./AnimatedNumber"

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value, duration = 600 }: AnimatedCounterProps) {
  return <AnimatedNumber value={value} duration={duration} />
}

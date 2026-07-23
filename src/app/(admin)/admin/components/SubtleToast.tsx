"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@nba/design-system"

interface SubtleToastProps {
  message: string
  type: "success" | "error" | "info"
  duration?: number
  onClose?: () => void
}

export function SubtleToast({ message, type, duration = 3000, onClose }: SubtleToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const Icon = type === "success" ? CheckCircle : type === "error" ? XCircle : CheckCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm backdrop-blur-md border animate-in slide-in-from-bottom-2 fade-in duration-300",
        type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
        type === "error" && "bg-red-500/10 border-red-500/20 text-red-700",
        type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-700",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {message}
    </div>
  )
}

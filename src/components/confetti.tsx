"use client"

import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ec4899", "#a855f7"]

export function Confetti({ onComplete }: { onComplete?: () => void }) {
  const [show, setShow] = useState(true)
  const particles = Array.from({ length: 20 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="size-16 text-emerald-500 drop-shadow-lg" />
          </motion.div>
          {particles.map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "50vw", y: "50vh", scale: 0, opacity: 1 }}
              animate={{
                x: `${20 + Math.random() * 60}vw`,
                y: `${20 + Math.random() * 60}vh`,
                scale: [0, 1, 0.5],
                opacity: [1, 1, 0],
                rotate: [0, 360],
              }}
              transition={{ duration: 1.5, delay: i * 0.02, ease: "easeOut" }}
              className="absolute size-2 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

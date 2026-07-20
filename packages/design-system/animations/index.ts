import { useReducedMotion } from "motion/react"
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  reducedVariants,
} from "./variants"

export type MotionVariant = Record<string, unknown>

/**
 * Renvoie la variante d'animation adaptée aux préférences de l'utilisateur.
 * Si `prefers-reduced-motion: reduce` est actif, toutes les variantes sont
 * réduites à une simple fondu en opacité (WCAG 2.3.3 — animations à éviter).
 *
 * @example
 *   const v = useMotionVariant("fadeInUp")
 *   <motion.div initial="hidden" animate="show" variants={v} />
 */
export function useMotionVariant(name: keyof typeof reducedVariants = "fadeInUp"): MotionVariant {
  const reduce = useReducedMotion()
  if (reduce) return reducedVariants[name] ?? fadeIn
  return (
    { fadeIn, fadeInUp, fadeInDown, scaleIn, slideInRight, slideInLeft }[name] ?? fadeIn
  )
}

export {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  reducedVariants,
}

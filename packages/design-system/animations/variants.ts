import { useReducedMotion } from "motion/react"

/**
 * Variantes d'animation partagées pour le design system.
 * Toutes respectent `prefers-reduced-motion` : si l'utilisateur le demande,
 * elles se réduisent à une simple opacité (ou aucune transition).
 *
 * Usage :
 *   const reduce = useReducedMotionSafe()
 *   <motion.div variants={reduce ? fadeOnly : fadeInUp} ... />
 */

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

export const fadeInDown = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

/** Version accessible (réduite) de chaque variante : opacity seule. */
export const reducedVariants = {
  fadeIn,
  fadeInUp: fadeIn,
  fadeInDown: fadeIn,
  scaleIn: fadeIn,
  slideInRight: fadeIn,
  slideInLeft: fadeIn,
}

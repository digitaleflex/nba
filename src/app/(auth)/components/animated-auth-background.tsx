"use client"

/**
 * Arrière-plan animé premium pour les pages d'authentification.
 *
 * 3 orbes floues en mouvement lent non-linéaire, type Apple Pay / iCloud.
 * Rendu GPU via transform + filter: blur, zéro impact JS.
 * Compatible prefers-reduced-motion : statique mais visible.
 * Adaptatif dark mode : opacité ajustée automatiquement.
 */
export function AnimatedAuthBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="orb orb-1 motion-safe:animate-orb-drift-1"
        style={{
          position: "absolute",
          width: "clamp(300px, 40vw, 600px)",
          height: "clamp(300px, 40vw, 600px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--color-primary), transparent 70%)",
          filter: "blur(min(80px, 10vw))",
          opacity: 0.06,
          top: "-10%",
          right: "-5%",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />
      <div
        className="orb orb-2 motion-safe:animate-orb-drift-2"
        style={{
          position: "absolute",
          width: "clamp(250px, 35vw, 500px)",
          height: "clamp(250px, 35vw, 500px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--color-accent), transparent 70%)",
          filter: "blur(min(70px, 9vw))",
          opacity: 0.05,
          bottom: "-12%",
          left: "-5%",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />
      <div
        className="orb orb-3 motion-safe:animate-orb-drift-3"
        style={{
          position: "absolute",
          width: "clamp(200px, 25vw, 350px)",
          height: "clamp(200px, 25vw, 350px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--color-ring), transparent 70%)",
          filter: "blur(min(60px, 8vw))",
          opacity: 0.04,
          top: "40%",
          left: "55%",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />
    </div>
  )
}

import type { Config, DriveStep } from "driver.js"

/**
 * Configuration partagée et responsive pour les guides Driver.js.
 *
 * Problèmes ciblés sur mobile :
 * - Le popover pouvait déborder hors écran (side: "right" sur petit viewport).
 * - L'overlay bloquait la navigation sans moyen simple de fermer (pas de
 *   fermeture au tap sur l'overlay, ni de bouton clair).
 * - Les libellés de boutons étaient en anglais et la cible pouvait rester
 *   interactive pendant le tour.
 *
 * On adapte dynamiquement le `side`/`align` selon la largeur d'écran et on
 * rend la fermeture au tap sur l'overlay possible.
 */

const MOBILE_BREAKPOINT = 640

function isMobile(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}

/**
 * Applique un side/align adapté au viewport pour éviter qu'un popover ne
 * déborde sur mobile. Le `step` reçu est celui défini par l'appelant ; on ne
 * l'écrase que si on est sur mobile.
 */
function withResponsiveSide(step: DriveStep): DriveStep {
  if (!isMobile()) return step
  const s = step as { popover?: { side?: string; align?: string } }
  // Sur mobile on force le popover en bas (ou haut si déjà en bas) pour rester
  // dans la largeur de l'écran ; l'alignement passe au centre.
  const current = s.popover?.side
  const mobileSide = current === "bottom" ? "top" : "bottom"
  return {
    ...step,
    popover: {
      ...s.popover,
      side: mobileSide,
      align: "center",
    },
  }
}

export function createGuideConfig(
  steps: DriveStep[],
  options: Partial<Config> = {},
): Config {
  const responsiveSteps = steps.map((s) => withResponsiveSide(s))

  return {
    // Fermeture au tap sur l'overlay : indispensable sur mobile pour ne pas
    // bloquer la navigation de l'utilisateur.
    overlayClickBehavior: "close",
    allowClose: true,
    // Empêche toute interaction avec l'élément mis en avant pendant le tour.
    disableActiveInteraction: true,
    // Meilleur confort visuel sur petit écran.
    stagePadding: isMobile() ? 6 : 10,
    stageRadius: 8,
    smoothScroll: true,
    // Libellés en français + progression.
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    nextBtnText: "Suivant",
    prevBtnText: "Précédent",
    doneBtnText: "Terminer",
    // Classe CSS dédiée pour le responsive (voir globals.css).
    popoverClass: "nba-driver-popover",
    steps: responsiveSteps,
    ...options,
  }
}

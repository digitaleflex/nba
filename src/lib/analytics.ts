"use client"

/**
 * Couche d'analytics minimale et agnostique.
 * - Si NEXT_PUBLIC_POSTHOG_KEY est défini, les événements sont envoyés à PostHog (après ajout du package).
 * - Sinon, log en dev uniquement (no-op en production silencieux).
 *
 * Prêt pour CT6 : ajout de `posthog-js` + initialisation dans le provider si besoin.
 */

type AnalyticsProps = Record<string, unknown>

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

let initialized = false

function getPosthog(): { capture: (e: string, p?: AnalyticsProps) => void; identify: (id: string, p?: AnalyticsProps) => void } | null {
  if (typeof window === "undefined" || !POSTHOG_KEY) return null
  // posthog-js n'est chargé que si présent (package optionnel)
  const w = window as unknown as { posthog?: { capture: (e: string, p?: AnalyticsProps) => void; identify: (id: string, p?: AnalyticsProps) => void } }
  if (w.posthog) return w.posthog
  return null
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return
  initialized = true
  const ph = getPosthog()
  if (ph && POSTHOG_KEY) {
    // Initialisation paresseuse si le package est présent
    const w = window as unknown as { posthog?: { init?: (key: string, opts: Record<string, unknown>) => void } & Record<string, unknown> }
    if (typeof w.posthog?.init === "function") {
      w.posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, autocapture: false, capture_pageview: false })
    }
  }
}

export function track(event: string, props?: AnalyticsProps) {
  ensureInit()
  const ph = getPosthog()
  if (ph) {
    ph.capture(event, props)
    return
  }
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props ?? {})
  }
}

export function identify(userId: string, props?: AnalyticsProps) {
  ensureInit()
  const ph = getPosthog()
  if (ph) ph.identify(userId, props)
}

/** Événements de base liés à l'onboarding et au journal */
export const AnalyticsEvents = {
  welcomeGuideSeen: () => track("onboarding_welcome_guide_seen"),
  firstTradeGuideSeen: () => track("onboarding_first_trade_guide_seen"),
  statsGuideSeen: () => track("onboarding_stats_guide_seen"),
  reflectionGuideSeen: () => track("onboarding_reflection_guide_seen"),
  tradeCreated: (props: { pair: string; result: string; hasStopLoss: boolean }) =>
    track("trade_created", props),
  missionCompleted: (id: string) => track("mission_completed", { missionId: id }),
  milestoneReached: (count: number) => track("milestone_reached", { count }),
  coachMessageShown: (rule: string) => track("coach_message_shown", { rule }),
} as const

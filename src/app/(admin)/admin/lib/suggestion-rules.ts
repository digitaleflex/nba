export interface SuggestionAction {
  label: string
  variant: "destructive" | "default" | "outline"
  onClick: () => Promise<void> | void
  confirmRequired?: boolean
}

export interface Suggestion {
  id: string
  type: "action" | "info" | "warning"
  priority: 1 | 2 | 3
  title: string
  description: string
  evidence: string[]
  actions: SuggestionAction[]
  dismissible: boolean
  expiresAt?: Date
}

interface SecurityEvent {
  id: string
  type: string
  userId: string
  ipAddress: string | null
  createdAt: string
  severity: string
  user?: { name: string; email: string } | null
  details?: Record<string, unknown>
}

function groupBy<T>(items: T[], key: string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = (item as any)[key] as string
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export const SUGGESTION_RULES = [
  {
    id: "brute_force",
    check: (events: SecurityEvent[]): Suggestion[] => {
      const failed = events.filter((e) => e.type === "LOGIN_FAILED")
      const byUser = groupBy(failed, "userId")
      return Object.entries(byUser)
        .filter(([, evts]) => evts.length >= 5)
        .map(([userId, evts]) => ({
          id: `brute_force_${userId}`,
          type: "action" as const,
          priority: 1 as const,
          title: `Brute force sur ${evts[0].user?.email || userId}`,
          description: `${evts.length} tentatives échouées`,
          evidence: evts.map((e) => `${e.ipAddress || "?"} — ${new Date(e.createdAt).toLocaleTimeString("fr-FR")}`),
          actions: [
            { label: "Bloquer IP", variant: "destructive" as const, onClick: async () => {} },
            { label: "Suspendre", variant: "destructive" as const, onClick: async () => {} },
            { label: "Voir les logs", variant: "outline" as const, onClick: async () => {} },
          ],
          dismissible: true,
        }))
    },
  },
  {
    id: "impossible_travel",
    check: (events: SecurityEvent[]): Suggestion[] => {
      const travel = events.filter((e) => e.type === "IMPOSSIBLE_TRAVEL_DETECTED")
      return travel.map((e) => ({
        id: `travel_${e.id}`,
        type: "warning" as const,
        priority: 2 as const,
        title: `Voyage impossible : ${e.user?.email || "?"}`,
        description: `Connexion depuis des localisations distantes`,
        evidence: [`IP: ${e.ipAddress || "?"}`, `Détails: ${JSON.stringify(e.details)}`],
        actions: [
          { label: "Révoquer session", variant: "destructive" as const, onClick: async () => {} },
          { label: "Forcer 2FA", variant: "default" as const, onClick: async () => {} },
        ],
        dismissible: true,
      }))
    },
  },
  {
    id: "shared_ip_fraud",
    check: (events: SecurityEvent[]): Suggestion[] => {
      const byIp = groupBy(events.filter((e) => e.ipAddress), "ipAddress")
      return Object.entries(byIp)
        .filter(([, evts]) => new Set(evts.map((e) => e.userId)).size >= 3)
        .map(([ip, evts]) => ({
          id: `shared_ip_${ip}`,
          type: "action" as const,
          priority: 1 as const,
          title: `IP partagée suspecte : ${ip}`,
          description: `${new Set(evts.map((e) => e.userId)).size} comptes différents depuis cette IP`,
          evidence: [...new Set(evts.map((e) => e.user?.email).filter(Boolean))] as string[],
          actions: [
            { label: "Bloquer IP", variant: "destructive" as const, onClick: async () => {} },
          ],
          dismissible: true,
        }))
    },
  },
]

export function evaluateSuggestions(events: SecurityEvent[]): Suggestion[] {
  return SUGGESTION_RULES.flatMap((rule) => rule.check(events))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
}

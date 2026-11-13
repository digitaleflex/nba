import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createContext, runInContext } from "node:vm"

/**
 * Banc d'essai du service worker `public/sw.js`.
 * Charge le vrai fichier dans un bac à sable Node avec un faux environnement de service worker et
 * enregistre les appels à `showNotification`. Permet de tester la logique d'affichage des push sans
 * navigateur (Playwright headless ne peut pas accorder la permission de notification).
 */
export interface ShownNotification {
  title: string
  options: Record<string, unknown>
}

type Handler = (event: Record<string, unknown>) => void

export function loadServiceWorker(opts: { userAgent?: string; windows?: Array<{ visibilityState: string; postMessage: (m: unknown) => void }> } = {}) {
  const code = readFileSync(join(process.cwd(), "public/sw.js"), "utf8")
  const handlers: Record<string, Handler> = {}
  const shown: ShownNotification[] = []
  const opened: string[] = []
  const badgeCalls: number[] = []
  const subscribed: any[] = []
  const fetchCalls: { url: string; init: any }[] = []

  const fakeSub = {
    endpoint: "https://push/new-endpoint",
    toJSON: () => ({ endpoint: "https://push/new-endpoint", keys: { p256dh: "p", auth: "a" } }),
  }

  const self = {
    addEventListener: (type: string, fn: Handler) => { handlers[type] = fn },
    registration: {
      showNotification: (title: string, options: Record<string, unknown>) => {
        shown.push({ title, options })
        return Promise.resolve()
      },
      pushManager: {
        subscribe: async () => fakeSub,
      },
    },
    skipWaiting: () => Promise.resolve(),
    navigator: { userAgent: opts.userAgent ?? "test-agent", setAppBadge: async () => { badgeCalls.push(1) } },
  }
  const sandbox = createContext({
    self,
    console: { log() {}, error() {} },
    caches: { open: async () => ({ addAll: async () => {} }), keys: async () => [], delete: async () => {} },
    clients: {
      claim: async () => {},
      matchAll: async () => opts.windows ?? [],
      openWindow: async (url: string) => { opened.push(url) },
    },
    fetch: async (url: string, init?: any) => { fetchCalls.push({ url, init }); return { ok: true, status: 200 } },
    Promise,
  })
  runInContext(code, sandbox)

  /** Simule la réception d'un push. `data` = null pour un push sans payload. */
  async function push(data: { json?: () => unknown; text?: () => string } | null) {
    let pending: Promise<unknown> | undefined
    handlers.push({ data, waitUntil: (p: Promise<unknown>) => { pending = p } })
    await pending
  }

  /** Raccourci : push dont le corps est un objet JSON. */
  const pushJson = (payload: unknown) => push({ json: () => payload, text: () => JSON.stringify(payload) })
  /** Raccourci : push dont le corps est du texte non JSON. */
  const pushText = (text: string) =>
    push({ json: () => { throw new SyntaxError("not json") }, text: () => text })

  async function click(url?: string) {
    let pending: Promise<unknown> | undefined
    handlers.notificationclick({
      notification: { close() {}, data: url ? { url } : {} },
      waitUntil: (p: Promise<unknown>) => { pending = p },
    })
    await pending
  }

  /** Simule un changement d'abonnement push. */
  async function subscriptionChange(oldEndpoint?: string) {
    let pending: Promise<unknown> | undefined
    handlers.pushsubscriptionchange({
      oldSubscription: oldEndpoint ? { endpoint: oldEndpoint, options: { applicationServerKey: null } } : null,
      waitUntil: (p: Promise<unknown>) => { pending = p },
    })
    await pending
  }

  return { badgeCalls, shown, opened, fetchCalls, push, pushJson, pushText, click, subscriptionChange, handlers }
}

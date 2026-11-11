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

export function loadServiceWorker() {
  const code = readFileSync(join(process.cwd(), "public/sw.js"), "utf8")
  const handlers: Record<string, Handler> = {}
  const shown: ShownNotification[] = []
  const opened: string[] = []

  const self = {
    addEventListener: (type: string, fn: Handler) => { handlers[type] = fn },
    registration: {
      showNotification: (title: string, options: Record<string, unknown>) => {
        shown.push({ title, options })
        return Promise.resolve()
      },
    },
    skipWaiting: () => Promise.resolve(),
  }
  const sandbox = createContext({
    self,
    console: { log() {}, error() {} },
    caches: { open: async () => ({ addAll: async () => {} }), keys: async () => [], delete: async () => {} },
    clients: {
      claim: async () => {},
      matchAll: async () => [],
      openWindow: async (url: string) => { opened.push(url) },
    },
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

  return { shown, opened, push, pushJson, pushText, click, handlers }
}

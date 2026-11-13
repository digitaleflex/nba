import { describe, it, expect } from "vitest"
import { loadServiceWorker } from "./sw-harness"

describe("public/sw.js — affichage des notifications push", () => {
  it("affiche une notification pour un push JSON complet", async () => {
    const sw = loadServiceWorker()
    await sw.pushJson({ title: "Nouveau signal de trading", body: "BUY XAUUSD", url: "/dashboard/signals/abc", tag: "n1" })

    expect(sw.shown).toHaveLength(1)
    expect(sw.shown[0].title).toBe("Nouveau signal de trading")
    expect(sw.shown[0].options).toMatchObject({
      body: "BUY XAUUSD",
      tag: "n1",
      silent: false, // ne jamais demander une notification silencieuse
      data: { url: "/dashboard/signals/abc" },
    })
  })

  it("demande une vibration (ignorée par iOS, appliquée par Android selon le canal)", async () => {
    const sw = loadServiceWorker()
    await sw.pushJson({ title: "t", body: "b" })
    expect(Array.isArray(sw.shown[0].options.vibrate)).toBe(true)
  })

  it("affiche une notification même si le corps n'est pas du JSON", async () => {
    const sw = loadServiceWorker()
    await sw.pushText("hello")
    expect(sw.shown).toHaveLength(1)
    expect(sw.shown[0].options.body).toBe("hello")
  })

  it("utilise un titre et un lien par défaut quand ils manquent", async () => {
    const sw = loadServiceWorker()
    await sw.pushJson({})
    expect(sw.shown[0].title).toBeTruthy()
    expect(sw.shown[0].options).toMatchObject({ data: { url: "/dashboard/signals" } })
  })

  // BUG CONNU — issue PUSH-1 (#364) : `if (!event.data) return;` (public/sw.js) n'affiche RIEN pour un
  // push sans données. Sur iOS, WebKit peut révoquer l'abonnement après quelques push sans notification
  // visible. `it.fails` documente le défaut : quand il sera corrigé, ce test passera au rouge et il
  // suffira de retirer `.fails` pour transformer cette attente en garde-fou définitif.
  it("affiche une notification même pour un push SANS données (PUSH-1 #364)", async () => {
    const sw = loadServiceWorker()
    await sw.push(null)
    expect(sw.shown).toHaveLength(1)
  })

  it("ouvre le lien de la notification au clic quand aucune fenêtre n'est ouverte", async () => {
    const sw = loadServiceWorker()
    await sw.click("/dashboard/signals/abc")
    expect(sw.opened).toEqual(["/dashboard/signals/abc"])
  })

  it("reabonne et POST le nouvel endpoint sur pushsubscriptionchange (PUSH-2c #387)", async () => {
    const sw = loadServiceWorker()
    await sw.subscriptionChange()
    expect(sw.fetchCalls.some((c) => c.url === "/api/push/subscribe" && c.init?.method === "POST")).toBe(true)
    const call = sw.fetchCalls.find((c) => c.url === "/api/push/subscribe")!
    const body = JSON.parse(call.init.body)
    expect(body.endpoint).toBe("https://push/new-endpoint")
  })

  it("fenêtre visible : demande à l'app de jouer le son et n'affiche PAS de notification système (#367)", async () => {
    const messages: unknown[] = []
    const sw = loadServiceWorker({ windows: [{ visibilityState: "visible", postMessage: (m) => messages.push(m) }] })
    await sw.pushJson({ title: "Nouveau signal", body: "BUY XAUUSD", url: "/dashboard/signals/abc", tag: "n1" })
    expect(sw.shown).toHaveLength(0)
    expect(messages).toEqual([expect.objectContaining({ type: "PLAY_ALERT", kind: "signal", tag: "n1" })])
  })

  it("aucune fenêtre visible : une notification système est affichée (#367)", async () => {
    const sw = loadServiceWorker({ windows: [{ visibilityState: "hidden", postMessage: () => {} }] })
    await sw.pushJson({ title: "Nouveau signal", body: "b" })
    expect(sw.shown).toHaveLength(1)
  })

  it("iOS : affiche toujours une notification, même app ouverte (risque de révocation) (#367)", async () => {
    const sw = loadServiceWorker({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)", windows: [{ visibilityState: "visible", postMessage: () => {} }] })
    await sw.pushJson({ title: "t", body: "b" })
    expect(sw.shown).toHaveLength(1)
  })

  it("pose un badge sur l'icône à la réception d'un push (application installée)", async () => {
    const sw = loadServiceWorker()
    await sw.pushJson({ title: "Nouveau signal", body: "b" })
    expect(sw.badgeCalls.length).toBeGreaterThan(0)
  })
})

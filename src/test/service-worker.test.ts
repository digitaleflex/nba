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
  it.fails("affiche une notification même pour un push SANS données (PUSH-1 #364)", async () => {
    const sw = loadServiceWorker()
    await sw.push(null)
    expect(sw.shown).toHaveLength(1)
  })

  it("ouvre le lien de la notification au clic quand aucune fenêtre n'est ouverte", async () => {
    const sw = loadServiceWorker()
    await sw.click("/dashboard/signals/abc")
    expect(sw.opened).toEqual(["/dashboard/signals/abc"])
  })
})

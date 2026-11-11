import { describe, it, expect } from "vitest"
import {
  addDeliveryMetrics,
  computeDeliveryRates,
  emptyDeliveryMetrics,
  type DeliverySubject,
} from "./delivery-metrics"

function subject(partial: Partial<DeliverySubject>): DeliverySubject {
  return {
    hasEmail: true,
    dbStatus: "SENT",
    externalId: "re_123",
    bucket: "unknown",
    ...partial,
  }
}

function aggregate(subjects: DeliverySubject[]) {
  const metrics = emptyDeliveryMetrics()
  for (const s of subjects) addDeliveryMetrics(metrics, s)
  return metrics
}

describe("addDeliveryMetrics", () => {
  it("ignore les destinataires sans email planifié", () => {
    const m = aggregate([
      subject({ hasEmail: false, dbStatus: null, externalId: null, bucket: "unknown" }),
    ])
    expect(m).toEqual(emptyDeliveryMetrics())
  })

  it("ne compte pas un PENDING sans externalId comme envoyé", () => {
    const m = aggregate([subject({ dbStatus: "PENDING", externalId: null, bucket: "pending" })])
    expect(m.sent).toBe(0)
    expect(m.pending).toBe(1)
  })

  it("ne compte pas un FAILED comme envoyé", () => {
    const m = aggregate([subject({ dbStatus: "FAILED", externalId: null, bucket: "failed" })])
    expect(m.sent).toBe(0)
    expect(m.failed).toBe(1)
  })

  it("compte un ouvert comme délivré ET ouvert (cumulatif)", () => {
    const m = aggregate([subject({ dbStatus: "SENT", bucket: "opened" })])
    expect(m.sent).toBe(1)
    expect(m.delivered).toBe(1)
    expect(m.opened).toBe(1)
  })

  it("compte une plainte comme délivrée", () => {
    const m = aggregate([subject({ bucket: "complained" })])
    expect(m.sent).toBe(1)
    expect(m.delivered).toBe(1)
    expect(m.complained).toBe(1)
  })

  it("compte un bounce comme envoyé mais pas délivré", () => {
    const m = aggregate([subject({ dbStatus: "BOUNCED", bucket: "bounced" })])
    expect(m.sent).toBe(1)
    expect(m.delivered).toBe(0)
    expect(m.bounced).toBe(1)
  })

  it("compte un statut inconnu avec externalId comme envoyé mais non délivré", () => {
    const m = aggregate([subject({ bucket: "unknown" })])
    expect(m.sent).toBe(1)
    expect(m.delivered).toBe(0)
    expect(m.unknown).toBe(1)
  })
})

describe("computeDeliveryRates", () => {
  it("ouvre/délivré ne dépasse jamais 100 % quand des emails sont ouverts", () => {
    const m = aggregate([
      subject({ bucket: "opened" }),
      subject({ bucket: "opened" }),
      subject({ bucket: "delivered" }),
      subject({ bucket: "bounced" }),
    ])
    const rates = computeDeliveryRates(m)
    expect(m.sent).toBe(4)
    expect(m.delivered).toBe(3)
    expect(rates.deliveryRate).toBe(75)
    expect(rates.openRate).toBe(67) // 2 ouverts / 3 délivrés
    expect(rates.openRate).toBeLessThanOrEqual(100)
    expect(rates.bounceRate).toBe(25)
  })

  it("retourne 0 partout quand rien n'a été envoyé", () => {
    const rates = computeDeliveryRates(emptyDeliveryMetrics())
    expect(rates).toEqual({ deliveryRate: 0, openRate: 0, bounceRate: 0, complaintRate: 0 })
  })
})

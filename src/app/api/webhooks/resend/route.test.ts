import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockVerify } = vi.hoisted(() => ({ mockVerify: vi.fn() }))

vi.mock("resend", () => ({
  Resend: class {
    webhooks = { verify: mockVerify }
  },
}))

vi.mock("@nba/lib/db", () => ({
  prisma: {
    emailEvent: { create: vi.fn(async () => ({ id: "e1" })) },
    notificationDelivery: {
      findFirst: vi.fn(),
      update: vi.fn(async () => ({})),
    },
  },
}))

vi.mock("@nba/lib/email", () => ({
  sendEmail: vi.fn(async () => "alert-id"),
}))

vi.mock("@nba/lib/services/email-status", () => ({
  markUserBounced: vi.fn(async () => null),
  markUserComplained: vi.fn(async () => null),
}))

import { POST } from "./route"
import { prisma } from "@nba/lib/db"
import { sendEmail } from "@nba/lib/email"

function makeRequest(event: unknown, sig = { id: "evt_1", ts: "123", s: "sig" }) {
  return new NextRequest("https://access.signauxx.com/api/webhooks/resend", {
    method: "POST",
    body: JSON.stringify(event),
    headers: {
      "svix-id": sig.id,
      "svix-timestamp": sig.ts,
      "svix-signature": sig.s,
    },
  })
}

const BOUNCED_EVENT = {
  type: "email.bounced",
  data: {
    email_id: "resend-123",
    to: ["bounced@exemple.com"],
    bounce: { message: "Mailbox full" },
  },
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test"
    ;(prisma.emailEvent.create as any).mockResolvedValue({ id: "e1" })
  })

  it("stocke l'event et alerte l'admin sur bounce", async () => {
    mockVerify.mockReturnValue(BOUNCED_EVENT)
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({ id: "d1", status: "PENDING" })

    const res = await POST(makeRequest(BOUNCED_EVENT))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(prisma.emailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ externalId: "resend-123", svixId: "evt_1", type: "email.bounced" }),
    })
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { status: "BOUNCED", errorMessage: "Mailbox full" },
    })
    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it("marque SENT sur delivered", async () => {
    mockVerify.mockReturnValue({ type: "email.delivered", data: { email_id: "resend-456" } })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({ id: "d2", status: "PENDING" })

    const res = await POST(makeRequest({ type: "email.delivered", data: { email_id: "resend-456" } }))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: "d2" },
      data: { status: "SENT" },
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("retourne 401 si signature invalide", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("bad signature")
    })
    const res = await POST(makeRequest(BOUNCED_EVENT))
    expect(res.status).toBe(401)
    expect(prisma.emailEvent.create).not.toHaveBeenCalled()
  })

  it("dédupplique sur svix-id (P2002)", async () => {
    mockVerify.mockReturnValue(BOUNCED_EVENT)
    ;(prisma.emailEvent.create as any).mockRejectedValue({ code: "P2002" })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({ id: "d1", status: "PENDING" })

    const res = await POST(makeRequest(BOUNCED_EVENT))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).not.toHaveBeenCalled()
  })

  it("ignore les events sans email_id", async () => {
    mockVerify.mockReturnValue({ type: "email.sent", data: {} })
    const res = await POST(makeRequest({ type: "email.sent", data: {} }))
    expect(res.status).toBe(200)
    expect(prisma.emailEvent.create).not.toHaveBeenCalled()
  })

  it("marque FAILED + alerte admin sur email.failed (Sprint 1 #61)", async () => {
    const failedEvent = {
      type: "email.failed",
      data: {
        email_id: "resend-789",
        to: ["x@exemple.com"],
        reason: "API Key Invalid",
      },
    }
    mockVerify.mockReturnValue(failedEvent)
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({ id: "d3", status: "PENDING" })

    const res = await POST(makeRequest(failedEvent))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: "d3" },
      data: { status: "FAILED", errorMessage: "email.failed: API Key Invalid" },
    })
    expect(sendEmail).toHaveBeenCalledOnce() // alerte admin
  })
})

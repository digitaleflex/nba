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
    auditLog: { create: vi.fn(async () => ({})) },
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
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d1",
      status: "PENDING",
      lastEventAt: null,
    })

    const res = await POST(makeRequest(BOUNCED_EVENT))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(prisma.emailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ externalId: "resend-123", svixId: "evt_1", type: "email.bounced" }),
    })
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ status: "BOUNCED", errorMessage: "Mailbox full" }),
      }),
    )
    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it("marque SENT sur delivered", async () => {
    mockVerify.mockReturnValue({ type: "email.delivered", data: { email_id: "resend-456" } })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d2",
      status: "PENDING",
      lastEventAt: null,
    })

    const res = await POST(makeRequest({ type: "email.delivered", data: { email_id: "resend-456" } }))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d2" },
        data: expect.objectContaining({ status: "SENT" }),
      }),
    )
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
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d3",
      status: "PENDING",
      lastEventAt: null,
    })

    const res = await POST(makeRequest(failedEvent))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d3" },
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "email.failed: API Key Invalid",
        }),
      }),
    )
    expect(sendEmail).toHaveBeenCalledOnce() // alerte admin
  })

  it("alerte critique sur domain.deleted + audit log (Sprint 1 #62)", async () => {
    const domainEvent = {
      type: "domain.deleted",
      data: { name: "access.signauxx.com" },
    }
    mockVerify.mockReturnValue(domainEvent)

    const res = await POST(makeRequest(domainEvent))
    expect(res.status).toBe(200)
    // Pas de traitement delivery
    expect(prisma.notificationDelivery.findFirst).not.toHaveBeenCalled()
    // Audit log
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "resend.domain.deleted",
          resourceType: "resend_domain",
        }),
      }),
    )
    // Alerte critique envoyee
    expect(sendEmail).toHaveBeenCalledOnce()
    const alertArgs = (sendEmail as any).mock.calls[0][1]
    expect(alertArgs.subject).toContain("CRITIQUE")
    expect(alertArgs.subject).toContain("access.signauxx.com")
  })

  it("audit log seul (pas d'alerte) sur domain.created / domain.updated", async () => {
    for (const t of ["domain.created", "domain.updated"]) {
      vi.clearAllMocks()
      ;(prisma.auditLog.create as any).mockResolvedValue({})
      mockVerify.mockReturnValue({ type: t, data: { name: "example.com" } })
      const res = await POST(makeRequest({ type: t, data: { name: "example.com" } }))
      expect(res.status).toBe(200)
      expect(prisma.auditLog.create).toHaveBeenCalled()
      expect(sendEmail).not.toHaveBeenCalled()
    }
  })

  it("extrait clickLink du payload email.clicked (Sprint 2 #63)", async () => {
    const clickedEvent = {
      type: "email.clicked",
      data: {
        email_id: "resend-click-1",
        click: { link: "https://access.signauxx.com/dashboard/signals/abc" },
      },
    }
    mockVerify.mockReturnValue(clickedEvent)

    const res = await POST(makeRequest(clickedEvent))
    expect(res.status).toBe(200)
    expect(prisma.emailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        externalId: "resend-click-1",
        type: "email.clicked",
        clickLink: "https://access.signauxx.com/dashboard/signals/abc",
      }),
    })
  })

  it("email.clicked sans click.link -> clickLink null", async () => {
    mockVerify.mockReturnValue({ type: "email.clicked", data: { email_id: "x" } })
    const res = await POST(makeRequest({ type: "email.clicked", data: { email_id: "x" } }))
    expect(res.status).toBe(200)
    expect(prisma.emailEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ clickLink: null }),
    })
  })

  it("out-of-order : delivered AVANT opened (opened anterieur) -> delivered pris, opened ignore (Sprint 2 #65)", async () => {
    // opened recu en premier (t-1)
    mockVerify.mockReturnValueOnce({
      type: "email.opened",
      created_at: "2026-07-13T10:00:00.000Z",
      data: { email_id: "resend-ooo" },
    })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d-ooo",
      status: "PENDING",
      lastEventAt: null,
    })
    await POST(
      new NextRequest("https://x", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "svix-id": "evt-ooo-1",
          "svix-timestamp": "1",
          "svix-signature": "s",
        },
      }),
    )
    // delivered recu en second (t) plus recent
    mockVerify.mockReturnValueOnce({
      type: "email.delivered",
      created_at: "2026-07-13T10:00:05.000Z",
      data: { email_id: "resend-ooo" },
    })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d-ooo",
      status: "PENDING",
      lastEventAt: new Date("2026-07-13T10:00:00.000Z"),
    })
    await POST(
      new NextRequest("https://x", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "svix-id": "evt-ooo-2",
          "svix-timestamp": "1",
          "svix-signature": "s",
        },
      }),
    )
    // opened (anterieur) recu en 3e
    mockVerify.mockReturnValueOnce({
      type: "email.opened",
      created_at: "2026-07-13T10:00:02.000Z",
      data: { email_id: "resend-ooo" },
    })
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d-ooo",
      status: "SENT",
      lastEventAt: new Date("2026-07-13T10:00:05.000Z"),
    })
    await POST(
      new NextRequest("https://x", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "svix-id": "evt-ooo-3",
          "svix-timestamp": "1",
          "svix-signature": "s",
        },
      }),
    )
    // Le delivery doit etre reste SENT (opened anterieur ignore, pas de downgrade)
    const updates = (prisma.notificationDelivery.update as any).mock.calls
    const lastUpdate = updates[updates.length - 1][0]
    // le dernier update etait pour delivered, status SENT
    expect(lastUpdate.data.status).toBe("SENT")
  })

  it("terminal negatif (bounced) s'applique TOUJOURS meme si en retard (Sprint 2 #65)", async () => {
    // delivered a deja ete applique
    ;(prisma.notificationDelivery.findFirst as any).mockResolvedValue({
      id: "d-term",
      status: "SENT",
      lastEventAt: new Date("2026-07-13T10:00:05.000Z"),
    })
    // bounced anterieur (devrait quand meme s'appliquer)
    mockVerify.mockReturnValue({
      type: "email.bounced",
      created_at: "2026-07-13T10:00:02.000Z", // anterieur
      data: { email_id: "resend-term", bounce: { message: "Mailbox full" } },
    })
    const res = await POST(makeRequest({ type: "email.bounced", data: { email_id: "resend-term", bounce: { message: "Mailbox full" } } }))
    expect(res.status).toBe(200)
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d-term" },
        data: expect.objectContaining({ status: "BOUNCED" }),
      }),
    )
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockNotifCreate, mockDeliveryCreate, mockDeliveryUpdate, mockSendPush } = vi.hoisted(() => {
  const mockDeliveryCreate = vi.fn()
  const mockDeliveryUpdate = vi.fn()
  const mockNotifCreate = vi.fn()
  const mockSendPush = vi.fn().mockResolvedValue({ sent: 1, failed: 0 })
  return { mockNotifCreate, mockDeliveryCreate, mockDeliveryUpdate, mockSendPush }
})

vi.mock("@nba/lib/db", () => ({
  prisma: {
    notification: { create: mockNotifCreate },
    notificationDelivery: { create: mockDeliveryCreate, update: mockDeliveryUpdate },
    $transaction: vi.fn(async (cb: (tx: any) => any) => cb({
      notificationDelivery: { create: mockDeliveryCreate },
    })),
  },
}))

import { notify, sendEmailSync, sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail, sendOtpEmail } from "./notifications"
import { sendPushToUser } from "./push"

vi.mock("@nba/lib/email", () => ({
  sendEmail: vi.fn(),
  verificationEmail: vi.fn().mockReturnValue({ subject: "Verify", html: "<p>verify</p>" }),
  welcomeEmail: vi.fn().mockReturnValue({ subject: "Welcome", html: "<p>welcome</p>" }),
  resetPasswordEmail: vi.fn().mockReturnValue({ subject: "Reset", html: "<p>reset</p>" }),
  emailOtp: vi.fn().mockReturnValue({ subject: "OTP", html: "<p>otp</p>" }),
}))

vi.mock("@nba/lib/queue", () => ({
  getQueue: vi.fn().mockReturnValue({
    add: vi.fn().mockResolvedValue({ id: "job-1" }),
  }),
}))

vi.mock("./push", () => ({
  sendPushToUser: mockSendPush,
}))

import { sendEmail } from "@nba/lib/email"
import { getQueue } from "@nba/lib/queue"

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotifCreate.mockResolvedValue({ id: "notif-1" } as any)
    mockDeliveryCreate.mockResolvedValue({ id: "delivery-1" } as any)
    mockDeliveryUpdate.mockResolvedValue({ id: "delivery-1" } as any)
  })

  it("creates an in-app notification", async () => {
    await notify({
      userId: "user-1",
      type: "SIGNAL",
      title: "Nouveau signal",
      body: "Un signal vient d'être publié",
    })

    expect(mockNotifCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "SIGNAL",
        title: "Nouveau signal",
        body: "Un signal vient d'être publié",
        data: {},
      },
    })
  })

  it("does not enqueue email when email param is missing", async () => {
    await notify({
      userId: "user-1",
      type: "SIGNAL",
      title: "Nouveau signal",
      body: "Test",
    })

    // Aucune livraison EMAIL créée (mais une livraison PUSH oui)
    const emailCreates = (mockDeliveryCreate.mock.calls as any[]).filter(
      (c) => c[0]?.data?.channel === "EMAIL",
    )
    expect(emailCreates.length).toBe(0)
    expect(getQueue).not.toHaveBeenCalled()
  })

  it("enqueues email delivery when email param is provided", async () => {
    await notify({
      userId: "user-1",
      type: "SIGNAL",
      title: "Nouveau signal",
      body: "Test",
      email: {
        to: "test@example.com",
        subject: "Signal important",
        html: "<p>contenu</p>",
      },
    })

    expect(mockDeliveryCreate).toHaveBeenCalledWith({
      data: {
        notificationId: "notif-1",
        channel: "EMAIL",
        status: "PENDING",
      },
    })

    const queue = getQueue("notification-delivery")
    expect(queue.add).toHaveBeenCalledWith(
      "email-notif-1",
      {
        deliveryId: "delivery-1",
        to: "test@example.com",
        subject: "Signal important",
        html: "<p>contenu</p>",
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    )
  })

  it("tracks a PUSH delivery (PENDING) and marks it SENT after successful push", async () => {
    await notify({
      userId: "user-1",
      type: "SYSTEM",
      title: "Test",
      body: "Body",
    })

    // 1 livraison PUSH créée en PENDING
    const pushCreate = (mockDeliveryCreate.mock.calls as any[]).find(
      (c) => c[0]?.data?.channel === "PUSH",
    )
    expect(pushCreate).toBeDefined()
    expect(pushCreate[0].data.status).toBe("PENDING")

    // laisse le fire-and-forget se résoudre
    await new Promise((r) => setTimeout(r, 10))

    expect(mockSendPush).toHaveBeenCalled()
    expect(mockDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "SENT" } }),
    )
  })

  it("marks PUSH delivery FAILED when push returns failed>0", async () => {
    mockSendPush.mockResolvedValueOnce({ sent: 0, failed: 1 } as any)
    await notify({
      userId: "user-1",
      type: "SYSTEM",
      title: "Test",
      body: "Body",
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(mockDeliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    )
  })

  it("passes custom data to the notification", async () => {
    await notify({
      userId: "user-1",
      type: "KYC",
      title: "KYC approuvé",
      body: "Votre document a été validé",
      data: { documentId: "doc-1", status: "APPROVED" },
    })

    expect(mockNotifCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          data: { documentId: "doc-1", status: "APPROVED" },
        }),
      }),
    )
  })

  it("returns the notification id", async () => {
    const result = await notify({
      userId: "user-1",
      type: "SYSTEM",
      title: "Test",
      body: "Body",
    })

    expect(result).toEqual({ id: "notif-1" })
  })
})

describe("sendEmailSync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends email immediately via sendEmail", async () => {
    vi.mocked(sendEmail).mockResolvedValue(undefined as any)

    await sendEmailSync("user@test.com", "Subject", "<p>html</p>")

    expect(sendEmail).toHaveBeenCalledWith("user@test.com", {
      subject: "Subject",
      html: "<p>html</p>",
    })
  })

  it("throws when sendEmail fails", async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error("Resend error"))

    await expect(sendEmailSync("user@test.com", "Subject", "<p>html</p>")).rejects.toThrow("Resend error")
  })
})

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendEmail).mockResolvedValue(undefined as any)
  })

  it("sends verification email with correct params", async () => {
    const user = { id: "u1", name: "Jean Dupont", email: "jean@test.com" }
    const url = "https://example.com/verify?token=abc"

    await sendVerificationEmail(user, url)

    expect(sendEmail).toHaveBeenCalledWith("jean@test.com", {
      subject: "Verify",
      html: "<p>verify</p>",
    })
  })
})

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendEmail).mockResolvedValue(undefined as any)
  })

  it("sends welcome email with correct params", async () => {
    const user = { id: "u1", name: "Marie Curie", email: "marie@test.com" }

    await sendWelcomeEmail(user)

    expect(sendEmail).toHaveBeenCalledWith("marie@test.com", {
      subject: "Welcome",
      html: "<p>welcome</p>",
    })
  })
})

describe("sendResetPasswordEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendEmail).mockResolvedValue(undefined as any)
  })

  it("sends reset password email with correct params", async () => {
    const user = { id: "u1", name: "Paul Martin", email: "paul@test.com" }
    const url = "https://example.com/reset?token=xyz"

    await sendResetPasswordEmail(user, url)

    expect(sendEmail).toHaveBeenCalledWith("paul@test.com", {
      subject: "Reset",
      html: "<p>reset</p>",
    })
  })
})

describe("sendOtpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendEmail).mockResolvedValue(undefined as any)
  })

  it("sends OTP email with correct params and code formatting", async () => {
    await sendOtpEmail("Jean", "jean@test.com", "482917")

    expect(sendEmail).toHaveBeenCalledWith("jean@test.com", {
      subject: "OTP",
      html: "<p>otp</p>",
    })
  })
})

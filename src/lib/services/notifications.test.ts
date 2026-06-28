import { describe, it, expect, vi, beforeEach } from "vitest"
import { notify, sendEmailSync, sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail, sendOtpEmail } from "./notifications"

vi.mock("@nba/lib/db", () => ({
  prisma: {
    notification: {
      create: vi.fn(),
    },
    notificationDelivery: {
      create: vi.fn(),
    },
  },
}))

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

import { prisma } from "@nba/lib/db"
import { sendEmail } from "@nba/lib/email"
import { getQueue } from "@nba/lib/queue"

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "notif-1" } as any)
    vi.mocked(prisma.notificationDelivery.create).mockResolvedValue({ id: "delivery-1" } as any)
  })

  it("creates an in-app notification", async () => {
    await notify({
      userId: "user-1",
      type: "SIGNAL",
      title: "Nouveau signal",
      body: "Un signal vient d'être publié",
    })

    expect(prisma.notification.create).toHaveBeenCalledWith({
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

    expect(prisma.notificationDelivery.create).not.toHaveBeenCalled()
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

    expect(prisma.notificationDelivery.create).toHaveBeenCalledWith({
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

  it("passes custom data to the notification", async () => {
    await notify({
      userId: "user-1",
      type: "KYC",
      title: "KYC approuvé",
      body: "Votre document a été validé",
      data: { documentId: "doc-1", status: "APPROVED" },
    })

    expect(prisma.notification.create).toHaveBeenCalledWith(
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

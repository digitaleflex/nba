import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../../db", () => ({
  prisma: {
    loginAttempt: { create: vi.fn() },
  },
}))

vi.mock("../../services/audit", () => ({
  logAuditEvent: vi.fn(async () => {}),
}))

vi.mock("../security-event-bus", () => ({
  securityEventBus: { emit: vi.fn(async () => "evt-id") },
}))

vi.mock("../../logger", () => ({
  logger: {
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

import { recordAuthAttempt } from "../auth-attempt-recorder"
import { prisma } from "../../db"
import { logAuditEvent } from "../../services/audit"
import { securityEventBus } from "../security-event-bus"

const mockLoginAttemptCreate = prisma.loginAttempt.create as ReturnType<typeof vi.fn>

describe("recordAuthAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoginAttemptCreate.mockResolvedValue({ id: "att-1" })
  })

  it("enregistre une connexion réussie sans événement sécurité", async () => {
    await recordAuthAttempt({
      email: "  User@Example.COM ",
      type: "LOGIN",
      success: true,
      ipAddress: "1.2.3.4",
      userAgent: "ua",
      userId: "user-1",
    })

    expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "user@example.com",
        success: true,
        type: "LOGIN",
        userId: "user-1",
        ipAddress: "1.2.3.4",
      }),
    })
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOGIN_SUCCESS",
        resourceLabel: "user@example.com",
      }),
    )
    expect(securityEventBus.emit).not.toHaveBeenCalled()
  })

  it("enregistre un échec de connexion et émet LOGIN_FAILED quand un compte existe", async () => {
    await recordAuthAttempt({
      email: "user@example.com",
      type: "LOGIN",
      success: false,
      ipAddress: "1.2.3.4",
      userId: "user-1",
      reason: "Invalid email or password",
      status: 401,
    })

    expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "user@example.com",
        success: false,
        type: "LOGIN",
        reason: "Invalid email or password",
        userId: "user-1",
      }),
    })
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "LOGIN_FAILED" }),
    )
    expect(securityEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "LOGIN_FAILED",
        severity: "WARNING",
        details: expect.objectContaining({ reason: "Invalid email or password", status: 401 }),
      }),
    )
  })

  it("n'émet pas d'événement sécurité pour un email inconnu (pas de userId)", async () => {
    await recordAuthAttempt({
      email: "unknown@example.com",
      type: "LOGIN",
      success: false,
      userId: null,
    })

    expect(prisma.loginAttempt.create).toHaveBeenCalledTimes(1)
    expect(logAuditEvent).toHaveBeenCalledTimes(1)
    expect(securityEventBus.emit).not.toHaveBeenCalled()
  })

  it("enregistre un échec d'inscription sans événement LOGIN_FAILED", async () => {
    await recordAuthAttempt({
      email: "new@example.com",
      type: "SIGNUP",
      success: false,
      ipAddress: "9.9.9.9",
      reason: "password too short",
      status: 422,
    })

    expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "SIGNUP",
        success: false,
        reason: "password too short",
      }),
    })
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "SIGNUP_FAILED", resourceType: "user" }),
    )
    expect(securityEventBus.emit).not.toHaveBeenCalled()
  })

  it("ne fait pas planter la tentative si la création en base échoue", async () => {
    mockLoginAttemptCreate.mockRejectedValueOnce(new Error("db down"))

    await expect(
      recordAuthAttempt({ email: "a@b.com", type: "LOGIN", success: true }),
    ).resolves.toBeUndefined()

    expect(logAuditEvent).toHaveBeenCalledTimes(1)
  })
})

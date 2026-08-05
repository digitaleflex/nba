import { msg } from "../messages"
import { randomInt } from "crypto"
import { prisma } from "../db"
import { parseUserAgent, type ParsedUserAgent } from "../ua-parser"
import { sendDeviceVerificationEmail } from "./notifications"

function generateCode(): string {
  return String(randomInt(100_000, 999_999))
}

import { createHash } from "crypto"

export function fingerprint(req: Request): string {
  const ua = req.headers.get("user-agent") ?? ""
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"

  // Priorité au cookie FingerprintJS (navigateur fiable)
  const cookie = req.headers.get("cookie") || ""
  const fpMatch = cookie.match(/(?:^|;\s*)nba_fp=([^;]+)/)
  if (fpMatch) return fpMatch[1]

  // Fallback : hash IP|UA
  const hash = createHash("sha256").update(`${ip}|${ua}`).digest("hex")
  return hash
}

function deviceInfo(req: Request): ParsedUserAgent {
  const ua = req.headers.get("user-agent") ?? null
  return parseUserAgent(ua)
}

export async function detectNewDevice(userId: string, req: Request): Promise<{ isNew: boolean; deviceId?: string; trustLevel?: string }> {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"

  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint: fp } },
  })

  const ua = req.headers.get("user-agent") ?? ""

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        ipAddress: ip,
        userAgent: ua,
        deviceType: parsed.deviceType,
        brand: parsed.brand,
        model: parsed.model,
        os: parsed.os,
        browser: parsed.browser,
      },
    })
    return { isNew: false, deviceId: existing.id, trustLevel: existing.trustLevel }
  }

  const device = await prisma.device.create({
    data: {
      userId,
      fingerprint: fp,
      ipAddress: ip,
      userAgent: ua,
      deviceType: parsed.deviceType,
      brand: parsed.brand,
      model: parsed.model,
      os: parsed.os,
      browser: parsed.browser,
      name: `Appareil - ${new Date().toLocaleDateString()}`,
      trustLevel: "UNKNOWN",
      firstSeenAt: new Date(),
    },
  })

  return { isNew: true, deviceId: device.id, trustLevel: "UNKNOWN" }
}

export async function sendVerificationCode(userId: string, email: string, req: Request) {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const ua = req.headers.get("user-agent") ?? ""

  await prisma.deviceVerification.create({
    data: {
      userId,
      deviceFingerprint: fp,
      ipAddress: ip,
      userAgent: ua,
      deviceType: parsed.deviceType,
      brand: parsed.brand,
      model: parsed.model,
      os: parsed.os,
      browser: parsed.browser,
      verificationCode: code,
      expiresAt,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  if (user) {
    await sendDeviceVerificationEmail(user.name, email, code, userId)
  }
}

export async function verifyDeviceCode(userId: string, code: string, req: Request) {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  const ua = req.headers.get("user-agent") ?? ""

  const verification = await prisma.deviceVerification.findFirst({
    where: {
      userId,
      deviceFingerprint: fp,
      verificationCode: code,
      expiresAt: { gte: new Date() },
      verifiedAt: null,
    },
  })

  if (!verification) {
    throw new Error(msg.onboarding.CODE_INVALID)
  }

  await prisma.deviceVerification.update({
    where: { id: verification.id },
    data: { verifiedAt: new Date() },
  })

  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint: fp } },
  })

  if (!existing) {
    await prisma.device.create({
      data: {
        userId,
        fingerprint: fp,
        ipAddress: ip,
        userAgent: ua,
        deviceType: parsed.deviceType,
        brand: parsed.brand,
        model: parsed.model,
        os: parsed.os,
        browser: parsed.browser,
        name: `Appareil - ${new Date().toLocaleDateString()}`,
        trustLevel: "VERIFIED",
        firstSeenAt: new Date(),
      },
    })
  } else {
    await prisma.device.update({
      where: { id: existing.id },
      data: { trustLevel: "VERIFIED" },
    })
  }

  return true
}

export async function getUserDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  })
}

export async function revokeDevice(deviceId: string, userId: string) {
  await prisma.device.updateMany({
    where: { id: deviceId, userId },
    data: { trustLevel: "BLOCKED" },
  })
}

export async function renameDevice(deviceId: string, name: string, userId: string) {
  await prisma.device.updateMany({
    where: { id: deviceId, userId },
    data: { name },
  })
}

export async function revokeOtherDevices(currentDeviceId: string, userId: string) {
  await prisma.device.updateMany({
    where: { userId, id: { not: currentDeviceId } },
    data: { trustLevel: "BLOCKED" },
  })
}

export async function trustDevice(deviceId: string, userId: string): Promise<void> {
  await prisma.device.updateMany({
    where: { id: deviceId, userId },
    data: {
      trustLevel: "TRUSTED",
      trustedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
}

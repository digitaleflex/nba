import { msg } from "../messages"
import { randomInt } from "crypto"
import { prisma } from "../db"
import { parseUserAgent, type ParsedUserAgent } from "../ua-parser"
import { sendDeviceVerificationEmail } from "./notifications"

function generateCode(): string {
  return String(randomInt(100_000, 999_999))
}

function fingerprint(req: Request): string {
  const ua = req.headers.get("user-agent") ?? ""
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  return `${ip}|${ua}`
}

function deviceInfo(req: Request): ParsedUserAgent {
  const ua = req.headers.get("user-agent") ?? null
  return parseUserAgent(ua)
}

export async function detectNewDevice(userId: string, req: Request): Promise<boolean> {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)

  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint: fp } },
  })

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        ipAddress: fp.split("|")[0],
        userAgent: fp.split("|")[1],
        deviceType: parsed.deviceType,
        brand: parsed.brand,
        model: parsed.model,
        os: parsed.os,
        browser: parsed.browser,
      },
    })
    return false
  }

  return true
}

export async function sendVerificationCode(userId: string, email: string, req: Request) {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.deviceVerification.create({
    data: {
      userId,
      deviceFingerprint: fp,
      ipAddress: fp.split("|")[0],
      userAgent: fp.split("|")[1],
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
    await sendDeviceVerificationEmail(user.name, email, code)
  }
}

export async function verifyDeviceCode(userId: string, code: string, req: Request) {
  const fp = fingerprint(req)
  const parsed = deviceInfo(req)

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
        ipAddress: fp.split("|")[0],
        userAgent: fp.split("|")[1],
        deviceType: parsed.deviceType,
        brand: parsed.brand,
        model: parsed.model,
        os: parsed.os,
        browser: parsed.browser,
        name: `Appareil - ${new Date().toLocaleDateString()}`,
      },
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
  await prisma.device.deleteMany({
    where: { id: deviceId, userId },
  })
}

export async function renameDevice(deviceId: string, name: string, userId: string) {
  await prisma.device.updateMany({
    where: { id: deviceId, userId },
    data: { name },
  })
}

export async function revokeOtherDevices(currentDeviceId: string, userId: string) {
  await prisma.device.deleteMany({
    where: { userId, id: { not: currentDeviceId } },
  })
}

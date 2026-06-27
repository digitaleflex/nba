import { randomInt } from "crypto"
import { prisma } from "../db"
import { Resend } from "resend"

function generateCode(): string {
  return String(randomInt(100_000, 999_999))
}

function fingerprint(req: Request): string {
  const ua = req.headers.get("user-agent") ?? ""
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  return `${ip}|${ua}`
}

export async function detectNewDevice(userId: string, req: Request): Promise<boolean> {
  const fp = fingerprint(req)

  const existing = await prisma.device.findUnique({
    where: { userId_fingerprint: { userId, fingerprint: fp } },
  })

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), ipAddress: fp.split("|")[0], userAgent: fp.split("|")[1] },
    })
    return false
  }

  return true
}

export async function sendVerificationCode(userId: string, email: string, req: Request) {
  const fp = fingerprint(req)
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.deviceVerification.create({
    data: {
      userId,
      deviceFingerprint: fp,
      ipAddress: fp.split("|")[0],
      userAgent: fp.split("|")[1],
      verificationCode: code,
      expiresAt,
    },
  })

  const resendApiKey = process.env.RESEND_API_KEY
  if (resendApiKey && resendApiKey !== "re_xxxxxxxxxxxx") {
    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@signauxx.com",
      to: email,
      subject: "Vérification de votre appareil — NeverBrokeAgain",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Nouvel appareil détecté</h2>
          <p>Utilisez le code ci-dessous pour vérifier votre appareil :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #71717a;">Ce code expire dans 10 minutes.</p>
          <p style="color: #71717a;">Si vous n'êtes pas à l'origine de cette connexion, ignorez cet email.</p>
        </div>
      `,
    })
  }
}

export async function verifyDeviceCode(userId: string, code: string, req: Request) {
  const fp = fingerprint(req)

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
    throw new Error("Code invalide ou expiré")
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

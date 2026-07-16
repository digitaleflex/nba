import { prisma } from "@nba/lib/db"

interface BannedEmail {
  email: string
  reason: string
  bannedBy: string
  bannedAt: string
}

const BAN_SETTING_KEY = "moderation:banned_emails"

async function getBannedEmails(): Promise<BannedEmail[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: BAN_SETTING_KEY },
    select: { value: true },
  })
  return (setting?.value as any) || []
}

async function setBannedEmails(emails: BannedEmail[]): Promise<void> {
  await prisma.setting.upsert({
    where: { key: BAN_SETTING_KEY },
    create: { key: BAN_SETTING_KEY, value: emails as any },
    update: { value: emails as any },
  })
}

export async function banEmail(entry: {
  email: string
  reason: string
  bannedBy: string
}): Promise<void> {
  const emails = await getBannedEmails()
  if (emails.some((e) => e.email.toLowerCase() === entry.email.toLowerCase())) return

  emails.push({
    email: entry.email.toLowerCase(),
    reason: entry.reason,
    bannedBy: entry.bannedBy,
    bannedAt: new Date().toISOString(),
  })

  await setBannedEmails(emails)

  // Soft-delete user + revoke sessions
  await prisma.user.updateMany({
    where: { email: entry.email.toLowerCase() },
    data: { deletedAt: new Date(), isActive: false },
  })

  const users = await prisma.user.findMany({
    where: { email: entry.email.toLowerCase() },
    select: { id: true },
  })
  for (const u of users) {
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: u.id } }),
      prisma.account.deleteMany({ where: { userId: u.id } }),
    ])
  }

  await prisma.auditLog.create({
    data: {
      action: "admin.ban",
      resourceType: "user",
      resourceId: entry.email,
      details: { reason: entry.reason, bannedBy: entry.bannedBy } as any,
    },
  }).catch(() => {})
}

export async function unbanEmail(email: string): Promise<void> {
  const emails = await getBannedEmails()
  const filtered = emails.filter((e) => e.email.toLowerCase() !== email.toLowerCase())
  if (filtered.length === emails.length) return
  await setBannedEmails(filtered)
  await prisma.auditLog.create({
    data: {
      action: "admin.unban",
      resourceType: "user",
      resourceId: email,
      details: {} as any,
    },
  }).catch(() => {})
}

export async function isEmailBanned(email: string): Promise<BannedEmail | null> {
  const emails = await getBannedEmails()
  return emails.find((e) => e.email.toLowerCase() === email.toLowerCase()) || null
}

export async function getBannedList(): Promise<BannedEmail[]> {
  return getBannedEmails()
}

export async function getRelevantIps(userId: string): Promise<string[]> {
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    select: { details: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const ips = new Set<string>()
  for (const log of logs) {
    const details = log.details as any
    if (details?.ip) ips.add(details.ip)
    if (details?.userAgent) ips.add("UA:" + details.userAgent.substring(0, 60))
  }
  return Array.from(ips).filter((i) => !i.startsWith("UA:"))
}

export async function findRelatedUsersByIp(userId: string): Promise<{ id: string; name: string; email: string }[]> {
  const userLogs = await prisma.auditLog.findMany({
    where: { userId },
    select: { details: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const detailsList = userLogs.map((l) => l.details as any)
  const ips = new Set<string>()
  for (const d of detailsList) {
    const ip = d?.ip || d?.ipAddress
    if (ip && typeof ip === "string") ips.add(ip)
  }

  if (ips.size === 0) return []

  const relatedLogs = await prisma.auditLog.findMany({
    where: {
      userId: { not: userId },
      OR: Array.from(ips).map((ip) => ({
        details: { path: ["ip"], equals: ip },
      })),
    },
    select: { userId: true },
    distinct: ["userId"],
    take: 20,
  })

  const ids = [...new Set(relatedLogs.map((r) => r.userId).filter(Boolean))] as string[]
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, email: true },
  })

  return users
}
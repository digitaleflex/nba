import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const alerts: {
      type: string
      severity: "high" | "medium" | "low"
      title: string
      detail: string
      users: { name: string; email: string; count: number }[]
    }[] = []

    // 1. IP partagée entre plusieurs comptes → partage d'accès suspect
    const sharedIps = await prisma.$queryRawUnsafe<{ ip_address: string; user_count: number }[]>(
      `SELECT ip_address, COUNT(DISTINCT user_id) as user_count
       FROM devices
       WHERE ip_address IS NOT NULL
         AND ip_address != ''
         AND ip_address != 'unknown'
       GROUP BY ip_address
       HAVING COUNT(DISTINCT user_id) > 1
       ORDER BY user_count DESC
       LIMIT 10`
    )

    if (sharedIps.length > 0) {
      const ipAlerts: typeof alerts[0]["users"] = []
      for (const row of sharedIps) {
        const users = await prisma.device.findMany({
          where: { ipAddress: row.ip_address },
          select: { user: { select: { name: true, email: true } } },
          distinct: ["userId"],
        })
        for (const u of users) {
          ipAlerts.push({ name: u.user?.name ?? "?", email: u.user?.email ?? "?", count: row.user_count })
        }
      }
      alerts.push({
        type: "shared_ip",
        severity: "high",
        title: "IP partagée entre plusieurs comptes",
        detail: `${sharedIps.length} IP(s) utilisée(s) par plusieurs utilisateurs différents. Risque de partage de compte ou d'accès non autorisé.`,
        users: ipAlerts.slice(0, 10),
      })
    }

    // 2. Utilisateurs avec trop d'appareils (>5)
    const multiDevice = await prisma.$queryRawUnsafe<{ name: string; email: string; device_count: number }[]>(
      `SELECT u.name, u.email, COUNT(d.id) as device_count
       FROM devices d
       JOIN users u ON u.id = d.user_id
       GROUP BY u.id, u.name, u.email
       HAVING COUNT(d.id) > 5
       ORDER BY device_count DESC
       LIMIT 10`
    )

    if (multiDevice.length > 0) {
      alerts.push({
        type: "many_devices",
        severity: "medium",
        title: "Utilisateurs avec de nombreux appareils",
        detail: `${multiDevice.length} utilisateur(s) avec plus de 5 appareils enregistrés. Possible partage de compte.`,
        users: multiDevice.map(r => ({ name: r.name ?? "?", email: r.email ?? "?", count: r.device_count })),
      })
    }

    // 3. Fingerprint identique sur plusieurs comptes (même appareil, comptes ≠)
    const sharedFp = await prisma.$queryRawUnsafe<{ fingerprint: string; user_count: number }[]>(
      `SELECT fingerprint, COUNT(DISTINCT user_id) as user_count
       FROM devices
       WHERE fingerprint IS NOT NULL
         AND fingerprint != ''
         AND fingerprint NOT LIKE '|%'
       GROUP BY fingerprint
       HAVING COUNT(DISTINCT user_id) > 1
       ORDER BY user_count DESC
       LIMIT 10`
    )

    if (sharedFp.length > 0) {
      const fpAlerts: typeof alerts[0]["users"] = []
      for (const row of sharedFp) {
        const users = await prisma.device.findMany({
          where: { fingerprint: row.fingerprint },
          select: { user: { select: { name: true, email: true } } },
          distinct: ["userId"],
        })
        for (const u of users) {
          fpAlerts.push({ name: u.user?.name ?? "?", email: u.user?.email ?? "?", count: row.user_count })
        }
      }
      alerts.push({
        type: "shared_fingerprint",
        severity: "high",
        title: "Même appareil utilisé par plusieurs comptes",
        detail: `${sharedFp.length} appareil(s) utilisé(s) par plusieurs comptes ≠. Forte suspicion de compte partagé.`,
        users: fpAlerts.slice(0, 10),
      })
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    return handleAuthError(error)
  }
}

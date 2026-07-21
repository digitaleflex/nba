import { prisma } from "@nba/lib/db"
import { listDlq } from "./email-webhooks"

export type InboxCategory = "pending" | "security" | "system" | "messages"
export type InboxAction = "approve" | "reject" | "snooze" | "investigate" | "dismiss"

export interface InboxItem {
  id: string // composite: kyc:<uuid>, broker:<uuid>, dlq:<uuid>, anomaly:<uuid>
  category: InboxCategory
  title: string
  subtitle: string
  link: string // where to navigate to act
  createdAt: string
  actions: InboxAction[]
}

const DISMISS_KEY = "admin_inbox_dismissed"
const SNOOZE_KEY = "admin_inbox_snoozed" // id -> ISO expiry

async function loadJson(key: string): Promise<string[]> {
  const row = await prisma.setting.findUnique({ where: { key } }).catch(() => null)
  if (!row) return []
  try {
    const parsed = JSON.parse(row.value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveJson(key: string, values: string[]) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(values) },
    create: { key, value: JSON.stringify(values), description: "Admin inbox state" },
  })
}

export async function getDismissed(): Promise<string[]> {
  return loadJson(DISMISS_KEY)
}

export async function dismissItem(id: string): Promise<void> {
  const current = await loadJson(DISMISS_KEY)
  if (!current.includes(id)) current.push(id)
  await saveJson(DISMISS_KEY, current)
}

export async function snoozeItem(id: string, hours = 8): Promise<void> {
  const current = await loadJson(SNOOZE_KEY)
  const next = current.filter((e) => e.split("@")[0] !== id)
  next.push(`${id}@${(Date.now() + hours * 3600 * 1000).toString()}`)
  await saveJson(SNOOZE_KEY, next)
}

async function loadSnoozed(): Promise<string[]> {
  const items = await loadJson(SNOOZE_KEY)
  const now = Date.now()
  const active: string[] = []
  let pruned = false
  for (const e of items) {
    const idx = e.lastIndexOf("@")
    const exp = idx >= 0 ? Number(e.slice(idx + 1)) : 0
    if (exp > now) active.push(e)
    else pruned = true
  }
  // Prune expired entries so the Setting row does not grow unbounded.
  if (pruned) await saveJson(SNOOZE_KEY, active).catch(() => {
    // Non-critical pruning, best-effort
  })
  return active
}

export async function getInbox(category?: string): Promise<{ items: InboxItem[]; total: number }> {
  const dismissed = await getDismissed()
  const snoozed = await loadSnoozed()
  const isDismissed = (id: string) => dismissed.includes(id)
  const isSnoozed = (id: string) => snoozed.some((e) => e.split("@")[0] === id)

  const [kycDocs, brokerDocs, dlq, security] = await Promise.all([
    prisma.kycDocument.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.brokerVerification.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    listDlq({ status: "PENDING", limit: 50 }).catch(() => []),
    prisma.auditLog.findMany({
      where: { action: "LOGIN_FAILED" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
  ])

  const items: InboxItem[] = []

  for (const doc of kycDocs) {
    const id = `kyc:${doc.id}`
    if (isDismissed(id)) continue
    items.push({
      id,
      category: "pending",
      title: `KYC à valider — ${doc.user?.name ?? "Inconnu"}`,
      subtitle: `${doc.documentType} · ${doc.user?.email ?? ""}`,
      link: `/admin?tab=kyc&id=${doc.id}`,
      createdAt: doc.createdAt.toISOString(),
      actions: ["approve", "reject", "snooze", "investigate"],
    })
  }

  for (const doc of brokerDocs) {
    const id = `broker:${doc.id}`
    if (isDismissed(id)) continue
    items.push({
      id,
      category: "pending",
      title: `Broker à valider — ${doc.user?.name ?? "Inconnu"}`,
      subtitle: `${doc.brokerName} · ${doc.accountId}`,
      link: `/admin?tab=broker&id=${doc.id}`,
      createdAt: doc.createdAt.toISOString(),
      actions: ["approve", "reject", "snooze", "investigate"],
    })
  }

  for (const item of dlq) {
    const id = `dlq:${item.id}`
    if (isDismissed(id)) continue
    items.push({
      id,
      category: "system",
      title: `Webhook en échec — ${item.eventType ?? item.source ?? "DLQ"}`,
      subtitle: item.lastError ? String(item.lastError).slice(0, 80) : "À rejouer ou abandonner",
      link: `/admin?tab=dashboard`,
      createdAt: new Date(item.createdAt).toISOString(),
      actions: ["investigate", "snooze", "dismiss"],
    })
  }

  for (const log of security) {
    const id = `anomaly:${log.id}`
    if (isDismissed(id)) continue
    if (isSnoozed(id)) continue
    const details = (log.details ?? {}) as { email?: string; ipAddress?: string; reason?: string }
    const who = details.email ?? log.user?.email ?? log.user?.name ?? "Compte inconnu"
    items.push({
      id,
      category: "security",
      title: `Tentative de connexion échouée`,
      subtitle: `${who} · ${details.ipAddress ?? ""} · ${new Date(log.createdAt).toLocaleString("fr-FR")}`,
      link: `/admin?tab=security`,
      createdAt: log.createdAt.toISOString(),
      actions: ["investigate", "snooze", "dismiss"],
    })
  }

  // Filter by category if requested
  const filtered = category && category !== "all" ? items.filter((i) => i.category === category) : items
  // Sort by recency
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return { items: filtered, total: filtered.length }
}

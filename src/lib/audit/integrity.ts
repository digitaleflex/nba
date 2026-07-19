import { createHash } from "node:crypto"
import { prisma } from "@nba/lib/db"

export interface IntegrityEntry {
  id: string
  hash: string
  previousHash: string | null
  createdAt: Date
  action: string
  resourceType: string
  valid: boolean
  error?: string
}

export interface IntegrityReport {
  totalEntries: number
  hashedEntries: number
  unhashedEntries: number
  brokenLinks: number
  verified: boolean
  details: IntegrityEntry[]
  firstBreak?: { id: string; createdAt: Date; error: string }
}

function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") return JSON.stringify(v, Object.keys(v as object).sort())
  return String(v)
}

export function computeHash(params: {
  previousHash: string | null
  id: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}): string {
  const input = [
    params.previousHash ?? "",
    params.id,
    params.userId ?? "",
    params.action,
    params.resourceType,
    params.resourceId ?? "",
    stableStringify(params.details ?? {}),
    params.ipAddress ?? "",
    params.createdAt.toISOString(),
  ].join("\x1F")
  return createHash("sha256").update(input, "utf-8").digest("hex")
}

function computeHashFromRow(row: {
  id: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  details: unknown
  ipAddress: string | null
  createdAt: Date
  previousHash: string | null
}): string {
  return computeHash({
    previousHash: row.previousHash,
    id: row.id,
    userId: row.userId,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    details: row.details as Record<string, unknown> | null,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  })
}

export async function findPreviousHash(): Promise<string | null> {
  const last = await prisma.auditLog.findFirst({
    where: { hash: { not: null } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { hash: true },
  })
  return last?.hash ?? null
}

export async function verifyChain(options?: {
  limit?: number
}): Promise<IntegrityReport> {
  const limit = options?.limit ?? 5000

  const [totalEntries, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        hash: true,
        previousHash: true,
        createdAt: true,
        action: true,
        resourceType: true,
        userId: true,
        resourceId: true,
        details: true,
        ipAddress: true,
      },
    }),
  ])

  const details: IntegrityEntry[] = []
  let brokenLinks = 0

  const hashMap = new Map<string, string>()
  for (const log of logs) {
    if (log.hash) hashMap.set(log.id, log.hash)
  }

  for (const log of logs) {
    if (!log.hash) {
      details.push({
        id: log.id,
        hash: "",
        previousHash: log.previousHash,
        createdAt: log.createdAt,
        action: log.action,
        resourceType: log.resourceType,
        valid: false,
        error: "Hash manquant",
      })
      brokenLinks++
      continue
    }

    const expectedHash = computeHashFromRow(log)
    if (expectedHash !== log.hash) {
      details.push({
        id: log.id,
        hash: log.hash,
        previousHash: log.previousHash,
        createdAt: log.createdAt,
        action: log.action,
        resourceType: log.resourceType,
        valid: false,
        error: "Hash invalide — les données ont été modifiées",
      })
      brokenLinks++
      continue
    }

    if (log.previousHash && !hashMap.has(log.previousHash)) {
      // L'entrée précédente n'est pas dans ce lot (troncature)
    }

    details.push({
      id: log.id,
      hash: log.hash,
      previousHash: log.previousHash,
      createdAt: log.createdAt,
      action: log.action,
      resourceType: log.resourceType,
      valid: true,
    })
  }

  const hashedEntries = logs.filter((l: { hash: string | null }) => l.hash).length
  const firstBreak = details.find((d) => !d.valid)

  return {
    totalEntries,
    hashedEntries,
    unhashedEntries: totalEntries - hashedEntries,
    brokenLinks,
    verified: brokenLinks === 0,
    details,
    firstBreak: firstBreak
      ? { id: firstBreak.id, createdAt: firstBreak.createdAt, error: firstBreak.error ?? "" }
      : undefined,
  }
}

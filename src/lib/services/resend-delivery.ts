import { Resend } from "resend"

// In-memory cache to avoid hammering the Resend API on every Tracker load.
// Keyed by Resend message id, with a short TTL.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { status: ResendEmailStatus | null; ts: number }>()

export interface ResendEmailStatus {
  id: string
  last_event: string | null
  created_at: string | null
  delivered_at: string | null
  bounced_at: string | null
  complained_at: string | null
  opened_at: string | null
  clicked_at: string | null
  subject: string | null
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function getResendEmailStatus(
  externalId: string | null | undefined,
): Promise<ResendEmailStatus | null> {
  if (!externalId) return null

  const cached = cache.get(externalId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.status
  }

  const resend = getResend()
  if (!resend) {
    // No API key configured (e.g. local dev): we cannot fetch real status.
    cache.set(externalId, { status: null, ts: Date.now() })
    return null
  }

  try {
    const { data, error } = await resend.emails.get(externalId)
    if (error) {
      cache.set(externalId, { status: null, ts: Date.now() })
      return null
    }
    const status = data as unknown as ResendEmailStatus
    cache.set(externalId, { status, ts: Date.now() })
    return status
  } catch {
    cache.set(externalId, { status: null, ts: Date.now() })
    return null
  }
}

export type DeliveryBucket = "delivered" | "bounced" | "complained" | "opened" | "pending" | "failed" | "unknown"

export function classifyResendStatus(status: ResendEmailStatus | null): DeliveryBucket {
  if (!status) return "unknown"
  if (status.complained_at) return "complained"
  if (status.bounced_at) return "bounced"
  if (status.opened_at) return "opened"
  if (status.delivered_at) return "delivered"
  switch (status.last_event) {
    case "delivered":
      return "delivered"
    case "bounced":
      return "bounced"
    case "complained":
      return "complained"
    case "opened":
      return "opened"
    case "queued":
    case "sending":
      return "pending"
    default:
      return "unknown"
  }
}

/**
 * Bulk-fetch Resend delivery statuses for a set of message ids.
 * Uses a single `emails.list` call (most recent 100) plus per-id `get`
 * fallbacks for ids not present in the list. Results are cached per id.
 */
export async function getResendStatusMap(
  ids: (string | null | undefined)[],
): Promise<Map<string, ResendEmailStatus | null>> {
  const map = new Map<string, ResendEmailStatus | null>()
  const wanted = Array.from(new Set(ids.filter((id): id is string => !!id)))

  // 1. Serve from cache
  const missing: string[] = []
  for (const id of wanted) {
    const cached = cache.get(id)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      map.set(id, cached.status)
    } else {
      missing.push(id)
    }
  }

  if (missing.length === 0) return map

  const resend = getResend()
  if (!resend) {
    // No API key: cannot fetch real statuses.
    for (const id of missing) cache.set(id, { status: null, ts: Date.now() })
    return map
  }

  // 2. One list call covers the most recent emails
  try {
    const { data, error } = await resend.emails.list({ perPage: 100 } as any)
    if (!error && data) {
      for (const e of (data as unknown as any[])) {
        if (!e?.id || cache.has(e.id)) continue
        cache.set(e.id, { status: e as unknown as ResendEmailStatus, ts: Date.now() })
      }
    }
  } catch {
    // ignore list failure, fall back to per-id
  }

  // 3. Per-id fallback for anything still missing
  const stillMissing = missing.filter((id) => !cache.has(id))
  await Promise.all(
    stillMissing.map(async (id) => {
      try {
        const { data, error } = await resend.emails.get(id)
        cache.set(id, { status: error ? null : (data as unknown as ResendEmailStatus), ts: Date.now() })
      } catch {
        cache.set(id, { status: null, ts: Date.now() })
      }
    }),
  )

  for (const id of missing) {
    map.set(id, cache.get(id)?.status ?? null)
  }
  return map
}

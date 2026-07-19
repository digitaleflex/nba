export interface AuditEvent {
  id: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  resourceLabel: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  severity: string
  user: { name: string; email: string; image?: string | null } | null
}

export type AuditView = "timeline" | "user" | "resource"

export interface AuditFilters {
  actions: string[]
  resourceTypes: string[]
}

export interface AuditResponse {
  logs: AuditEvent[]
  total: number
  page: number
  limit: number
  filters: AuditFilters
}

export interface AccessRequest {
  id: string
  status: string
  createdAt: string
  notes: string | null
  reviewedAt: string | null
  reviewer?: { id: string; name: string } | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    country: string | null
    onboardingStatus: string
    createdAt: string
  }
  plan: {
    name: string
  }
  onboarding: {
    status: string
    progress: number
    checklist: Record<string, boolean>
    nextStep: string | null
  }
}

export interface Signal {
  id: string
  content: string
  imageUrl: string | null
  imageUrls: any
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  creator: { name: string }
  audience: { plan: { name: string } }[]
  currentVersion: number
}

export interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  onboardingStatus: string
  isActive: boolean
  createdAt: string
  role: { name: string }
  _count: {
    accessRequests: number
    kycDocuments: number
    notifications: number
  }
}

export interface KYCDoc {
  id: string
  type: string
  status: string
  createdAt: string
  submittedAt: string
  user: { name: string; email: string }
  files?: { label: string; url: string }[]
}

export interface BrokerVerification {
  id: string
  brokerName: string
  accountId: string
  status: string
  createdAt: string
  submittedAt: string
  videoUrl?: string
  videoFilePath?: string
  user: { name: string; email: string }
}

export interface AuditLog {
  id: string
  action: string
  resourceType: string
  createdAt: string
  ipAddress: string | null
  user: { name: string; email: string } | null
}

export type PanelType = "user" | "kyc" | "broker" | "signal"

export interface OpenPanelArgs {
  title: string
  type: PanelType
  data: any
}

export type OpenPanel = (args: OpenPanelArgs) => void

export type RegisterRefetch = (fn: (() => void) | null) => void

export type CachedGet = (
  url: string,
  ttlMs?: number
) => Promise<{ ok: boolean; data: any }>

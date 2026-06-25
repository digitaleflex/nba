# API Specification

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. Introduction
2. Authentication API
3. Member API
4. Subscription API
5. KYC API
6. Broker API
7. Trading Signal API
8. Notification API
9. Administration API
10. Settings API
11. Public API
12. Webhooks
13. Error Responses
14. Rate Limiting

---

# 1. Introduction

## 1.1 Architecture

NBA uses two API mechanisms:

| Mechanism | Use Case |
|-----------|----------|
| **Server Actions** | All authenticated mutations |
| **Route Handlers** | Public APIs, webhooks, external integrations |

## 1.2 Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Production | `https://neverbrokeagain.com` |

## 1.3 Authentication

All protected endpoints require a valid session.

Authentication is handled by Better Auth. Session cookies are set automatically.

## 1.4 Response Format

All API responses follow this format:

```typescript
// Success
{
  success: true
  data: T
}

// Error
{
  success: false
  message: string
  code?: string
  fields?: Record<string, string[]> // Field-level validation errors
}
```

---

# 2. Authentication API

## 2.1 Login

**Server Action:** `modules/auth/services/login.ts`

**Input:**
```typescript
{
  email: string    // Valid email
  password: string // Min 8 characters
}
```

**Output:**
```typescript
{
  user: {
    id: string
    email: string
    name: string
    role: Role
  }
}
```

**Errors:**
- Invalid credentials
- Email not verified
- Account suspended

## 2.2 Register

**Server Action:** `modules/auth/services/register.ts`

**Input:**
```typescript
{
  email: string
  password: string     // Min 8, max 128
  name: string         // Min 2, max 100
  acceptTerms: boolean // Must be true
}
```

**Output:**
```typescript
{
  user: {
    id: string
    email: string
    name: string
    role: "MEMBER"
  }
}
```

**Behavior:**
- Email verification is sent automatically.
- User role defaults to MEMBER.
- Session is created on success.

## 2.3 Logout

**Server Action:** `modules/auth/services/logout.ts`

**Input:** None (uses current session)

**Output:**
```typescript
{
  success: true
}
```

## 2.4 Forgot Password

**Server Action:** `modules/auth/services/forgot-password.ts`

**Input:**
```typescript
{
  email: string
}
```

**Output:**
```typescript
{
  success: true // Always true to prevent email enumeration
}
```

## 2.5 Reset Password

**Server Action:** `modules/auth/services/reset-password.ts`

**Input:**
```typescript
{
  token: string
  password: string
}
```

**Output:**
```typescript
{
  success: true
}
```

## 2.6 Verify Email

**Route Handler:** `GET /api/auth/verify-email`

**Query Parameters:**
```typescript
{
  token: string
}
```

**Response:**
- Redirects to login on success.
- Redirects to error page on failure.

## 2.7 Get Current User

**Server Action:** `modules/auth/services/get-current-user.ts`

**Input:** None (uses current session)

**Output:**
```typescript
{
  user: {
    id: string
    email: string
    name: string
    role: Role
    emailVerified: boolean
    createdAt: string
  }
}
```

---

# 3. Member API

## 3.1 List Members

**Server Action:** `modules/members/services/get-members.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  page?: number        // Default: 1
  limit?: number       // Default: 20, Max: 100
  search?: string      // Search by name or email
  role?: Role
  status?: MemberStatus
  sortBy?: string      // Default: "created_at"
  sortOrder?: "asc" | "desc"
}
```

**Output:**
```typescript
{
  members: Member[]
  total: number
  page: number
  totalPages: number
}
```

## 3.2 Get Member

**Server Action:** `modules/members/services/get-member.ts`

**Roles:** ADMIN, SUPER_ADMIN, self

**Input:**
```typescript
{
  id: string
}
```

**Output:**
```typescript
{
  member: Member
}
```

## 3.3 Update Member

**Server Action:** `modules/members/services/update-member.ts`

**Roles:** ADMIN, SUPER_ADMIN, self

**Input:**
```typescript
{
  id: string
  name?: string
  email?: string
  phone?: string
}
```

**Output:**
```typescript
{
  member: Member
}
```

## 3.4 Suspend Member

**Server Action:** `modules/members/services/suspend-member.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
  reason: string
}
```

**Output:**
```typescript
{
  success: true
}
```

## 3.5 Delete Member

**Server Action:** `modules/members/services/delete-member.ts`

**Roles:** SUPER_ADMIN

**Input:**
```typescript
{
  id: string
}
```

**Behavior:** Soft delete.

---

# 4. Subscription API

## 4.1 List Plans

**Server Action:** `modules/plans/services/get-plans.ts`

**Roles:** All authenticated

**Input:**
```typescript
{
  active?: boolean
}
```

**Output:**
```typescript
{
  plans: Plan[]
}
```

## 4.2 Create Plan

**Server Action:** `modules/plans/services/create-plan.ts`

**Roles:** SUPER_ADMIN

**Input:**
```typescript
{
  name: string
  description: string
  price: number
  currency: string
  durationDays: number
  features: string[]
  isActive: boolean
}
```

**Output:**
```typescript
{
  plan: Plan
}
```

## 4.3 Assign Subscription

**Server Action:** `modules/plans/services/assign-plan.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  memberId: string
  planId: string
  startDate?: string
  endDate?: string
}
```

**Output:**
```typescript
{
  subscription: Subscription
}
```

## 4.4 Cancel Subscription

**Server Action:** `modules/plans/services/cancel-subscription.ts`

**Roles:** ADMIN, SUPER_ADMIN, self

**Input:**
```typescript
{
  subscriptionId: string
  reason?: string
}
```

**Output:**
```typescript
{
  success: true
}
```

---

# 5. KYC API

## 5.1 Submit KYC

**Server Action:** `modules/kyc/services/submit-kyc.ts`

**Roles:** MEMBER

**Input:**
```typescript
{
  documentType: "ID_CARD" | "PASSPORT" | "DRIVERS_LICENSE"
  documentFront: File
  documentBack?: File
  selfie?: File
}
```

**Output:**
```typescript
{
  kycId: string
  status: "PENDING"
}
```

## 5.2 List KYC Submissions

**Server Action:** `modules/kyc/services/get-pending-kyc.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  status?: KYCStatus
  page?: number
  limit?: number
}
```

**Output:**
```typescript
{
  submissions: KYCSubmission[]
  total: number
  page: number
  totalPages: number
}
```

## 5.3 Approve KYC

**Server Action:** `modules/kyc/services/approve-kyc.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
  notes?: string
}
```

**Output:**
```typescript
{
  success: true
}
```

**Behavior:**
- Audit event emitted.
- Notification sent to member.
- Member KYC status updated.

## 5.4 Reject KYC

**Server Action:** `modules/kyc/services/reject-kyc.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
  reason: string
}
```

**Output:**
```typescript
{
  success: true
}
```

**Behavior:**
- Audit event emitted.
- Notification sent to member with rejection reason.
- Member may resubmit.

---

# 6. Broker API

## 6.1 Submit Broker Verification

**Server Action:** `modules/broker/services/submit-broker.ts`

**Roles:** MEMBER

**Input:**
```typescript
{
  brokerName: string
  accountId: string
  videoFile: File
}
```

**Output:**
```typescript
{
  verificationId: string
  status: "PENDING"
}
```

## 6.2 List Broker Verifications

**Server Action:** `modules/broker/services/get-broker.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  status?: BrokerStatus
  page?: number
  limit?: number
}
```

## 6.3 Approve Broker

**Server Action:** `modules/broker/services/approve-broker.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
  notes?: string
}
```

**Output:**
```typescript
{
  success: true
}
```

## 6.4 Reject Broker

**Server Action:** `modules/broker/services/reject-broker.ts`

**Roles:** KYC_AGENT, ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
  reason: string
}
```

**Output:**
```typescript
{
  success: true
}
```

---

# 7. Trading Signal API

## 7.1 Create Signal

**Server Action:** `modules/signals/services/create-signal.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  title: string
  description: string
  asset: string
  type: "BUY" | "SELL"
  entryPrice: number
  targetPrice: number
  stopLoss?: number
  confidence: "LOW" | "MEDIUM" | "HIGH"
  targetPlans: string[] // Plan IDs
  scheduledFor?: string // ISO date
}
```

**Output:**
```typescript
{
  signal: Signal
}
```

## 7.2 Publish Signal

**Server Action:** `modules/signals/services/publish-signal.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
}
```

**Output:**
```typescript
{
  success: true
}
```

**Behavior:**
- Signal visibility is computed based on target plans.
- Notification is queued for all applicable members.
- Audit event is emitted.

## 7.3 List Signals

**Server Action:** `modules/signals/services/get-signals.ts`

**Roles:** MEMBER (own), ADMIN, SUPER_ADMIN (all)

**Input:**
```typescript
{
  page?: number
  limit?: number
  status?: SignalStatus
  type?: "BUY" | "SELL"
  asset?: string
}
```

**Output:**
```typescript
{
  signals: Signal[]
  total: number
  page: number
  totalPages: number
}
```

## 7.4 Get Signal

**Server Action:** `modules/signals/services/get-signal.ts`

**Roles:** MEMBER (if accessible), ADMIN, SUPER_ADMIN

**Input:**
```typescript
{
  id: string
}
```

**Output:**
```typescript
{
  signal: Signal
}
```

---

# 8. Notification API

## 8.1 List Notifications

**Server Action:** `modules/notifications/services/get-notifications.ts`

**Roles:** All authenticated

**Input:**
```typescript
{
  page?: number
  limit?: number
  unreadOnly?: boolean
}
```

**Output:**
```typescript
{
  notifications: Notification[]
  unreadCount: number
  total: number
}
```

## 8.2 Mark as Read

**Server Action:** `modules/notifications/services/mark-read.ts`

**Roles:** All authenticated (own notifications only)

**Input:**
```typescript
{
  id: string
}
```

**Output:**
```typescript
{
  success: true
}
```

## 8.3 Mark All as Read

**Server Action:** `modules/notifications/services/mark-all-read.ts`

**Roles:** All authenticated

**Input:** None

**Output:**
```typescript
{
  success: true
}
```

---

# 9. Administration API

## 9.1 Get Dashboard Stats

**Server Action:** `modules/admin/services/get-dashboard-stats.ts`

**Roles:** ADMIN, SUPER_ADMIN

**Output:**
```typescript
{
  totalMembers: number
  activeSubscriptions: number
  pendingKyc: number
  pendingBrokerVerifications: number
  signalsPublishedToday: number
  recentActivity: AuditEvent[]
}
```

## 9.2 Manage Roles

**Server Action:** `modules/admin/services/manage-roles.ts`

**Roles:** SUPER_ADMIN

**Input:**
```typescript
{
  memberId: string
  role: Role
}
```

**Output:**
```typescript
{
  success: true
}
```

**Behavior:**
- Audit event emitted.
- Session may be invalidated if own role changed.

## 9.3 Update Settings

**Server Action:** `modules/admin/services/update-settings.ts`

**Roles:** SUPER_ADMIN

**Input:**
```typescript
{
  key: string
  value: string
}
```

**Output:**
```typescript
{
  success: true
}
```

---

# 10. Settings API

## 10.1 Update Profile

**Server Action:** `modules/settings/services/update-profile.ts`

**Roles:** All authenticated

**Input:**
```typescript
{
  name?: string
  phone?: string
  avatar?: File
}
```

**Output:**
```typescript
{
  user: User
}
```

## 10.2 Update Password

**Server Action:** `modules/settings/services/update-password.ts`

**Roles:** All authenticated

**Input:**
```typescript
{
  currentPassword: string
  newPassword: string
}
```

**Output:**
```typescript
{
  success: true
}
```

**Behavior:**
- All other sessions are invalidated.
- Email notification sent.

## 10.3 Update Notification Preferences

**Server Action:** `modules/settings/services/update-notification-preferences.ts`

**Roles:** All authenticated

**Input:**
```typescript
{
  emailEnabled: boolean
  inAppEnabled: boolean
  telegramEnabled: boolean
}
```

**Output:**
```typescript
{
  success: true
}
```

---

# 11. Public API

## 11.1 Health Check

**Route Handler:** `GET /api/public/health`

**Response:**
```typescript
{
  status: "healthy"
  timestamp: string
  uptime: number
}
```

**Authentication:** None

---

# 12. Webhooks

## 12.1 Resend Webhook

**Route Handler:** `POST /api/webhooks/resend`

**Authentication:** Signature validation

**Events:**
- `email.delivered`
- `email.bounced`
- `email.complained`
- `email.opened`

**Processing:**
- Update notification delivery status.
- Handle bounces (mark email as invalid).
- Log delivery events.

---

# 13. Error Responses

## 13.1 Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected error |

## 13.2 Validation Error

```typescript
{
  success: false
  message: "Validation failed"
  code: "VALIDATION_ERROR"
  fields: {
    email: ["Invalid email format"]
    password: ["Password must be at least 8 characters"]
  }
}
```

## 13.3 Authorization Error

```typescript
{
  success: false
  message: "Insufficient permissions"
  code: "FORBIDDEN"
}
```

---

# 14. Rate Limiting

## 14.1 Limits

| Endpoint | Rate Limit |
|----------|------------|
| Login | 5 attempts per minute |
| Register | 3 attempts per hour |
| Forgot Password | 3 attempts per hour |
| API Routes | 100 requests per minute |

## 14.2 Headers

Rate limit information is returned in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

---

# 15. Server Action Conventions

## 15.1 File Structure

Each Server Action file follows this pattern:

```typescript
"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { requireRole } from "@/lib/auth"
import { memberService } from "../services/member-service"
import { memberSchema } from "../validators/member-schema"
import type { Member } from "../types"

const schema = memberSchema.createSchema

export async function createMember(input: z.infer<typeof schema>) {
  const session = await requireAuth()
  requireRole(session, ["ADMIN", "SUPER_ADMIN"])

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { success: false, message: "Validation failed", fields: parsed.error.flatten().fieldErrors }
  }

  try {
    const member = await memberService.create(parsed.data, session)
    return { success: true, data: member }
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, message: error.message, code: error.code }
    }
    throw error
  }
}
```

## 15.2 Return Type Convention

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string; code?: string; fields?: Record<string, string[]> }
```

---

# Related Documents

- ADR-002 — Next.js
- ADR-017 — Server Actions
- ADR-013 — File Upload Security
- ADR-018 — Zod Validation
- PROJECT_STRUCTURE.md
- CODING_STANDARDS.md

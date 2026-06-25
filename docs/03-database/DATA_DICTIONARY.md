# Data Dictionary

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# 1. Introduction

This document defines every table, column, type, and constraint in the NBA database.

It serves as the authoritative reference for the data model.

---

# 2. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | snake_case, plural | `users`, `kyc_documents` |
| Column names | snake_case | `email`, `created_at` |
| Primary keys | `id` | `id` |
| Foreign keys | `singular_table_id` | `user_id`, `plan_id` |
| Timestamps | `created_at`, `updated_at` | |
| Soft delete | `deleted_at` | |
| Boolean | `is_*` or `has_*` | `is_active`, `is_verified` |
| Enum | UPPER_SNAKE_CASE | `PENDING`, `APPROVED` |

---

# 3. Table: users

Stores all authenticated users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v7() | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false | Whether email is verified |
| name | VARCHAR(100) | NOT NULL | Display name |
| phone | VARCHAR(20) | NULLABLE | Phone number |
| avatar_url | TEXT | NULLABLE | Profile image URL |
| role_id | UUID | NOT NULL, FK -> roles.id | Assigned role |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account active status |
| metadata | JSONB | NULLABLE | Flexible metadata |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update time |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role_id` on `role_id`
- `idx_users_is_active` on `is_active`
- `idx_users_created_at` on `created_at`
- `idx_users_deleted_at` on `deleted_at`

---

# 4. Table: roles

Defines user roles for RBAC.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Role name |
| description | TEXT | NULLABLE | Role description |
| is_system | BOOLEAN | NOT NULL, DEFAULT false | System-protected role |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Seed Data:**
| Name | Description | System |
|------|-------------|--------|
| SUPER_ADMIN | Full system access | true |
| ADMIN | Administrative operations | true |
| KYC_AGENT | KYC verification operations | true |
| SUPPORT_AGENT | Support ticket operations | true |
| MEMBER | Standard platform access | true |

---

# 5. Table: permissions

Individual permissions assignable to roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Permission key |
| description | TEXT | NULLABLE | Human-readable description |
| module | VARCHAR(50) | NOT NULL | Module this permission belongs to |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Seed Data:**
| Name | Module | Description |
|------|--------|-------------|
| users.read | members | View user profiles |
| users.update | members | Update user profiles |
| users.suspend | members | Suspend user accounts |
| subscriptions.manage | plans | Manage subscriptions |
| kyc.review | kyc | Review KYC submissions |
| broker.review | broker | Review broker verifications |
| signals.create | signals | Create trading signals |
| signals.publish | signals | Publish trading signals |
| notifications.send | notifications | Send notifications |
| settings.manage | admin | Manage system settings |
| audit.read | audit | View audit logs |

---

# 6. Table: role_permissions

Join table linking roles to permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | UUID | PK, FK -> roles.id | Role reference |
| permission_id | UUID | PK, FK -> permissions.id | Permission reference |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Primary Key:** Composite (role_id, permission_id)

---

# 7. Table: sessions

Better Auth session storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiration |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| user_agent | TEXT | NULLABLE | Client user agent |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_sessions_user_id` on `user_id`
- `idx_sessions_expires_at` on `expires_at`

---

# 8. Table: accounts

OAuth account links (Better Auth).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| provider_id | VARCHAR(50) | NOT NULL | OAuth provider name |
| provider_account_id | VARCHAR(255) | NOT NULL | Provider account ID |
| access_token | TEXT | NULLABLE | OAuth access token |
| refresh_token | TEXT | NULLABLE | OAuth refresh token |
| expires_at | TIMESTAMPTZ | NULLABLE | Token expiration |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique Constraint:** (provider_id, provider_account_id)

---

# 9. Table: verification_tokens

Email verification and password reset tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| type | VARCHAR(50) | NOT NULL | `EMAIL_VERIFICATION` or `PASSWORD_RESET` |
| token | VARCHAR(255) | NOT NULL, UNIQUE | Token value |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_verification_tokens_token` on `token`
- `idx_verification_tokens_user_id` on `user_id`

---

# 10. Table: subscription_plans

Defines available subscription tiers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Plan display name |
| description | TEXT | NULLABLE | Plan description |
| price | DECIMAL(10,2) | NOT NULL | Monthly price |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | ISO currency code |
| duration_days | INTEGER | NOT NULL | Subscription duration |
| features | JSONB | NOT NULL, DEFAULT '[]' | Feature list |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether the plan is available |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

---

# 11. Table: user_subscriptions

Tracks user subscription assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| plan_id | UUID | NOT NULL, FK -> subscription_plans.id | Plan reference |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | `ACTIVE`, `CANCELLED`, `EXPIRED` |
| start_date | TIMESTAMPTZ | NOT NULL | Subscription start |
| end_date | TIMESTAMPTZ | NOT NULL | Subscription end |
| cancelled_at | TIMESTAMPTZ | NULLABLE | Cancellation date |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_user_subs_user_id` on `user_id`
- `idx_user_subs_plan_id` on `plan_id`
- `idx_user_subs_status` on `status`

---

# 12. Table: kyc_documents

Stores KYC verification submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| document_type | VARCHAR(50) | NOT NULL | `ID_CARD`, `PASSPORT`, `DRIVERS_LICENSE` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| front_file_path | TEXT | NOT NULL | Path to front document image |
| back_file_path | TEXT | NULLABLE | Path to back document image |
| selfie_file_path | TEXT | NULLABLE | Path to selfie image |
| reviewed_by | UUID | NULLABLE, FK -> users.id | Reviewer user ID |
| review_notes | TEXT | NULLABLE | Review notes |
| reviewed_at | TIMESTAMPTZ | NULLABLE | Review timestamp |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_kyc_user_id` on `user_id`
- `idx_kyc_status` on `status`
- `idx_kyc_submitted_at` on `submitted_at`

---

# 13. Table: broker_verifications

Stores broker account verification submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | User reference |
| broker_name | VARCHAR(100) | NOT NULL | Broker name |
| account_id | VARCHAR(100) | NOT NULL | Broker account identifier |
| video_file_path | TEXT | NOT NULL | Path to verification video |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| reviewed_by | UUID | NULLABLE, FK -> users.id | Reviewer user ID |
| review_notes | TEXT | NULLABLE | Review notes |
| reviewed_at | TIMESTAMPTZ | NULLABLE | |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

# 14. Table: signals

Trading signals created by administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(200) | NOT NULL | Signal title |
| description | TEXT | NOT NULL | Signal description |
| asset | VARCHAR(50) | NOT NULL | Trading asset |
| type | VARCHAR(10) | NOT NULL | `BUY` or `SELL` |
| entry_price | DECIMAL(20,8) | NOT NULL | Entry price |
| target_price | DECIMAL(20,8) | NOT NULL | Target price |
| stop_loss | DECIMAL(20,8) | NULLABLE | Stop loss price |
| confidence | VARCHAR(10) | NOT NULL | `LOW`, `MEDIUM`, `HIGH` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| created_by | UUID | NOT NULL, FK -> users.id | Creator user ID |
| published_at | TIMESTAMPTZ | NULLABLE | Publication date |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

**Indexes:**
- `idx_signals_status` on `status`
- `idx_signals_created_by` on `created_by`
- `idx_signals_published_at` on `published_at`
- `idx_signals_type` on `type`
- `idx_signals_asset` on `asset`

---

# 15. Table: signal_audience

Maps signals to targeted subscription plans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| signal_id | UUID | NOT NULL, FK -> signals.id | Signal reference |
| plan_id | UUID | NOT NULL, FK -> subscription_plans.id | Target plan |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_signal_audience_signal_id` on `signal_id`
- `idx_signal_audience_plan_id` on `plan_id`

---

# 16. Table: notifications

Notifications generated by the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NOT NULL, FK -> users.id | Recipient user ID |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(200) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body |
| data | JSONB | NULLABLE | Additional payload |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | Read status |
| read_at | TIMESTAMPTZ | NULLABLE | Read timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_is_read` on `is_read`
- `idx_notifications_created_at` on `created_at`

---

# 17. Table: notification_deliveries

Tracks delivery status across channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| notification_id | UUID | NOT NULL, FK -> notifications.id | Notification reference |
| channel | VARCHAR(20) | NOT NULL | `IN_APP`, `EMAIL`, `TELEGRAM` |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `SENT`, `FAILED`, `BOUNCED` |
| external_id | VARCHAR(255) | NULLABLE | External provider ID |
| error_message | TEXT | NULLABLE | Failure reason |
| sent_at | TIMESTAMPTZ | NULLABLE | Delivery timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_notif_delivery_notification_id` on `notification_id`
- `idx_notif_delivery_status` on `status`

---

# 18. Table: audit_logs

Immutable audit records for critical operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | NULLABLE, FK -> users.id | Actor user ID (null for system) |
| action | VARCHAR(100) | NOT NULL | Action identifier |
| resource_type | VARCHAR(50) | NOT NULL | Resource type |
| resource_id | UUID | NULLABLE | Resource identifier |
| details | JSONB | NULLABLE | Action details |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| user_agent | TEXT | NULLABLE | Client user agent |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_audit_logs_user_id` on `user_id`
- `idx_audit_logs_action` on `action`
- `idx_audit_logs_resource_type` on `resource_type`
- `idx_audit_logs_created_at` on `created_at`

---

# 19. Table: settings

System-wide configuration key-value store.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| key | VARCHAR(100) | NOT NULL, UNIQUE | Setting key |
| value | TEXT | NOT NULL | Setting value |
| description | TEXT | NULLABLE | Setting description |
| updated_by | UUID | NULLABLE, FK -> users.id | Last updater |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

# 20. SQL Data Types Reference

| PostgreSQL Type | Usage |
|----------------|-------|
| UUID | Primary keys, foreign keys |
| VARCHAR(n) | Variable-length strings |
| TEXT | Long text content |
| BOOLEAN | True/false values |
| INTEGER | Whole numbers |
| DECIMAL(p,s) | Precise decimal values |
| TIMESTAMPTZ | Timestamps with timezone |
| JSONB | Flexible structured data |

---

# 21. Enum Values

## 21.1 Document Types (KYCDocument.document_type)

| Value | Description |
|-------|-------------|
| ID_CARD | National identity card |
| PASSPORT | International passport |
| DRIVERS_LICENSE | Driver's license |

## 21.2 Verification Status

| Value | Description |
|-------|-------------|
| PENDING | Awaiting review |
| APPROVED | Verified successfully |
| REJECTED | Rejected with reason |

## 21.3 Signal Type

| Value | Description |
|-------|-------------|
| BUY | Buy recommendation |
| SELL | Sell recommendation |

## 21.4 Signal Confidence

| Value | Description |
|-------|-------------|
| LOW | Low confidence |
| MEDIUM | Medium confidence |
| HIGH | High confidence |

## 21.5 Signal Status

| Value | Description |
|-------|-------------|
| DRAFT | Not yet published |
| PUBLISHED | Published and sent to members |
| ARCHIVED | No longer relevant |

## 21.6 Subscription Status

| Value | Description |
|-------|-------------|
| ACTIVE | Currently active |
| CANCELLED | Cancelled by user or admin |
| EXPIRED | Reached end date |

## 21.7 Notification Channel

| Value | Description |
|-------|-------------|
| IN_APP | In-app notification |
| EMAIL | Email notification |
| TELEGRAM | Telegram message |

## 21.8 Delivery Status

| Value | Description |
|-------|-------------|
| PENDING | Awaiting delivery |
| SENT | Successfully sent |
| FAILED | Delivery failed |
| BOUNCED | Email bounced |

---

# 22. Table Sizes and Growth Estimates

| Table | Estimated Row Size | Growth Rate | 1 Year Estimate |
|-------|-------------------|-------------|-----------------|
| users | ~512 bytes | 100/day | 36,500 |
| roles | ~128 bytes | Static | 5 |
| permissions | ~128 bytes | Static | 20 |
| sessions | ~256 bytes | 500/day | 182,500 |
| accounts | ~512 bytes | 10/day | 3,650 |
| verification_tokens | ~256 bytes | 200/day | 73,000 |
| subscription_plans | ~256 bytes | Static | 5 |
| user_subscriptions | ~256 bytes | 100/day | 36,500 |
| kyc_documents | ~1 KB | 50/day | 18,250 |
| broker_verifications | ~1 KB | 30/day | 10,950 |
| signals | ~512 bytes | 20/day | 7,300 |
| signal_audience | ~128 bytes | 60/day | 21,900 |
| notifications | ~512 bytes | 500/day | 182,500 |
| notification_deliveries | ~256 bytes | 1,500/day | 547,500 |
| audit_logs | ~512 bytes | 1,000/day | 365,000 |

---

# Related Documents

- DATABASE_DESIGN.md
- ENTITY_RELATIONSHIP.md
- ADR-004 — Prisma ORM
- ADR-005 — PostgreSQL (Neon)

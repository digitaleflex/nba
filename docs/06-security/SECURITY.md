# Security

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. Introduction
2. Authentication
3. Authorization
4. Session Security
5. Password Security
6. API Security
7. Data Protection
8. Network Security
9. Infrastructure Security
10. File Upload Security
11. Audit and Monitoring
12. Incident Response
13. Compliance
14. Security Checklist

---

# 1. Introduction

## 1.1 Scope

This document defines the security policies, controls, and best practices for the NeverBrokeAgain platform.

Every developer, administrator, and AI agent must follow these security requirements.

## 1.2 Security Principles

- **Defense in depth** — multiple layers of security controls.
- **Least privilege** — users and services have minimum required access.
- **Secure by default** — security is not optional or configurable.
- **Never trust, always verify** — all inputs are validated, all requests are authorized.
- **Fail securely** — failures default to secure state.

---

# 2. Authentication

## 2.1 Authentication Provider

- Better Auth is the sole authentication provider.
- Custom authentication is prohibited.

## 2.2 Authentication Methods

| Method | Required | Notes |
|--------|----------|-------|
| Email + Password | Yes | Primary method |
| Email Verification | Yes | Required before access |
| Password Reset | Yes | Token-based, time-limited |
| Two-Factor Authentication | Optional | Available for all users |

## 2.3 Authentication Rules

- Passwords must be at least 8 characters.
- Passwords must never be stored in plaintext.
- Password hashing is handled by Better Auth (bcrypt).
- Rate limiting applies to login, registration, and password reset.
- Account lockout after 5 failed attempts (15 minutes).

## 2.4 Session Rules

- Sessions expire after 7 days of inactivity.
- Sessions are revoked on password change.
- Administrators can revoke any session.
- Users can view and revoke their sessions.
- All sessions are server-side.

---

# 3. Authorization

## 3.1 Authorization Model

RBAC (Role-Based Access Control) is the authorization model.

Refer to ADR-011 and ADR-009 for the complete RBAC specification.

## 3.2 Authorization Rules

- All protected operations check authorization.
- Frontend UI visibility never replaces backend authorization.
- Authorization is checked at the service layer.
- Permissions are stored in the database, never hardcoded.
- Role changes are audited.

## 3.3 Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| SUPER_ADMIN | 5 | Full system access |
| ADMIN | 4 | Administrative operations |
| KYC_AGENT | 3 | KYC verification |
| SUPPORT_AGENT | 2 | Support operations |
| MEMBER | 1 | Standard platform access |

## 3.4 Role Assignment

- SUPER_ADMIN role is assigned during system initialization.
- ADMIN role is assigned by SUPER_ADMIN only.
- KYC_AGENT and SUPPORT_AGENT are assigned by ADMIN or SUPER_ADMIN.
- MEMBER is the default role on registration.

---

# 4. Session Security

## 4.1 Session Management

- Sessions are managed by Better Auth.
- Session tokens are HTTP-only cookies.
- Session cookies have Secure, SameSite=Lax flags.
- Session data is stored in PostgreSQL.

## 4.2 Session Validation

- Sessions are validated on every authenticated request.
- Expired sessions return a 401 response.
- Revoked sessions are rejected immediately.
- Session validation is performed in middleware.

## 4.3 Session Protection

- Session fixation is prevented by Better Auth.
- Session tokens are rotated on privilege escalation.
- Logout invalidates the session server-side.

---

# 5. Password Security

## 5.1 Password Requirements

- Minimum length: 8 characters.
- Maximum length: 128 characters.
- Must include at least one uppercase letter.
- Must include at least one lowercase letter.
- Must include at least one number.
- Special characters are allowed.

## 5.2 Password Storage

- Passwords are hashed with bcrypt (cost factor 12).
- Passwords are never logged.
- Passwords are never stored in plaintext.
- Passwords are never returned in API responses.

## 5.3 Password Reset

- Reset tokens expire after 1 hour.
- Reset tokens are single-use.
- Reset token is sent via email only.
- Password change invalidates all existing sessions.

---

# 6. API Security

## 6.1 Server Actions

- Server Actions require a valid session.
- Input is validated with Zod before processing.
- CSRF protection is provided by Next.js natively.
- Rate limiting applies to authentication actions.

## 6.2 Route Handlers

- Public endpoints are explicitly declared.
- Authenticated endpoints validate the session.
- Webhook endpoints validate signatures.
- Input validation with Zod is mandatory.
- Rate limiting applies to all public endpoints.

## 6.3 CORS

- CORS is configured for the application domain only.
- Credentials mode is `include` for authenticated requests.
- Allowed methods are limited to required values.

## 6.4 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /login | 5 | 1 minute |
| POST /register | 3 | 1 hour |
| POST /forgot-password | 3 | 1 hour |
| POST /reset-password | 3 | 1 hour |
| Public API | 100 | 1 minute |
| Authenticated API | 1000 | 1 minute |

---

# 7. Data Protection

## 7.1 Data Classification

| Classification | Description | Examples |
|----------------|-------------|----------|
| Public | Non-sensitive data | Product names, feature list |
| Internal | Business data | Signal content, subscription plans |
| Confidential | User data | Email, phone, KYC documents |
| Restricted | Sensitive user data | Passwords (hashed), ID documents |

## 7.2 Data Protection Rules

- Confidential and Restricted data is encrypted at rest.
- Passwords are never stored — only hashes.
- KYC documents are stored temporarily and deleted after review.
- Sensitive data is never logged.
- API responses never return passwords, tokens, or secrets.

## 7.3 Encryption

- Data in transit: TLS 1.3 (Cloudflare).
- Data at rest: Neon PostgreSQL encryption at rest.
- No application-level encryption is required for Version 1.

## 7.4 Data Retention

| Data Type | Retention Period | Action After |
|-----------|-----------------|--------------|
| KYC documents | Until 30 days after review | Permanent deletion |
| Broker videos | Until 30 days after review | Permanent deletion |
| Session data | Until 7 days after expiry | Deletion |
| Verification tokens | Until 1 hour after expiry | Deletion |
| Audit logs | Indefinite | Immutable |
| User data | Until account deletion request | Anonymization |
| Notifications | 90 days | Deletion |

---

# 8. Network Security

## 8.1 Edge Protection

- Cloudflare sits in front of the application server.
- All traffic passes through Cloudflare.
- The VPS is never exposed directly to the internet.
- DDoS protection is provided by Cloudflare.

## 8.2 TLS

- TLS 1.3 is enforced.
- HTTP is redirected to HTTPS.
- SSL termination is at Cloudflare.
- Origin certificates are used between Cloudflare and the VPS.

## 8.3 Firewall

- Only ports 80 and 443 are open from the internet.
- SSH is restricted to the team's IP addresses.
- Database port is not exposed to the internet.
- Redis port is not exposed to the internet.

---

# 9. Infrastructure Security

## 9.1 Docker

- Containers run as non-root users.
- Images are scanned for vulnerabilities.
- Base images are minimal (Alpine where possible).
- Container capabilities are restricted.

## 9.2 Environment Variables

- Secrets are stored in environment variables.
- Environment variables are never committed to Git.
- `.env.example` documents all required variables without values.
- Production secrets are managed through the deployment platform.

## 9.3 Database

- Database connections use SSL.
- Database credentials are rotated periodically.
- Direct database access is restricted.
- Database backups are encrypted.

---

# 10. File Upload Security

## 10.1 Upload Validation

Every uploaded file is validated:

| Check | Implementation |
|-------|---------------|
| File type | MIME type validation |
| File extension | Whitelist of allowed extensions |
| File size | Maximum 10MB for documents, 100MB for videos |
| File content | MIME type verification server-side |
| Malware | Basic content inspection |

## 10.2 Allowed File Types

| Category | Allowed Types |
|----------|--------------|
| KYC documents | JPG, PNG, PDF |
| Broker videos | MP4, MOV |
| Avatars | JPG, PNG, WebP |

## 10.3 Storage Security

- Uploaded files are stored outside the web root.
- Filenames are randomized (UUID-based).
- Files are not directly accessible via URL.
- Files are served through the application with authorization checks.
- Files are deleted after processing.

## 10.4 Path Traversal Prevention

- Filenames are sanitized to remove path traversal sequences.
- Upload paths are validated against allowed directories.
- The `path` module is used for safe path construction.

---

# 11. Audit and Monitoring

## 11.1 Audit Events

| Category | Events |
|----------|--------|
| Authentication | Login, logout, password reset, email verification |
| Members | Registration, profile update, account suspension, account deletion |
| KYC | Submission, approval, rejection |
| Broker | Submission, approval, rejection |
| Signals | Creation, update, publication, archiving |
| Administration | Role changes, permission changes, settings changes |
| Subscription | Assignment, cancellation, expiration |

## 11.2 Audit Requirements

- Audit logs are immutable.
- Audit logs are never deleted.
- Audit logs include timestamp, user, action, resource, and metadata.
- Audit logs are queryable by administrators.

## 11.3 Monitoring

- Failed authentication attempts are monitored.
- Repeated authorization failures are flagged.
- Error rates are monitored.
- Background job failures trigger alerts.

---

# 12. Incident Response

## 12.1 Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Data breach, service outage | Immediate |
| High | Authentication bypass, data exposure | 1 hour |
| Medium | Rate limiting bypass, partial data exposure | 4 hours |
| Low | Minor misconfiguration | 24 hours |

## 12.2 Incident Response Process

1. **Detect** — Automated monitoring or user report.
2. **Assess** — Determine severity and impact.
3. **Contain** — Limit the incident scope.
4. **Eradicate** — Remove the root cause.
5. **Recover** — Restore normal operations.
6. **Learn** — Document findings and improve controls.

## 12.3 Contact

Security incidents are reported to the technical lead immediately.

Response contact: security@neverbrokeagain.com

---

# 13. Compliance

## 13.1 Data Privacy

- User data is processed according to applicable privacy laws.
- Users can request data export.
- Users can request account deletion.
- KYC data is processed with explicit consent.

## 13.2 Data Processing

- Personal data is collected only for specified purposes.
- Data is not shared with third parties without consent.
- Data is retained only as long as necessary.

---

# 14. Security Checklist

## 14.1 Pre-Deployment Checklist

- [ ] All environment variables are configured.
- [ ] Secrets are not hardcoded in the codebase.
- [ ] Database migrations are reviewed.
- [ ] Authentication is configured.
- [ ] Authorization rules are tested.
- [ ] Rate limiting is enabled.
- [ ] CORS is configured correctly.
- [ ] TLS is enforced.
- [ ] File upload validation is in place.

## 14.2 Code Review Security Checklist

- [ ] No SQL injection vectors (Prisma handles this).
- [ ] No XSS vectors (React handles this).
- [ ] No hardcoded secrets.
- [ ] Input validation with Zod in place.
- [ ] Authorization check present.
- [ ] Audit event emitted for critical operations.
- [ ] Error messages do not leak sensitive information.
- [ ] Rate limiting applied where needed.

## 14.3 Incident Response Checklist

- [ ] Incident is confirmed.
- [ ] Severity is assessed.
- [ ] Affected systems are isolated.
- [ ] Evidence is preserved.
- [ ] Stakeholders are notified.
- [ ] Fix is deployed.
- [ ] Post-mortem is conducted.

---

# Related Documents

- ADR-003 — Better Auth
- ADR-011 — RBAC
- ADR-012 — Session Management
- ADR-013 — File Upload Security
- ADR-014 — Audit Logging
- CODING_STANDARDS.md
- TECHNICAL_ARCHITECTURE.md

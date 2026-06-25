# User Stories

# NeverBrokeAgain (NBA)

> Version: 1.0
> Status: Approved
> Last Updated: June 2026

---

# Purpose

This document defines every user story for Version 1 of NeverBrokeAgain.

Each story describes:

* the actor;
* the objective;
* the expected value;
* the acceptance criteria.

All implementations must satisfy the acceptance criteria before being considered complete.

---

# Epic 1 — Authentication

---

## US-001 — Create an Account

**As a** Visitor

**I want to** create a new account

**So that** I can access the NBA platform.

### Acceptance Criteria

* Registration form is accessible.
* Required fields are validated.
* Email must be unique.
* WhatsApp number must be unique.
* Password policy is enforced.
* Account is created successfully.
* Verification email is sent.

---

## US-002 — Login

**As a** Member

**I want to** log into my account

**So that** I can access my dashboard.

### Acceptance Criteria

* Email and password are required.
* Invalid credentials return an error.
* Session is created successfully.
* User is redirected to the dashboard.

---

## US-003 — Logout

**As a** Member

**I want to** log out

**So that** my session ends securely.

### Acceptance Criteria

* Session is destroyed.
* User is redirected to the login page.

---

## US-004 — Reset Password

**As a** Member

**I want to** recover my password

**So that** I can regain access to my account.

### Acceptance Criteria

* Email validation.
* Reset email sent.
* Secure reset token.
* Password updated.

---

# Epic 2 — Profile

---

## US-005 — View Profile

As a Member

I want to view my personal information.

Acceptance Criteria

* Personal information displayed.
* Subscription displayed.
* Verification status displayed.

---

## US-006 — Edit Profile

Acceptance Criteria

* Editable fields validated.
* Changes saved successfully.

---

# Epic 3 — KYC

---

## US-007 — Submit Identity Document

As a Member

I want to upload my identity document.

Acceptance Criteria

* Accepted formats only.
* Maximum size enforced.
* Upload successful.
* Status becomes "Pending Review".

---

## US-008 — Re-upload Identity Document

Acceptance Criteria

* Only available after rejection.
* Previous document preserved in audit.
* New review created.

---

# Epic 4 — Broker Verification

---

## US-009 — Submit Broker Verification

Acceptance Criteria

* Broker ID required.
* Video required.
* Upload validated.
* Status becomes Pending.

---

## US-010 — Re-submit Verification

Acceptance Criteria

* Allowed only after rejection.
* Previous submission archived.

---

# Epic 5 — Administration

---

## US-011 — View Member List

As an Administrator

I want to search members.

Acceptance Criteria

* Pagination.
* Filters.
* Search by name.
* Search by email.
* Search by status.

---

## US-012 — View Member Details

Acceptance Criteria

* Profile displayed.
* Subscription displayed.
* KYC displayed.
* Broker verification displayed.
* Audit history displayed.

---

## US-013 — Approve KYC

Acceptance Criteria

* Status changes to Approved.
* Member notified.
* Audit log created.

---

## US-014 — Reject KYC

Acceptance Criteria

* Rejection reason required.
* Member notified.
* Audit log created.

---

## US-015 — Approve Broker Verification

Acceptance Criteria

* Status updated.
* Member notified.
* Audit recorded.

---

## US-016 — Reject Broker Verification

Acceptance Criteria

* Reason required.
* Member notified.
* Audit recorded.

---

# Epic 6 — Trading Signals

---

## US-017 — Create Signal

As an Administrator

I want to create a trading signal.

Acceptance Criteria

* Draft saved.
* Validation completed.
* Signal stored.

---

## US-018 — Edit Signal

Acceptance Criteria

* Draft editable.
* Published signal follows publication policy.

---

## US-019 — Schedule Signal

Acceptance Criteria

* Future date required.
* Scheduler creates background job.

---

## US-020 — Publish Signal

Acceptance Criteria

* Signal becomes visible.
* Eligible members identified.
* Notifications generated.
* Audit recorded.

---

# Epic 7 — Signal Consumption

---

## US-021 — View Signals

As a Member

I want to view my trading signals.

Acceptance Criteria

* Only authorized signals displayed.
* Pagination available.
* Search available.

---

## US-022 — Read Signal

Acceptance Criteria

* Signal content displayed.
* Read status updated.

---

## US-023 — Mark Notification as Read

Acceptance Criteria

* Notification updated.
* Counter refreshed.

---

# Epic 8 — Notifications

---

## US-024 — Receive Notification

Acceptance Criteria

* Notification generated.
* Delivered in-app.
* Email optional.
* Telegram optional.

---

# Epic 9 — Subscription

---

## US-025 — View Subscription

Acceptance Criteria

* Current plan displayed.
* Expiration displayed.
* Status displayed.

---

## US-026 — Change Subscription

Acceptance Criteria

* Only administrators allowed.
* Audit created.
* Permissions updated immediately.

---

# Epic 10 — Audit

---

## US-027 — View Audit Logs

As a Super Administrator

Acceptance Criteria

* Search available.
* Filters available.
* Immutable records.

---

# Epic 11 — Settings

---

## US-028 — Configure Platform

Acceptance Criteria

* Editable settings.
* Validation applied.
* Audit generated.

---

# Epic 12 — Security

---

## US-029 — Two-Factor Authentication

Acceptance Criteria

* Available for administrators.
* Recovery codes generated.
* Secure verification.

---

## US-030 — Session Management

Acceptance Criteria

* View active sessions.
* Revoke session.
* Logout all devices.

---

# Story Status

Each story progresses through the following lifecycle:

Draft

↓

Ready

↓

In Development

↓

Code Review

↓

Testing

↓

Accepted

↓

Released

---

# Definition of Done

A user story is complete only if:

* acceptance criteria are satisfied;
* business rules are respected;
* automated tests pass;
* documentation is updated;
* audit logging is implemented when required;
* code review has been approved.

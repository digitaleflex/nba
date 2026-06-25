# Business Rules

# NeverBrokeAgain (NBA)

> Version: 1.0
> Status: Approved
> Last Updated: June 2026

---

# Purpose

This document defines every business rule governing the NeverBrokeAgain platform.

Business rules are mandatory.

No implementation may violate these rules.

If a requested feature conflicts with one or more business rules, the implementation must be rejected until the conflict is resolved.

---

# General Principles

The NBA platform is the single source of truth for:

* members
* subscriptions
* permissions
* trading signals
* verification status
* notifications

External systems (Telegram, Email, Broker, Payment Platform) are integrations only.

They never become the source of business data.

---

# User Lifecycle

Every member follows the same lifecycle.

```text
Visitor

↓

Registered

↓

KYC Submitted

↓

Broker Verification Submitted

↓

Pending Review

↓

Verified

↓

Active Member
```

A member cannot skip any mandatory verification step.

---

# Registration Rules

A member must provide:

* first name
* last name
* email
* WhatsApp number
* password
* subscription plan

The email address must be unique.

The WhatsApp number must be unique.

An account is created immediately after successful registration.

---

# Authentication Rules

Only authenticated users may access protected pages.

Expired sessions must be rejected.

Administrators must use Two-Factor Authentication.

Passwords are never stored in plain text.

---

# Subscription Rules

Each member owns exactly one active subscription plan.

Examples:

* Signals X Forex
* Signals X Deriv
* Signals X Forex + Deriv
* Signals X Pro Forex
* Signals X Pro Deriv
* Signals X Pro Forex + Deriv

Subscription plans determine platform permissions.

Plans must never be hardcoded inside the application.

---

# KYC Rules

Identity verification is mandatory.

Accepted documents:

* Passport
* National ID
* Driver License

Supported formats:

* JPG
* PNG
* PDF

A rejected document may be submitted again.

Only administrators may validate identity documents.

---

# Broker Verification Rules

Every member must submit:

* Broker Account ID
* Verification Video

Supported formats:

* MP4
* MOV

Maximum size:

30 MB

Maximum duration:

2 minutes

The submission remains pending until reviewed.

---

# Verification Rules

Only administrators may:

* approve
* reject
* request correction

Verification decisions must always be recorded in the audit log.

Rejected members may submit a new verification.

---

# Trading Signal Rules

Every signal belongs to one market category.

Examples:

* Forex
* Deriv

Future categories may be added without modifying existing business rules.

Every signal has:

* title
* content
* publication date
* author
* status

Signals may exist as:

* Draft
* Scheduled
* Published
* Archived

---

# Signal Visibility Rules

Members may only access signals included in their subscription.

Examples:

Forex members:

✔ Forex

✘ Deriv

Forex + Deriv members:

✔ Forex

✔ Deriv

Signal visibility is determined automatically.

Manual member selection is prohibited.

---

# Signal Publication Rules

Only authorized administrators may publish signals.

Publishing creates:

* signal record
* notifications
* audit log
* background processing job

Publishing must never block the user interface.

Heavy operations are processed asynchronously.

---

# Notification Rules

Notifications are generated automatically.

Supported channels:

* In-App
* Email
* Telegram (optional)

Notification delivery failures must never prevent signal publication.

---

# Dashboard Rules

Every member has access only to:

* own profile
* own notifications
* own verification status
* own subscriptions
* authorized signals

Members must never access another member's data.

---

# Administration Rules

Administrators may:

* manage members
* validate KYC
* validate broker submissions
* publish signals
* manage subscriptions

Administrators may not bypass audit logging.

Every administrative action must be recorded.

---

# Role Rules

Available roles:

* SUPER_ADMIN
* ADMIN
* KYC_AGENT
* SUPPORT_AGENT
* MEMBER

Permissions are role-based.

Permissions must never be checked manually inside components.

Authorization is centralized.

---

# File Management Rules

Uploaded files are temporary.

Files are stored only until verification is completed.

After validation:

* files are marked for deletion;
* background workers remove the files;
* deletion is logged.

Database records remain.

Binary files do not.

---

# Audit Rules

The following events must always be recorded:

* login
* logout
* registration
* KYC validation
* broker validation
* signal publication
* subscription changes
* account suspension
* permission changes

Audit records are immutable.

---

# Security Rules

HTTPS is mandatory.

Passwords must be hashed.

Uploads must be validated.

Every protected endpoint requires authentication.

Sensitive operations require authorization.

---

# Platform Rules

Telegram is not the platform.

Telegram is only a communication channel.

Members interact primarily through the NBA platform.

The platform remains fully functional even if Telegram becomes unavailable.

---

# Performance Rules

Heavy operations must be asynchronous.

Examples:

* notifications
* signal distribution
* scheduled jobs
* file deletion

The user interface should never wait for background processing.

---

# AI Development Rules

AI coding assistants must never:

* hardcode subscription plans;
* hardcode permissions;
* bypass validation;
* bypass authorization;
* duplicate business logic;
* implement business rules inside UI components.

Business logic belongs exclusively to the service layer.

---

# Future Compatibility Rules

New subscription plans must be added without changing existing business logic.

New notification channels must be pluggable.

New trading markets must be configurable.

Architecture decisions must preserve backward compatibility whenever possible.

---

# Definition of Done

A feature is considered complete only if:

* every applicable business rule is respected;
* permissions are enforced;
* audit logging is implemented;
* validation rules are applied;
* automated tests cover the business logic;
* no rule defined in this document is violated.

# Database Design

# NeverBrokeAgain (NBA)

> Version: 1.0
>
> Status: Approved
>
> Last Updated: June 2026

---

# Purpose

This document defines the database architecture of NeverBrokeAgain.

It specifies:

* entities;
* relationships;
* constraints;
* normalization rules;
* indexing strategy;
* lifecycle of data.

The database is the single source of truth for all business information.

---

# Database Technology

Database Engine

PostgreSQL

Provider

Neon PostgreSQL

ORM

Prisma

---

# Design Principles

The database follows these principles:

* Third Normal Form (3NF)
* Referential Integrity
* ACID Transactions
* Explicit Foreign Keys
* Soft Deletes where appropriate
* Immutable Audit Records

---

# Main Domains

The database is organized into business domains.

Authentication

Members

Subscriptions

Verification

Trading Signals

Notifications

Administration

Audit

System

---

# Entity Overview

Core Entities

Users

Roles

Permissions

Sessions

Accounts

Verification Tokens

Subscription Plans

User Subscriptions

KYC Documents

Broker Verifications

Trading Signals

Signal Audiences

Notifications

Notification Deliveries

Audit Logs

Settings

---

# Entity Relationships

```text
User

├── Session

├── Account

├── Subscription

├── KYC

├── Broker Verification

├── Notification

├── Audit Log

└── Trading Signal (Admin)
```

---

# User Domain

Main Entity

User

A user represents any authenticated person.

Types:

* Member
* Administrator
* Super Administrator
* KYC Agent
* Support Agent

---

Relationships

User

↓

Role

↓

Permissions

↓

Subscription

↓

Notifications

↓

Audit

---

# Subscription Domain

Entities

SubscriptionPlan

UserSubscription

Rules

A user owns one active subscription.

Subscription plans define access rights.

Plans are configurable.

---

# Verification Domain

Entities

KYCDocument

BrokerVerification

Rules

One user may submit multiple verification attempts.

Only one active verification exists at a time.

Rejected submissions remain archived.

---

# Trading Domain

Entities

Signal

SignalAudience

Rules

A signal targets one or more subscription plans.

Visibility is computed automatically.

---

# Notification Domain

Entities

Notification

NotificationDelivery

Channels

In-App

Email

Telegram

Future Push Notifications

---

# Audit Domain

Entity

AuditLog

Audit records are immutable.

Every critical action produces one audit record.

---

# Settings Domain

Entity

Setting

Stores platform configuration.

Settings are editable by administrators.

---

# Naming Convention

Tables

snake_case

Columns

snake_case

Primary Keys

id

Foreign Keys

entity_id

Created Date

created_at

Updated Date

updated_at

Deleted Date

deleted_at

---

# Primary Keys

Every table uses:

UUID v7

Reasons:

* globally unique;
* sortable;
* future distributed compatibility.

---

# Foreign Keys

Foreign keys are mandatory.

Cascade rules are explicitly defined.

No implicit relationships.

---

# Soft Delete Policy

Soft Delete applies to:

Users

Subscriptions

Signals

Hard Delete applies only to:

Temporary uploads

Expired sessions

Verification tokens

---

# Indexing Strategy

Indexes must exist on:

Email

Phone

Role

Subscription

Signal Status

Notification Status

Created Date

Updated Date

Foreign Keys

---

# Constraints

Unique

Email

Phone

Subscription Name

Role Name

Permission Name

Nullable Fields

Only when justified.

Business-critical data must remain mandatory.

---

# Transactions

Transactions are required for:

Registration

Subscription Assignment

Signal Publication

Verification Approval

Broker Approval

Administrative Actions

---

# Security

Passwords are never stored.

Sensitive files are never stored in the database.

Only metadata is stored.

---

# Scalability

The schema supports:

10,000+

100,000+

1,000,000+ members

without structural redesign.

---

# Future Compatibility

The schema allows:

Multiple notification providers

Multiple markets

Additional subscription plans

Mobile applications

Public API

Affiliate program

AI recommendations

without breaking existing data.

---

# Source of Truth

The PostgreSQL database remains the authoritative source for:

Users

Subscriptions

Signals

Permissions

Notifications

Audit

Verification

No external service may replace the database as the source of business truth.

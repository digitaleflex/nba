# ADR-010 — Cloudflare

> **Status:** Accepted
> **Date:** June 2026

---

# Context

NBA requires:

* HTTPS
* DNS management
* DDoS protection
* Performance optimization
* Secure public access

---

# Decision

Cloudflare is selected as the public edge layer.

Cloudflare sits in front of the VPS.

---

# Responsibilities

Cloudflare provides:

* DNS
* SSL/TLS
* CDN
* DDoS Protection
* Caching (where applicable)
* Security Rules

---

# Alternatives Considered

## Direct VPS Exposure

Rejected.

Reasons:

* Lower security
* No DDoS mitigation
* No global edge network

---

## AWS CloudFront

Rejected.

Reasons:

* Increased complexity
* Not required

---

# Consequences

## Positive

* Improved security
* Faster global access
* Simplified SSL management
* Better availability

---

## Negative

* Additional external dependency

---

# Architectural Rules

All production traffic must pass through Cloudflare.

The VPS should never be exposed directly to the Internet.

Security rules should be managed at the Cloudflare edge whenever possible.

---

# Related Documents

* TECHNICAL_ARCHITECTURE.md
* DEPLOYMENT.md

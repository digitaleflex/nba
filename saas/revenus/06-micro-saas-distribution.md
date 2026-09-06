# 📡 06 — Micro-SaaS Moteur Distribution Signaux

> **Pitch :** Vends ton **moteur BullMQ + Socket.IO + Push VAPID + Resend** en **API multi-canal** à 39-99€/mois pour coachs, médias et alertes.

---

## 🎯 Pitch 1 phrase

Tout business qui doit alerter vite (trading, immo, deals, B2B) loue ton moteur au lieu de recoder queues + WebSocket + push + email.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier | Rôle |
|--------|---------|------|
| **Queue** | `src/lib/queue/*` (BullMQ + Redis/Valkey) | Jobs fiables, retry, priorité |
| **Temps réel** | `src/lib/socket/*` (Socket.IO) | Push instantané <100ms |
| **Push** | `src/lib/push/*` (VAPID) | Notif navigateur même fermé |
| **Email** | `Resend` + templates | Fallback + digest |
| **Signal** | `Signal`, `SignalVersion`, `SignalAudience` | Contenu versionné + ciblage par plan |
| **Workers** | `workers/*` (4 workers) + multi-VPS | Scalabilité prod |
| **AuditLog** | `AuditLog` hash-chain | Traçabilité envoi |

## 💰 Pricing recommandé

| Plan | Prix/mois | Messages/mois | Canaux | Cible |
|------|-----------|---------------|--------|-------|
| **Starter** | **39€** | 5 000 | Socket + Email | Coach solo |
| **Pro** | **79€** | 25 000 | + Push | Média / communauté |
| **Scale** | **99€** | 100 000 | + Webhook + API | B2B / SaaS |
| **Free** | 0€ | 500 | Socket | Acquisition |

> Concurrents : Novu $50/mois, OneSignal $99/mois, Knock $49/mois → **39€ = -20% avec ciblage SignalAudience unique**.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone

| Client | Plan | Usage | MRR |
|--------|------|-------|-----|
| 5 coachs trading | Starter 39€ | 3k signaux/mois | **195€** |
| 2 médias deals (Telegram) | Pro 79€ | 20k alertes | **158€** |
| 1 prop firm | Scale 99€ | 80k notifs | **99€** |
| **Total M3 (8 clients)** | | | **452€/mois** |
| **M6 (15 clients)** | Mix | | **780-1 100€/mois** |
| **M12 (30 clients)** | | | **1 800-2 500€/mois** |

### Scénario Europe

- 10 coachs Pro 79€ = **790€/mois**
- 5 SaaS Scale 99€ = **495€**
- **Total 15 clients = 1 285€/mois**

### Coûts

- Infra : Redis/Valkey 10€/mois + VPS worker 12€ → 22€ fixes.
- Marge : 92% à 1k€ MRR.

## 🚀 3 étapes lancement (1-2 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. API wrapper** | Exposer `POST /api/v1/broadcast` (body: {title, markdown, audience, channels}) + auth `x-api-key` + rate-limit Redis existant | API live | J1-J3 |
| **2. Packager** | Repo `signauxx-dispatch` + landing Framer + doc Mintlify + pricing 39/79/99€ + démo live (envoi test en 2s) | Landing + doc | J4-J7 |
| **3. Distribuer** | Product Hunt + RapidAPI + 10 DMs/jour à coachs/médias + intégration Zapier/n8n (webhook) | 5 clients M1 | S2 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Concurrence Novu/OneSignal** | Élevé | Niche : ciblage `SignalAudience` par plan + versioning + français + prix Afrique |
| **Abus / spam** | Moyen | Rate-limit Redis + quota par plan + validation contenu + `AuditLog` |
| **Déliverabilité Push/Email** | Moyen | VAPID déjà prod + Resend (99% inbox) + fallback multi-canal |
| **Support WebSocket scale** | Faible | Déjà multi-VPS Tailscale, 4 workers, auto-reconnect Socket.IO |

---

*Bundlable avec `03-marketplace-signaleurs.md` (moteur = infra marketplace) et `pivots/07-alerting-b2b.md`.*


## 🔄 Cas d'usage élargis

- **Alerting B2B** : remplace PagerDuty pour PME Afrique (voir `pivots/07-alerting-b2b.md`).
- **Deals/Leaks** : push erreur prix Amazon (voir `pivots/06-deals-leaks.md`).

## ✅ Check-list technique

- [ ] Test charge 10k msgs/min (k6) + retry BullMQ OK
- [ ] Doc Mintlify avec 3 exemples curl + SDK JS
- [ ] Webhook signature HMAC

## 📈 KPIs

- Latence p95 <200ms, délivrabilité push >95%, churn <5%.

---

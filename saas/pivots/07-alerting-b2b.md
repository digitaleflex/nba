# 🚨 07 — Pivot Alerting B2B (PagerDuty-like)

> **Marché :** PME/ETI qui veulent un outil interne d'alertes (incidents, KPIs, RH) — B2B stable, panier 99-499€/mois, churn <3%.

---

## 🎯 Marché cible

- **PME/ETI Afrique & FR** : alerte « stock <10 », « CA jour < objectif », « incident prod », « RH congé ».
- **TAM** : PagerDuty $400M ARR, Opsgenie (Atlassian) ; Afrique : quasi aucun outil local → utilisent WhatsApp.
- **Douleur** : WhatsApp = pas de traçabilité, pas de priorité, pas d'escalade.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation B2B |
|------------|-------------------|
| `Signal` → `Alerte Interne` | Contenu + sévérité |
| RBAC 5 rôles (`Role`/`Permission`) | Ciblage par rôle (DSI, ops, RH) |
| BullMQ + Socket.IO + Push + Email | Multi-canal critique |
| `AuditLog` hash-chain | Traçabilité « qui a vu quand » (audit) |
| `KycDocument` (light) | Vérif employés |
| Admin 17 onglets | Super-admin DSI |
| Workers multi-VPS | Haute dispo |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // Alerte Interne
  severity String? // "info" | "warning" | "critical"
  source   String? // "grafana" | "n8n" | "manuel"
  ackBy    String? // userId qui a acquitté
  ackAt    DateTime?
}
// + webhook entrant POST /api/alerts (Grafana, n8n, Zapier)
```

- Effort : 1-2 jours.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **PagerDuty** | 29$/user, **$400M ARR** | 400M$ |
| **Opsgenie** (Atlassian) | 29$/user | ~100M$ ARR |
| **Novu** (open-source notif) | $2M seed, Cloud $50/mois | ~1M$ ARR |
| **Afrique PME** | WhatsApp → 0€ | Blue ocean |

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Starter | **99€** | 50 users, 1k alertes |
| Pro | **199€** | 200 users, 10k alertes + escalade |
| Enterprise | **499€** | Illimité + SLA + on-premise |
| Par user | 5€/user | Alternative |

> 10 PME Pro ×199€ = **1 990€/mois** ; 3 Enterprise ×499€ = **1 497€** → **3 487€/mois**.


## 📊 Exemple chiffré (Afrique vs Europe)

- **Afrique** : 100 payants ×19€ = **1 900€/mois** ; churn 7% → LTV 271€.
- **Europe** : 80 payants ×29€ = **2 320€/mois** ; churn 5% → LTV 580€.
- **Coût acquisition** : 5€/jour Meta → 150€/mois → 15 trials → 5 payants → CAC 30€ → payback <2 mois.

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Concurrence locale | Différenciation journal + audit + francophone |
| Churn | Streaks + push + communauté |
| Juridique | Disclaimer + CGU (doc 07) |

## 🔗 Dépendances & stack

- Next.js 16, Prisma 7, Neon, Better Auth, BullMQ, Socket.IO, Tailwind 4, Sentry.
- 0 refactor DB, 1-2 colonnes max.

---

## 🚀 Lancement 3 jours

- J1 : Fork + severity + webhook `POST /api/alerts`.
- J2 : Landing B2B + Stripe + 5 alertes exemples + intégration n8n.
- J3 : Outbound LinkedIn 10 DMs/jour DSI/PME.

---

*Le plus safe juridiquement (tu es infra, pas conseil). Churn B2B 3× plus faible que B2C.*

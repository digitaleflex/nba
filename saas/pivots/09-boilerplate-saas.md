# 🧱 09 — Pivot Boilerplate SaaS Admin (ShipFast)

> **Marché :** Devs / indie hackers / startups qui veulent un admin prod sans le coder — ShipFast $300k+ CA, Supastarter 2k+ ventes, marché $20-50k/mois par boilerplate.

---

## 🎯 Marché cible

- **Indie hackers** : veulent shipper en 1 jour, pas 22 jours.
- **Agences** : réutilisent boilerplate pour clients.
- **Startups Afrique** : besoin admin + KYC + audit pour lever.
- **TAM** : ShipFast $300k+ CA, Supastarter $199-499, 10k+ ventes cumulées ; **aucun boilerplate francophone avec KYC + audit hash-chain**.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Valeur boilerplate |
|------------|--------------------|
| **17 onglets** (MRR, analytics, fraud, IP reputation, device fingerprint, audit hash-chain, KYC queue, BrokerVerification) | 22 j-h, prod (81 users) |
| Design shadcn + base-ui + glassmorphisme + Tailwind 4 | Premium |
| Better Auth RBAC (5 rôles, 11 perms) | Granulaire |
| Prisma 29 models + Docker + CI/CD GHCR + multi-VPS | Prod-grade |
| 0 vulnérabilité + 8 releases + Sentry + Valkey + MinIO | Confiance |
| `recharts` + `AuditLog` | Analytics + traçabilité |

> 90% des boilerplates n'ont que CRUD + auth → toi = **vrai SaaS**.

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
// Extraire 14 models pertinents (User, Role, AuditLog, KycDocument, SubscriptionPlan...)
// Supprimer dépendances trading (Signal, Trade) → garder coeur admin
// 1 commande : npx prisma generate + seed demo
```

- Effort : **3-5 jours** (extraction `src/app/(admin)` + `src/lib/audit` + `src/lib/security`).
- Repo `signauxx-admin` + landing + doc.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Prix | CA estimé |
|------------|------|-----------|
| **ShipFast** (Marc Lou, $199) | **$300k+ CA** (~$25k/mois) | 300k$ |
| **Supastarter** ($199-499, 2k+ ventes) | ~**$400k CA** | 400k$ |
| **Indie Kit** ($149) | ~$150k CA | 150k$ |
| **Francophone** | Aucun avec KYC/audit | Blue ocean |

## 💰 Pricing possible

| Licence | Prix | Droits |
|---------|------|--------|
| Solo | **299€** | 1 projet |
| Team | **590€** | 5 projets |
| Agence | **1 500€** | Illimité + revente |

> 10 Solo/mois ×299€ = **2 990€** ; 3 Team ×590€ = **1 770€** → **4 760€/mois**.


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

## 🚀 Lancement 3-5 jours

- J1-J2 : Extraction repo + README_INSTALL + .env.example.
- J3-J4 : Landing Framer + comparatif ShipFast + Stripe.
- J5 : Product Hunt + Reddit r/nextjs + X + 10 DMs agences.

---

*Cash rapide, 0 SAV si FAQ vidéo. Voir `revenus/07-micro-saas-admin.md`.*

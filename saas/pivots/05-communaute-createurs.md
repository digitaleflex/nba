# 👥 05 — Pivot Communauté Premium Créateurs (Skool-like)

> **Marché :** Coachs fitness, business, séduction, dev, muscu — même douleur que trading : vendent via Telegram/WhatsApp artisanal, TAM 10× trading.

---

## 🎯 Marché cible

- **Créateurs** : fitness (49-99€/mois), business, dev, langues — 100k+ coachs FR, 1M+ global.
- **TAM** : Skool $1M+ MRR, Whop $100M GMV ; en Afrique **aucun Skool francophone**.
- **Douleur** : Telegram = pas de paiement auto, pas de progression, pas de gamification ; Whop/Skool = anglophone + cher (99$/mois/host).

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation créateurs |
|------------|-------------------------|
| `Signal` → `Publication` (vidéo, PDF, programme) | Contenu premium |
| `SubscriptionPlan` + `AccessRequest` + Stripe | Monétisation native (pas Whop) |
| `Conversation`/`Message` + typing Redis | Coaching 1to1 (valeur ×3 vs Telegram) |
| `JournalSession` → `Suivi Progrès` (poids, CA) | Habitude |
| `KycDocument` | Vérif âge si sensible |
| BullMQ + Push + Resend | Notif nouveau contenu |
| Admin 17 onglets | Gestion membres + MRR |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
// 0 code métier : renommage UI seul
// Signal → Publication, Journal → Suivi Progrès
// Option: 1 colonne
model Signal {
  typeContenu String? // "video" | "pdf" | "programme"
}
```

- Changer palette Tailwind + logo → **0 migration bloquante**.
- Effort : 1 jour.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Skool** ($99/mois/host) | **$1M+ MRR** → $12M ARR | 12M$ |
| **Whop** (3-30% fees) | **$100M GMV** → $10M fees | 10M$ |
| **Mighty Networks** ($34/mois) | ~$10M ARR | 10M$ |
| **Coach FR fitness Telegram** | 200 membres ×70€ = **14k€/mois** par coach | diffus |

> Whop/Skool = anglophone → **Skool francophone = blue ocean**.

## 💰 Pricing possible (côté host)

| Plan SaaS | Prix/mois | Contenu |
|-----------|-----------|---------|
| Starter | **49€** | 100 membres, 1 communauté |
| Pro | **99€** | 1 000 membres + API + white-label |
| Scale | **199€** | Illimité + sous-domaines |

> + commission 5% optionnelle. 20 hosts Pro ×99€ = **1 980€/mois**.


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

- J1 : Fork + renommer Publication/Suivi + palette.
- J2 : Landing « Skool francophone » + Stripe + 5 contenus exemples.
- J3 : Poster LinkedIn créateurs + 10 DMs coachs fitness/business.

---

*Plus gros TAM, même code. C'est le pivot SaaS doc 03 sans le mot trading.*

# 🛡️ 10 — Pivot KYC Fintech Afrique (Smile Identity $20M)

> **Marché :** Fintechs, Mobile Money, néobanques, crypto exchanges Afrique francophone (Wave, Djamo, Push, Y'assur) — régulation BCEAO 2024-2026 durcit KYC, besoin urgent, peu d'offres locales.

---

## 🎯 Marché cible

- **Fintechs** : Wave (Sénégal), Djamo (CIV), Push, Y'assur, microfinances, telcos — 100+ fintechs Afrique francophone, +20/an.
- **Régulation** : BCEAO impose KYC renforcé → amendes si non conforme.
- **TAM** : Smile Identity 1$/vérif, Onfido 2$/vérif ; Afrique 50M vérifs/an → $50M marché ; toi = 5× moins cher.
- **Douleur** : Smile ID cher + anglophone + données hors Afrique.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation KYC |
|------------|-------------------|
| `KycDocument` + `magicBytes` (anti-fake) + `auto-cleanup` (RGPD) + MinIO chiffré | **80% d'un KYC provider** |
| `BrokerVerification` (vidéo) | Liveness light |
| `AuditLog` hash-chain | Piste d'audit régulateur |
| Device fingerprint + IP reputation | Anti-fraude |
| BullMQ (queue vérif) | File d'attente |
| Admin 17 onglets | Dashboard fintech |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
// Exposer API
model KycDocument {
  // existant + 1 champ
  provider   String? // "internal" | "smile"
  score      Float?  // 0-100
}
// Endpoint : POST /api/kyc/verify (upload → magicBytes → OCR Tesseract → pending/approved/rejected)
// Dashboard : file d'attente + approve/reject
```

- Effort : 2 semaines (OCR + dashboard).
- Hébergement données **en Afrique** (avantage RGPD local).

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Smile Identity** (Afrique, levée $20M) | 1$/vérif, 100M vérifs | ~**$15M ARR** |
| **Onfido** (UK, $100M ARR) | 2$/vérif | 100M$ |
| **Didit** (gratuit→premium) | $1M ARR | 1M$ |
| **Yoti** (UK) | 1,5$/vérif | ~50M$ |

> En Afrique francophone : **Smile quasi seul** → prix élevé → toi = **0,10-0,30€/vérif**.

## 💰 Pricing possible

| Plan | Prix/mois | Vérifs incluses | Au-delà |
|------|-----------|-----------------|---------|
| Starter | **99€** | 500 | 0,15€ |
| Growth | **199€** | 2 000 | 0,12€ |
| Scale | **499€** | 10 000 | 0,10€ |

> 10 fintechs ×99€ = **990€ MRR** ; 50 fintechs = **4 950€ MRR** ; 100 fintechs = **9 900€ MRR**.


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

## 🚀 Lancement 2-3 semaines

- S1 : Exposer `POST /api/kyc/verify` + dashboard fintech.
- S2 : Landing + doc Mintlify + offre 100 vérifs gratuites.
- S3 : Outbound LinkedIn 10 DMs/jour CTOs Wave/Djamo/Push.

---

*Plus gros moat B2B, régulation = vent dans le dos. Top reco hors trading avec `05-communaute-createurs.md`.*

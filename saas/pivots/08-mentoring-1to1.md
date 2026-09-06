# 🎧 08 — Pivot Mentoring 1to1 (Superprof-like)

> **Marché :** Mentors business, carrière, expatriation, études — abonnement 49-199€/mois pour accès mentor + chat + visio, vs Superprof à l'heure.

---

## 🎯 Marché cible

- **Mentors** : business, dev, expat, études, carrière — 500k+ mentors FR, 2M+ global.
- **Mentorés** : 18-35 ans, besoin suivi continu (pas 1h ponctuelle).
- **TAM** : Superprof 20M users, Malt 10% com ; mentoring abonnement = blue ocean (Clarity.fm $2-10/min = cher).
- **Douleur** : Superprof = ponctuel, pas de suivi, pas de journal objectifs.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation mentoring |
|------------|-------------------------|
| `Conversation` + `Message` + typing Redis + reactions | WhatsApp pro (déjà prod) |
| `KycDocument` | Vérif mentors (diplôme, expérience) |
| `SubscriptionPlan` (99€/mois = 4 sessions + chat) | Abonnement |
| `Journal` → OKR light (objectifs mentoré) | Suivi progression |
| `Signal` → `Ressource Mentor` (exo, template) | Contenu |
| BullMQ + Push + Resend | Rappel session |
| Admin 17 onglets | Modération + litiges |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // Ressource Mentor
  mentorId String?
  type     String? // "exo" | "template"
}
// Nouvelle table (1 migration)
model Booking {
  id        String   @id @default(cuid())
  mentorId  String
  menteeId  String
  slot      DateTime
  status    String   // "pending" | "confirmed"
  meetUrl   String?
}
```

- Intégrer **Jitsi/Whereby** (visio gratuite) + Calendly-like.
- Effort : 2 jours.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Superprof** (20M users, 19-39€/mois) | Ads + pass élève | ~20M€/an |
| **Malt** (10% com) | ~**200M€ GMV** | 20M€ fees |
| **Clarity.fm** (US, $2-10/min) | ~5M$/an | 5M$ |
| **ComeUp** (FR, 5-500€) | 20% com | ~5M€/an |

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Mentoré Essentiel | **49€** | Chat illimité + 2 sessions/mois |
| Mentoré Premium | **99-199€** | 4 sessions + ressources + visio |
| Commission | 20% sur abonnement | Toi = Stripe Connect |

> 30 mentorés ×99€ ×20% = **594€/mois** par mentor ; 10 mentors = **5 940€/mois**.


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

- J1 : Fork + table Booking + visio Jitsi.
- J2 : Landing + Stripe + 3 mentors exemples.
- J3 : Poster LinkedIn + 10 DMs mentors + groupes FB expat.

---

*Valeur perçue forte (1to1) → churn faible si matching bon.*

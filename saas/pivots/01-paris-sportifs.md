# ⚽ 01 — Pivot Paris Sportifs (Beasts Bets)

> **Marché :** Parieurs Afrique francophone (1xBet, Melbet, 1xPartners) + France (Winamax, Betclic) — 500k+ abonnés Telegram cumulés, panier 19-49€/mois.

---

## 🎯 Marché cible

- **Afrique francophone** : 1xBet #1, jeunes 18-35 ans, Mobile Money, très Telegram.
- **France/Belgique** : Winamax/Betclic, parieurs 25-45 ans, besoin discipline.
- **TAM** : En France 47M€ dépensés/jour en paris sportifs (ANJ 2023) ; Afrique : 1xBet 10k+ affiliés locaux, chaque channel 5-15k abonnés payants.
- **Douleur** : signaux Telegram artisanaux (screenshot, pas de suivi, arnaques, pas de journal).

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation pari sportif |
|------------|----------------------------|
| `Signal` + `SignalVersion` + `SignalAudience` (VIP/Free) | **Pronostic** ciblé par bankroll/plan, historique versionné (« cote 1.85 → 1.90 ») |
| `Trade` (entry/exit/PnL/émotion) | **Bet** (mise, cote, résultat, statut pending/win/lose) |
| `JournalSession` + `DailyReflection` + `Streak` | Discipline parieur (tilt = churn #1) |
| BullMQ + Socket.IO + Push VAPID + Resend | Alerte **5 min avant match** (critique) |
| `Conversation`/`Message` + typing Redis | Entraide parieurs + SAV pronostiqueur |
| `KycDocument` + `BrokerVerification` | Vérif pronostiqueur (évite fake) + preuve ticket |
| Admin 17 onglets (fraud, IP reputation, audit hash-chain) | Modération pronos + anti-fake |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
// Option 1 : renommage UI seul (0 migration) — `Signal` → `Pronostic` côté front
// Option 2 : 1 colonne
model Signal {
  // ... existant
  cote        Float?   // ex: 1.85
  bookmaker   String?  // "1xBet" | "Winamax"
  sport       String?  // "football"
}
model Trade {
  // renommer conceptuellement Trade → Bet, ajouter:
  cote        Float?
  mise        Float?
  resultat    String?  // "pending" | "win" | "lose"
}
```

- **Effort** : 1 jour (migration + renommage 3 labels Tailwind).
- Remplacer CTA Deriv par **1xPartners / Melbet affiliation (40% rev share)**.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Beasts Bets** (FR) | ~2 000 VIP × 29€ = **58k€/mois** (~696k€/an) | 0,5-1M€/an |
| **Docteur Pronos** (FR) | 1M€ CA/an annoncé | 1M€ |
| **Blogabet** (EU) | Marketplace pronos, 30% commission, 10k tipsters | ~2M€/an |
| **Telegram Afrique** | Channels 5-10k payants × 10€ = 50-100k€/mois par réseau | diffus |

> Aucun ne propose **journal + streak + audit** → différenciation.

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Free | 0€ | 3 pronos/semaine, pub 1xBet |
| VIP | **19€** (Afrique) / **29€** (FR) | Tous pronos + push + journal |
| Premium | **49€** | + bilan mensuel + live + chat pronostiqueur |
| Affiliation | 40% rev share 1xBet | Passif (voir `revenus/02-affiliation-broker-ib.md`) |

> 200 VIP × 19€ = **3 800€/mois** + affiliation 1xBet (500€) = **4 300€/mois** réaliste M6.


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

- J1 : Fork + renommer labels + champ `cote` + CTA 1xBet.
- J2 : Landing + Stripe + 5 pronos exemples.
- J3 : Poster Telegram parieurs + X + 10 DMs pronostiqueurs.

---

*Stack identique, marché 5× trading en Afrique. Risque juridique plus faible (pas d'AMF) si disclaimer « pronostics informatifs ».*

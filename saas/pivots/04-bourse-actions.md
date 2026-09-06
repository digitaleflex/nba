# 📈 04 — Pivot Bourse Actions / ETF (PEA/CTO)

> **Marché :** Investisseurs retail 30-60 ans (PEA, CTO, ETF) — énorme, moins saturé que forex en francophonie, panier 19-59€/mois.

---

## 🎯 Marché cible

- **France/Belgique/Suisse** : 6M+ PEA/CTO, besoin reco action/ETF + newsletter.
- **Afrique diaspora** : ETF via brokers internationaux (XTB, Degiro).
- **TAM** : ZoneBourse 10M€ CA, Invvest 15k users ; marché francophone bourse 3× forex en âge/capital.
- **Douleur** : newsletters génériques, pas de suivi portefeuille vs CAC40, pas de journal investisseur.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation bourse |
|------------|----------------------|
| `Signal` + `SignalVersion` | **Recommandation** (« Achat LVMH 720€ → update 800€ ») |
| `Trade` → `Position` (quantité, PRU) | Portefeuille + PnL vs CAC40 |
| `JournalSession` + `DailyReflection` | Journal investisseur (« pourquoi vendu ? ») |
| Resend + `recharts` | Newsletter quotidienne + graph perf |
| `SignalAudience` (profil risque) | Prudent / Dynamique |
| `KycDocument` | Vérif profil (optionnel) |
| Admin 17 onglets | Analytics + modération |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // Recommandation
  ticker     String?  // "MC.PA"
  coursCible Float?
  horizon    String?  // "6 mois"
}
model Trade {
  // Position
  ticker     String?
  quantite   Float?
  pru        Float?
  coursActuel Float? // via Finnhub
}
```

- Brancher **API Finnhub / Yahoo Finance** (cours temps réel) au lieu de Deriv.
- Effort : 1-2 jours.

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **ZoneBourse** (premium 29€) | **10M€+ CA/an** | 10-15M€ |
| **Invvest** (FR, 15k users, 9€/mois) | ~135k€/mois → **1,6M€/an** | 1,5M€ |
| **Seeking Alpha** (US, 30$/mois, 10M users) | **200M$+ ARR** | 200M$ |
| **Afrique francophone** | Vide | Blue ocean |

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Free | 0€ | 3 recos/mois + newsletter hebdo |
| Investisseur | **19€** | Recos illimitées + portefeuille + journal |
| Premium | **39-59€** | + live mensuel + screener ETF |
| B2B | 299€/mois | Licence pour CGP |

> 200 investisseurs ×19€ = **3 800€/mois** + 50 Premium ×49€ = **2 450€** → **6 250€/mois**.


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

- J1 : Fork + ticker + API Finnhub.
- J2 : Landing + portefeuille recharts + Stripe.
- J3 : Poster LinkedIn finance + X + 10 DMs CGP.

---

*Crédibilité long terme, churn faible (investissement = patience).*

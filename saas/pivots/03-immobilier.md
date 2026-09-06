# 🏠 03 — Pivot Alertes Immobilier (Biens Sous-Évalués)

> **Marché :** Investisseurs immo France/Belgique + diaspora africaine (Abidjan, Dakar) — 1 deal sous-évalué = 10k€+ ROI, WTP 29-99€/mois.

---

## 🎯 Marché cible

- **France/Belgique** : locatif, colocation, division — marché tendu, besoin être 1er sur LeBonCoin/SeLoger.
- **Diaspora** : achat Abidjan/Dakar depuis Europe, manque veille locale.
- **TAM** : 1M+ recherches/mois SeLoger ; 30k agences FR ; 100k investisseurs retail.
- **Douleur** : alertes SeLoger en retard, pas de filtre rentabilité, pas de carte.

## 🧩 Pourquoi ta stack fit (modules exacts)

| Brique NBA | Réutilisation immo |
|------------|--------------------|
| `Signal` (markdown, versioning) | **Alerte Bien** (prix/m² < marché -20%) |
| `SignalAudience` (ville/budget) | Ciblage Paris <200k, Lyon <150k |
| Scraper + BullMQ + Socket.IO + Push | Alerte **instantanée** avant portails |
| `KycDocument` | Vérif investisseurs sérieux |
| `Conversation`/`Message` | Mise en relation acheteur ↔ apporteur |
| `Trade` → `Deal` (visite, offre, achat) | Suivi pipeline |
| Admin 17 onglets | Pilotage apporteurs |

## 🔧 Pivot minimal (1-2 modifs Prisma)

```prisma
model Signal {
  // Alerte Bien
  prix         Int?
  surface      Int?
  ville        String?
  rentabilite  Float?   // ex: 7.2%
  lienOriginal String?
  source       String?  // "leboncoin" | "seloger"
}
```

- Connecter **scraper Apify (LeBonCoin/SeLoger) + carte Mapbox**.
- Effort : 2-3 jours (scraper = 1 jour).

## 🏆 Concurrent qui gagne déjà + CA

| Concurrent | Modèle | CA estimé |
|------------|--------|-----------|
| **Horizon Immo** (FR, 49€/mois, ~800 ab.) | **39k€/mois** (~468k€/an) | 400-600k€ |
| **MoteurImmo** (freemium 100k users) | Ads + premium 19€ | ~800k€/an |
| **Bientôt Vendu** (pros, 5k€/an) | B2B agences | ~2M€/an |
| **Afrique** | Aucun acteur structuré | Blue ocean |

## 💰 Pricing possible

| Plan | Prix/mois | Contenu |
|------|-----------|---------|
| Free | 0€ | 3 alertes/semaine, 1 ville |
| Investisseur | **29€** (AF) / **49€** (FR) | Illimité + filtres rentabilité + push |
| Chasseur | **99€** | + accompagnement + off-market |
| Apporteur | 20% commission deal | Marketplace |

> 100 investisseurs ×49€ = **4 900€/mois** + 2 deals/mois × 5k€ ×20% = **2 000€** → **6 900€/mois**.


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

- J1 : Fork + champs immo + scraper Apify.
- J2 : Landing + Mapbox + Stripe + 5 biens exemples.
- J3 : Poster LinkedIn immo + groupes FB investissement.

---

*Ticket élevé → 1 client = 1 an de SaaS trading. Blue ocean Afrique.*

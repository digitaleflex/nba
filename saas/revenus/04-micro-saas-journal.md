# 📔 04 — Micro-SaaS Journal Trading Standalone

> **Pitch :** Extraits `Trade`, `JournalSession`, `DailyReflection` et `Streak` en un **SaaS journal trading autonome** à 19-29€/mois pour traders retail.

---

## 🎯 Pitch 1 phrase

Le Notion + Excel des traders, mais automatique, visuel (recharts) et avec streaks qui créent l'addiction à la discipline.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model Prisma | État |
|--------|------------------------|------|
| **Trade** | `Trade` (entry, exit, PnL, émotion, tags) | Prod, 81 users l'utilisent |
| **JournalSession** | `JournalSession` + `DailyReflection` | Complet avec notes quotidiennes |
| **Streak** | `Streak` (série jours tradés) | Gamification native |
| **Graphiques** | `recharts` (PnL, winrate, drawdown) | Déjà intégrés |
| **Auth & RBAC** | Better Auth, `User`, `SubscriptionPlan` | Prêt |
| **Admin** | Onglet journal dans admin 17 onglets | Supervision |
| **Dossier** | `src/components/journal/*`, `src/app/(trading)/journal` | 80% isolé |

## 💰 Pricing recommandé

| Plan | Prix/mois | Features | Cible |
|------|-----------|----------|-------|
| **Free** | 0€ | 20 trades/mois, 7j historique | Acquisition |
| **Trader** | **19€** | Illimité + stats + export CSV | Retail Afrique |
| **Pro** | **29€** | + IA insights + partage public + API | Retail Europe / prop firm |
| **Annuel** | -20% (152€/228€) | 2 mois offerts | LTV |

> Concurrents : Tradersync 29$/mois, EdgeWonk 169€ lifetime, Tradzella 19$/mois → **19€ = prix Afrique sweet spot**.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone

| Mois | Users free | Conversion 8% | Payants | MRR | Churn 7% |
|------|------------|---------------|---------|-----|----------|
| M1 | 200 | 16 | 16 | **304€** | -1 |
| M3 | 600 | 48 | 45 | **855€** | -3 |
| M6 | 1 200 | 96 | 88 | **1 672€** | -6 |
| M12 | 2 500 | 200 | 180 | **3 420€** | -12 |

> **Réaliste M3 : 570-855€/mois** avec 30-45 payants (via TikTok trading + SEO « journal trading »).

### Scénario Europe

- 80 payants × 29€ = **2 320€/mois**
- + upsell affiliation Deriv (30% des users cliquent) = +300€.

### Coûts

- Extraction repo : 1-2 sem (1 dev).
- Hébergement : 12€/mois (VPS existant) + Neon free tier.
- Acquisition : 5€/jour Meta Ads = 150€/mois → 20 trials → 6 payants → 114€ MRR → ROI 0,76 mois.

## 🚀 3 étapes lancement (2-3 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Extraire** | Fork repo → `signauxx-journal` → copier `Trade`, `JournalSession`, `DailyReflection`, `Streak`, `recharts`, routes `/journal` + `README` + `.env.example` | Repo standalone | S1 |
| **2. Packager** | Landing Framer (3 sections : problème Excel → solution auto → pricing) + Stripe checkout + démo vidéo 90s | Landing + paiement | S1-S2 |
| **3. Distribuer** | Poster sur X/TikTok « montre ton journal » + Reddit r/Daytrading + Product Hunt + 10 DMs/jour coachs trading | 200 signups M1 | S2-S3 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Concurrence Tradersync/EdgeWonk** | Élevé | Différenciation : prix local (19€ vs 29$), francophone, streaks, intégration signaux future |
| **Churn élevé (traders arrêtent)** | Moyen | Streaks + rappels push + email hebdo « ton résumé » + gamification |
| **Dispersion (autre micro-SaaS)** | Moyen | Lancer journal en premier (plus demandé), puis KYC/distribution — pas simultané |
| **Support CSV import** | Faible | Import Deriv/MT4/MT5 auto (parser 1 jour) + FAQ Loom |

---

*Complémentaire à `12-data-analytics.md` (data journal = insights vendus) et `08-formation-infoproduit.md` (bundle journal + formation).*


## 🔄 Variantes & bundling

- **Bundle formation** : Journal 19€ + Formation 97€ = 197€ → LTV x2.
- **White-label journal** : vendu à prop firms (logo + domaine) 99€/mois.

## ✅ Check-list qualité

- [ ] Import CSV Deriv/MT4 testé + 5 trades exemples
- [ ] Graphiques recharts responsive + export PNG
- [ ] Onboarding 3 étapes + streak J1

## 📈 KPIs

- Activation (1er trade <24h), rétention J7/J30, paywall conversion 8%.

---

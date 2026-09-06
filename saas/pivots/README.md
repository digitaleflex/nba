# 🔄 Pivots Alternatifs — Index des 10 Cas d'Usage

> **1 codebase, 10 marchés.** Chaque pivot = renommer `Signal` → nouveau nom + 1-2 colonnes Prisma, 3 jours, 0 refactor DB.

---

## 📊 Tableau comparatif

| # | Pivot | Fichier | Marché | Fit Stack | Revenu M6 réaliste | Délai pivot | Pricing cible |
|---|-------|---------|--------|-----------|--------------------|-------------|---------------|
| 1 | **Paris Sportifs** | [01-paris-sportifs.md](01-paris-sportifs.md) | Énorme (1xBet) | ⭐⭐⭐⭐⭐ | 1–4k€/mois | 1–2 j | 19–49€/mois |
| 2 | **Crypto Airdrops** | [02-crypto-airdrops.md](02-crypto-airdrops.md) | Hype | ⭐⭐⭐⭐ | 500–2k€/mois | 1–2 j | 19–39€/mois |
| 3 | **Immobilier** | [03-immobilier.md](03-immobilier.md) | Gros ticket | ⭐⭐⭐ | 500–1,5k€/mois | 2–3 j | 29–99€/mois |
| 4 | **Bourse Actions** | [04-bourse-actions.md](04-bourse-actions.md) | Énorme (PEA) | ⭐⭐⭐⭐ | 500–2k€/mois | 1–2 j | 19–59€/mois |
| 5 | **Communauté Créateurs** | [05-communaute-createurs.md](05-communaute-createurs.md) | Énorme (10× trading) | ⭐⭐⭐⭐⭐ | 1–5k€/mois | 1 j | 49–199€/host |
| 6 | **Deals / Leaks** | [06-deals-leaks.md](06-deals-leaks.md) | Viral | ⭐⭐⭐⭐ | 300–1,5k€/mois | 2 j | 9–19€/mois |
| 7 | **Alerting B2B** | [07-alerting-b2b.md](07-alerting-b2b.md) | B2B stable | ⭐⭐⭐⭐ | 500–2k€/mois | 1–2 j | 99–499€/mois |
| 8 | **Mentoring 1to1** | [08-mentoring-1to1.md](08-mentoring-1to1.md) | Croissant | ⭐⭐⭐⭐⭐ | 500–2k€/mois | 2 j | 49–199€/mois |
| 9 | **Boilerplate SaaS** | [09-boilerplate-saas.md](09-boilerplate-saas.md) | Dev | ⭐⭐⭐⭐⭐ | 500–2k€ one-shot | 3–5 j | 299–1500€ |
| 10 | **KYC Fintech Afrique** | [10-kyc-fintech-afrique.md](10-kyc-fintech-afrique.md) | **Blue ocean** | ⭐⭐⭐⭐⭐ | **1–5k€ MRR** | 2 sem | 99–499€/mois |

---

## 🧭 Matrice de choix — Quel pivot tester ?

| Si tu es / tu as... | Pivot recommandé | Pourquoi |
|---------------------|------------------|----------|
| **Audience parieurs / 1xBet** | **#1 Paris sportifs** | Même moteur, affiliation 40%, audience déjà Telegram |
| **Sur X/TikTok crypto** | **#2 Airdrops** | Hype + viralité, push critique |
| **Réseau agences immo** | **#3 Immobilier** | Ticket 10k€/deal, blue ocean Afrique |
| **Veux crédibilité long terme** | **#4 Bourse** | Churn faible, PEA = patience |
| **Veux plus gros TAM** | **#5 Créateurs (Skool)** | 10× trading, Skool francophone vide |
| **Veux viralité gratuite** | **#6 Deals** | 1 deal = 10k partages, affiliation Amazon |
| **Vises B2B stable** | **#7 Alerting B2B** | Panier 99-499€, churn 3%, safe juridique |
| **Connais mentors / Superprof** | **#8 Mentoring** | Valeur 1to1 = churn faible |
| **Veux cash rapide sans SAV** | **#9 Boilerplate** | 3-5j, vendu à devs, pas besoin audience |
| **Veux moat B2B + régulation** | **#10 KYC fintech** | Blue ocean, BCEAO = vent dans le dos |

> **Top 3 reco** : **#10 KYC** (B2B, moat) + **#5 Créateurs** (TAM) + **#1 Paris sportifs** (audience Afrique).

---

## 🔧 Template pivot 3 jours

- [ ] **J1** : Fork → renommer 3 labels (`Signal` → nouveau nom) + palette + logo
- [ ] **J1** : Remplacer CTA Deriv par API/broker du vertical (1xBet, Finnhub, Amazon PA-API, DexScreener)
- [ ] **J2** : Landing Framer/Next.js (1 page) + Stripe + 5 contenus exemples
- [ ] **J3** : Poster sur canal vertical (Telegram parieur, X crypto, LinkedIn fintech) + 10 DMs

> 2 pivots/mois testables en parallèle du trading. Kill si 0 traction à J14.

---

## 🔗 Ressources

| Besoin | Doc |
|--------|-----|
| Chiffrer revenu | [Revenus](../revenus/README.md) |
| Pitch SaaS trading | [White-Label](../saas-models/01-white-label.md) |
| Valider tech | [02-audit-saas-readiness.md](../02-audit-saas-readiness.md) + [05-architecture-cible.md](../05-architecture-cible.md) |
| Juridique | [07-risques-juridiques.md](../07-risques-juridiques.md) |

---

*Source : `11-cas-usages-alternatifs.md` découpé en 10 fiches. Tous réalisables en fork sans réécrire le cœur.*

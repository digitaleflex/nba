# 🗺️ 00 — Index Master — Tous les fichiers `saas/` (1 ligne / fichier)

> **42 fichiers** — 13 socle historique + 13 revenus + 10 pivots + 3 SaaS models + 4 READMEs/index. Structure en 3 sous-dossiers, fichiers historiques conservés.

---

## 📁 Racine `saas/` — socle historique (13 fichiers)

| Fichier | Description 1 ligne |
|---------|---------------------|
| [00-INDEX-MASTER.md](00-INDEX-MASTER.md) | **Vous êtes ici** — index global de tous les fichiers avec 1 ligne description |
| [README.md](README.md) | Hub navigation : arbre, table des matières, comment pitcher/exécuter/auditer |
| [01-valeur-projet.md](01-valeur-projet.md) | Valorisation chiffrée : 89 j-h, 157k LOC, 603 fichiers, 18,5M FCFA / 98k€ / 158k$ |
| [02-audit-saas-readiness.md](02-audit-saas-readiness.md) | Audit Ready/Gap/Effort : 80% prêt, gaps multi-tenant chiffrés |
| [03-business-model.md](03-business-model.md) | 3 pivots SaaS, pricing 49/149/299€ + commission, unit economics vs Whop/Skool |
| [04-roadmap-technique.md](04-roadmap-technique.md) | Roadmap 3 phases 8-15k€ / 4-6 semaines, fichiers à modifier, check-list dev |
| [05-architecture-cible.md](05-architecture-cible.md) | Diagram ASCII multi-tenant, isolation RLS/middleware, sous-domaines, Redis, sécu |
| [06-go-to-market.md](06-go-to-market.md) | GTM Afrique francophone + Dubaï : canaux, outbound 10 DMs/j, landing, script |
| [07-risques-juridiques.md](07-risques-juridiques.md) | Risques AMF/ESMA, disclaimers CGU, responsabilité white-label, KYC |
| [08-financial-model.md](08-financial-model.md) | Projections MRR 10/50/150 coachs, ARR, valo 10× ARR, seuil rentabilité 6 orgs |
| [09-checklist-lancement.md](09-checklist-lancement.md) | Check-list semaine par semaine, livrables, critères succès, RACI |
| [10-revenus-hors-saas.md](10-revenus-hors-saas.md) | Synthèse 13 sources sans SaaS (affiliation, marketplace, licence, API, agence…) — stacking 5-10k€/mois |
| [11-cas-usages-alternatifs.md](11-cas-usages-alternatifs.md) | Synthèse 10 pivots sans réécrire le code (paris sportifs → KYC fintech) |

---

## 💸 `saas/revenus/` — 13 sources de revenus hors-SaaS (14 fichiers)

| Fichier | Description 1 ligne |
|---------|---------------------|
| [revenus/README.md](revenus/README.md) | Index tableau 13 sources (type/effort/revenu/délai) + stacking Cash Now / Scale |
| [revenus/01-licence-code-source.md](revenus/01-licence-code-source.md) | Vente code Gumroad/Codester 590/990/1990€, plateformes, licence privée, CA 1,5-4k€/mois |
| [revenus/02-affiliation-broker-ib.md](revenus/02-affiliation-broker-ib.md) | Deriv IB 30-50% spread à vie, flag hasDeriv, calcul 100 traders = 1,1-3,2k€/mois |
| [revenus/03-marketplace-signaleurs.md](revenus/03-marketplace-signaleurs.md) | Marketplace type Fiverr, commission 20%, modération trust, 10 signaleurs = 2,3k€/mois |
| [revenus/04-micro-saas-journal.md](revenus/04-micro-saas-journal.md) | Journal Trading standalone (Trade/JournalSession/Streak/recharts) 19-29€/mois |
| [revenus/05-micro-saas-kyc.md](revenus/05-micro-saas-kyc.md) | KYC-as-a-Service (KycDocument+magicBytes+auto-cleanup) 49-149€ +0,10€/vérif fintechs |
| [revenus/06-micro-saas-distribution.md](revenus/06-micro-saas-distribution.md) | Moteur distribution BullMQ+Socket.IO+Push en API 39-99€/mois |
| [revenus/07-micro-saas-admin.md](revenus/07-micro-saas-admin.md) | Boilerplate Admin 17 onglets vendu 299/590/1500€ (ShipFast-like, 22 j-h) |
| [revenus/08-formation-infoproduit.md](revenus/08-formation-infoproduit.md) | Module Formation existant 97-497€, funnel Resend J0/J2/J5/J7, 1-2k€/mois |
| [revenus/09-api-as-product.md](revenus/09-api-as-product.md) | API RapidAPI `GET /api/v1/signals` 19-99$/mois, auth x-api-key, rate-limit |
| [revenus/10-service-agence.md](revenus/10-service-agence.md) | Clonage sur-mesure 5-15k€/projet, process 2-3 sem, retainer 500-1500€/mois |
| [revenus/11-copy-trading.md](revenus/11-copy-trading.md) | PAMM/MAM 25% perf fee, API Deriv/Binance, 100 copieurs = 3,9k€/mois, risque AMF |
| [revenus/12-data-analytics.md](revenus/12-data-analytics.md) | Data anonymisée journal, rapport 199-499€ + dashboard 299€/mois B2B |
| [revenus/13-franchise-vip.md](revenus/13-franchise-vip.md) | Franchise par pays 1500€+15% + VIP Telegram/Discord 19-39€/mois (50 VIP = 950€ MRR) |

---

## 🔄 `saas/pivots/` — 10 cas d'usage alternatifs (11 fichiers)

| Fichier | Description 1 ligne |
|---------|---------------------|
| [pivots/README.md](pivots/README.md) | Tableau comparatif 10 pivots + matrice choix + template 3 jours |
| [pivots/01-paris-sportifs.md](pivots/01-paris-sportifs.md) | Paris sportifs 1xBet 40% (Beasts Bets 58k€/mois), pivot `cote` 1 colonne |
| [pivots/02-crypto-airdrops.md](pivots/02-crypto-airdrops.md) | Crypto airdrops/meme (EarniFi, Maverick 87k€/mois) + DexScreener |
| [pivots/03-immobilier.md](pivots/03-immobilier.md) | Alertes immo sous-évaluées, scraper LeBonCoin, Horizon Immo 39k€/mois |
| [pivots/04-bourse-actions.md](pivots/04-bourse-actions.md) | Bourse PEA/ETF, Finnhub, ZoneBourse 10M€ CA, `ticker`+`pru` |
| [pivots/05-communaute-createurs.md](pivots/05-communaute-createurs.md) | Skool-like fitness/business (TAM 10×), Whop $100M GMV, 0 code métier |
| [pivots/06-deals-leaks.md](pivots/06-deals-leaks.md) | Deals/Leaks Dealabs 2M€/an + Pepper 50M€, Amazon PA-API, viral |
| [pivots/07-alerting-b2b.md](pivots/07-alerting-b2b.md) | Alerting B2B PagerDuty $400M ARR, 99-499€/mois, `severity` + webhook |
| [pivots/08-mentoring-1to1.md](pivots/08-mentoring-1to1.md) | Mentoring 1to1 Superprof/Malt, table `Booking` + Jitsi, 49-199€/mois |
| [pivots/09-boilerplate-saas.md](pivots/09-boilerplate-saas.md) | Boilerplate SaaS ShipFast $300k, extraction 17 onglets 3-5j, 299-1500€ |
| [pivots/10-kyc-fintech-afrique.md](pivots/10-kyc-fintech-afrique.md) | KYC fintech Afrique Smile $20M, 0,10€/vérif vs 1$, BCEAO blue ocean |

---

## 🧩 `saas/saas-models/` — 3 modèles SaaS comparés (4 fichiers)

| Fichier | Description 1 ligne |
|---------|---------------------|
| [saas-models/README.md](saas-models/README.md) | Comparatif 3 modèles + matrice choix + reco STAR + bundle |
| [saas-models/01-white-label.md](saas-models/01-white-label.md) | ⭐ STAR white-label 49/149/299€ +3%, GTM outbound, 50 coachs = 9,4k€ MRR |
| [saas-models/02-communaute-generique.md](saas-models/02-communaute-generique.md) | Communauté générique Skool-like 49/99/199€ +5%, TAM 10× trading |
| [saas-models/03-journal-b2b.md](saas-models/03-journal-b2b.md) | Journal B2B prop firms 99/299/599€, churn 3%, LTV 18× B2C |

---

## 📊 Récap chiffré

| Dossier | Fichiers | Lignes totales approx | Prix / MRR typique |
|---------|----------|-----------------------|--------------------|
| Racine (01-11 + READMEs + index) | 13 | ~1 400 | Valo 18,5M FCFA / MRR 13k€ (50 coachs) |
| revenus/ | 14 | ~1 300 | Stack 5-10k€/mois |
| pivots/ | 11 | ~950 | Pivot 500-5k€/mois |
| saas-models/ | 4 | ~300 | SaaS 4-14k€ MRR |
| **TOTAL** | **42 (+ .gitkeep)** | **~3 950** |  |

---

## ✅ Vérification

```bash
find saas -type f | sort
ls -R saas/
wc -l saas/**/*.md saas/*.md
```

> Fichiers historiques 01-11 **conservés**. Nouveaux dossiers = **ajouts**, pas suppressions. Chaque fiche revenus/pivots/models = 80-150 lignes, markdown pro, français, chiffré Afrique/Europe.

---

*Index généré le 6 septembre 2026 — structure : 1 fichier = 1 possibilité, 3 sous-dossiers, 42 fichiers documentaires.*

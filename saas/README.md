# 📁 Dossier SaaS — SignauxX / NeverBrokeAgain

> **Pitch en une phrase :** SignauxX transforme l'infrastructure premium de NeverBrokeAgain (157k LOC, 29 models Prisma, 89 j-h, 81 users prod) en **SaaS white-label pour coachs trading** — chaque coach obtient sa plateforme marquée à son nom en 48h, sans coder.

---

## 🎯 Objet du dossier

Ce dossier `saas/` est le **dossier investisseur & opérationnel** pour pitcher et exécuter la transformation SaaS de NeverBrokeAgain. Il contient tout ce qu'un associé, investisseur ou repreneur doit savoir : valeur actuelle, audit technique, business model, roadmap chiffrée, architecture cible, go-to-market, risques juridiques, modèle financier, checklist de lancement, **revenus hors SaaS détaillés en 13 fiches**, **10 pivots sans réécrire le code** et **3 modèles SaaS comparés**.

80 % du SaaS est déjà construit — il ne manque que le **multi-tenant** (4 à 6 semaines). Et même sans SaaS, **13 sources de revenus** sont activables immédiatement (dossier `revenus/`).

---

## 🗂️ Structure — nouvelle organisation

```
saas/
├── 00-INDEX-MASTER.md              ← index global (tous les fichiers, 1 ligne chacun)
├── README.md                       ← vous êtes ici (arbre + navigation)
│
├── 01-valeur-projet.md             ← synthèse chiffrée 89 j-h / 157k LOC / valorisation
├── 02-audit-saas-readiness.md      ← Ready / Gap / Effort
├── 03-business-model.md            ← 3 pivots SaaS, pricing 49/149/299€ + 3%
├── 04-roadmap-technique.md         ← 3 phases 8-15k€, 4-6 semaines
├── 05-architecture-cible.md        ← diagram multi-tenant + isolation + Redis
├── 06-go-to-market.md              ← GTM Afrique + Dubaï, canaux, outbound
├── 07-risques-juridiques.md        ← AMF/ESMA, disclaimers, CGU
├── 08-financial-model.md           ← MRR 10/50/150 coachs, ARR, valo 10×
├── 09-checklist-lancement.md       ← plan semaine par semaine
├── 10-revenus-hors-saas.md         ← synthèse 13 sources (ancien, gardé)
├── 11-cas-usages-alternatifs.md    ← synthèse 10 pivots (ancien, gardé)
│
├── revenus/                        ← 💸 13 sources de revenus hors-SaaS (1 fichier / source)
│   ├── README.md                   ← tableau type / effort / revenu / délai + stacking
│   ├── 01-licence-code-source.md   ← Gumroad/Codester 590/990/1990€
│   ├── 02-affiliation-broker-ib.md ← Deriv IB 30-50% à vie
│   ├── 03-marketplace-signaleurs.md← commission 20% type Fiverr
│   ├── 04-micro-saas-journal.md    ← Journal standalone 19-29€/mois
│   ├── 05-micro-saas-kyc.md        ← KYC-as-a-Service 49-149€ + 0,10€/vérif
│   ├── 06-micro-saas-distribution.md← BullMQ+Socket.IO API 39-99€/mois
│   ├── 07-micro-saas-admin.md      ← Boilerplate 17 onglets 299/590/1500€
│   ├── 08-formation-infoproduit.md ← Formation 97-497€
│   ├── 09-api-as-product.md        ← RapidAPI 19-99$/mois
│   ├── 10-service-agence.md        ← Clonage 5-15k€/projet
│   ├── 11-copy-trading.md          ← PAMM/MAM 25% perf fee
│   ├── 12-data-analytics.md        ← Insights B2B 199-499€
│   └── 13-franchise-vip.md         ← Franchise pays + VIP Telegram 19-39€
│
├── pivots/                         ← 🔄 10 cas d'usage alternatifs (1 fichier / pivot)
│   ├── README.md                   ← tableau comparatif + matrice choix
│   ├── 01-paris-sportifs.md        ← Beasts Bets, 1xBet 40%
│   ├── 02-crypto-airdrops.md       ← EarniFi, meme coins
│   ├── 03-immobilier.md            ← Horizon Immo, LeBonCoin scraper
│   ├── 04-bourse-actions.md        ← ZoneBourse, Finnhub
│   ├── 05-communaute-createurs.md  ← Skool-like, TAM 10×
│   ├── 06-deals-leaks.md           ← Dealabs, Amazon PA-API
│   ├── 07-alerting-b2b.md          ← PagerDuty-like 99-499€/mois
│   ├── 08-mentoring-1to1.md        ← Superprof-like, Booking
│   ├── 09-boilerplate-saas.md      ← ShipFast $300k
│   └── 10-kyc-fintech-afrique.md   ← Smile Identity $20M, 0,10€/vérif
│
├── saas-models/                    ← 🧩 3 modèles SaaS comparés
│   ├── README.md                   ← comparatif + reco STAR
│   ├── 01-white-label.md           ← ⭐ STAR 49/149/299€ +3%
│   ├── 02-communaute-generique.md  ← Skool-like 49/99/199€
│   └── 03-journal-b2b.md           ← Prop firms 99/299/599€ B2B
│
└── .gitkeep
```

> **Règle** : les 11 fichiers historiques `01` à `11` + `README` sont **conservés** (non supprimés). Les 3 sous-dossiers **ajoutent** une organisation propre : 1 fichier = 1 possibilité, 80-150 lignes, chiffré, en français.

---

## 📚 Table des matières — navigation rapide

### A. Socle historique (fichiers 01-11)

| # | Document | Objet | Audience |
|---|----------|-------|----------|
| 00 | [Index Master](00-INDEX-MASTER.md) | Liste **tous les fichiers** (41) avec 1 ligne description | Tous |
| 01 | [Valeur du projet](01-valeur-projet.md) | 89 j-h, 157k LOC, valo 18,5M FCFA / 98k€ / 158k$ | Investisseur, repreneur |
| 02 | [Audit SaaS Readiness](02-audit-saas-readiness.md) | Ready/Gap/Effort | CTO, auditeur |
| 03 | [Business Model](03-business-model.md) | 3 pivots SaaS, pricing Starter 49€ / Pro 149€ / Scale 299€ | CEO, investisseur |
| 04 | [Roadmap Technique](04-roadmap-technique.md) | 3 phases 8–15k€, 4–6 semaines, fichiers à modifier | CTO, dev |
| 05 | [Architecture Cible](05-architecture-cible.md) | Diagram multi-tenant, isolation, sous-domaines, Redis, sécu | Architecte, DevOps |
| 06 | [Go-To-Market](06-go-to-market.md) | GTM Afrique + Dubaï, canaux, outbound | Marketing, sales |
| 07 | [Risques Juridiques](07-risques-juridiques.md) | AMF/ESMA, disclaimers, CGU, white-label | Juridique |
| 08 | [Financial Model](08-financial-model.md) | Projections MRR 10/50/150 coachs, valo 10× ARR | CFO, investisseur |
| 09 | [Checklist Lancement](09-checklist-lancement.md) | Plan semaine par semaine | Fondateur, PM |
| 10 | [Revenus Hors SaaS (synthèse)](10-revenus-hors-saas.md) | 13 sources sans SaaS — stacking 5–10k€/mois | Fondateur, CFO |
| 11 | [Cas d'Usages Alternatifs (synthèse)](11-cas-usages-alternatifs.md) | 10 pivots sans réécrire le code | CEO, CTO |

### B. Dossiers détaillés (nouvelle organisation)

| Dossier | README | Contenu | Fiches |
|---------|--------|---------|--------|
| **revenus/** | [Index revenus](revenus/README.md) | 13 sources hors-SaaS, 1 fiche = 1 source | 13 |
| **pivots/** | [Index pivots](pivots/README.md) | 10 pivots, matrice choix, comparatif | 10 |
| **saas-models/** | [Index SaaS](saas-models/README.md) | 3 modèles SaaS, reco STAR | 3 |

---

## 🚀 Comment utiliser ce dossier

### Pour pitcher (15 minutes)

1. **Ouvrir [01-valeur-projet.md](01-valeur-projet.md)** → 18,5M FCFA déjà investis, 0 vulnérabilité, 8 releases.
2. **Enchaîner sur [02-audit-saas-readiness.md](02-audit-saas-readiness.md)** → 80% prêt, gap clair chiffré.
3. **Présenter [saas-models/01-white-label.md](saas-models/01-white-label.md)** → pivot **STAR**, pricing 49/149/299€ +3%, comparatif Whop/Skool.
4. **Conclure avec [08-financial-model.md](08-financial-model.md)** → scénarios MRR et valo 10× ARR (50 coachs = 1,57M€).
5. **Bonus cash** : [revenus/README.md](revenus/README.md) → 13 sources sans SaaS, stacking 5–10k€/mois en 14 jours.

### Pour exécuter (4–6 semaines)

1. Suivre **[04-roadmap-technique.md](04-roadmap-technique.md)** phase par phase.
2. Valider architecture avec **[05-architecture-cible.md](05-architecture-cible.md)**.
3. Lancer GTM en parallèle via **[06-go-to-market.md](06-go-to-market.md)** et **[saas-models/01-white-label.md](saas-models/01-white-label.md)**.
4. Cocher **[09-checklist-lancement.md](09-checklist-lancement.md)** chaque semaine.

### Pour générer du cash sans SaaS (14 jours)

1. **Lire [revenus/README.md](revenus/README.md)** → top 3 quick wins : VIP Telegram + affiliation Deriv + formation 97€.
2. **Choisir un pivot [pivots/README.md](pivots/README.md)** si trading n'est pas ta verticale (KYC fintech, paris sportifs, boilerplate).
3. **Stacker 3–4 sources** → 5–10k€/mois sans multi-tenant (ex: VIP 950€ + affiliation 600€ + formation 2k€).

### Pour auditer / diligencer

- **Valeur** : [01-valeur-projet.md](01-valeur-projet.md) + `estimation-valeur.md` à la racine.
- **Technique** : [02-audit-saas-readiness.md](02-audit-saas-readiness.md) + [05-architecture-cible.md](05-architecture-cible.md) + [saas-models/](saas-models/).
- **Juridique** : [07-risques-juridiques.md](07-risques-juridiques.md).
- **Financier** : [08-financial-model.md](08-financial-model.md) + [revenus/](revenus/) (revenus immédiats).
- **Stratégie** : [pivots/](pivots/) (10 pivots) + [saas-models/](saas-models/) (3 modèles).

---

## 📊 Chiffres clés en un coup d'œil

| Indicateur | Valeur |
|------------|--------|
| **LOC** | 157 381 (+ 5 410 tests) |
| **Fichiers code** | 603 |
| **Models Prisma** | 29 (43 avec techniques) |
| **Commits** | 913 (773 humains) |
| **Jours-homme** | 89 j-h sur 67 jours |
| **Releases** | 8 (v1.0.0 → v2.5.0) |
| **Utilisateurs prod** | 81 |
| **Vulnérabilités** | 0 (pnpm audit clean) |
| **Valeur médiane** | **18 500 000 FCFA** (~27 500 € / ~30 000 $) |
| **Valeur agence Europe** | 100 000 – 158 000 € |
| **SaaS readiness** | **~80 %** |
| **Effort multi-tenant** | 8–15k€, 4–6 semaines |
| **Fichiers saas/ (total)** | **41** (11 historiques + 3 READMEs + 26 fiches + 1 index) |
| **Sources hors-SaaS** | 13 fiches dans [revenus/](revenus/) |
| **Pivots** | 10 fiches dans [pivots/](pivots/) |
| **Modèles SaaS** | 3 fiches dans [saas-models/](saas-models/) |

---

## ⚡ Démarrage rapide — TL;DR investisseur pressé

> **NeverBrokeAgain, c'est 89 jours-homme et 157k lignes production-grade (Next.js 16, Prisma, BullMQ, Socket.IO, multi-VPS). 80 % du SaaS est déjà là : auth, RBAC, abonnements, queues, temps réel. Il reste le multi-tenant (4–6 semaines, 8–15k€) pour ouvrir un marché white-label : 10–50 coachs = 1 500–7 500 € MRR an 1, valorisable 10× ARR. Pivot STAR : White-Label coachs trading (49€/149€/299€ + 3%). Sans SaaS, 13 revenus stackables = 5–10k€/mois.**

---

## 🔗 Index complet

→ **[00-INDEX-MASTER.md](00-INDEX-MASTER.md)** — liste **tous les 41 fichiers** avec 1 ligne description chacun.

---

*Dossier généré le 6 septembre 2026 — basé sur 913 commits, données git, schema Prisma et estimation-valeur.md. Réorganisé en 3 sous-dossiers (revenus/pivots/saas-models) sans suppression des 11 fichiers historiques.*

# 💼 03 — Business Model SaaS

> **3 pivots possibles. Un seul recommandé : A White-Label coachs trading.** Les deux autres sont des filets de sécurité crédibles.

---

## 🎯 Positionnement

**SignauxX n'est pas un concurrent de Whop ou Skool.** C'est un **Shopify pour coachs trading** : une plateforme où chaque coach déploie **sa propre app** (son nom, son domaine, ses couleurs, ses signaux, sa communauté, son journal) — pas une page dans un marketplace.

| Marketplace (Whop, Skool) | SaaS White-Label (SignauxX) |
|---------------------------|------------------------------|
| Ton audience appartient à la plateforme | **Ton audience t'appartient** (export, domaine custom) |
| 3–30 % de commission | **Abonnement fixe + 5–10 %** — tu gardes la marge |
| Branding Whop/Skool | **100 % ta marque** (logo, couleurs, `ton-nom.signauxx.com` ou `tondomaine.com`) |
| Communauté générique | **Signaux + journal + messagerie** natifs trading |

---

## 🔀 Les 3 pivots SaaS détaillés

### 🅰️ Pivot A — White-Label pour coachs trading — ⭐ RECOMMANDÉ

**Concept** : chaque coach trading (Afrique francophone, Dubaï, Europe) crée son organisation en 48h : `coachdupont.signauxx.com` ou `signaux.coachdupont.com`. Il y publie ses signaux, gère ses abonnés, anime sa messagerie, et ses membres utilisent le journal trading. SignauxX facture le coach, le coach facture ses membres.

**Pour qui :**
- Coachs Telegram/Discord avec 500–10 000 abonnés qui galèrent avec paiement manuel + diffusion artisanale
- Formateurs trading qui veulent une app premium sans dev (valeur perçue ×3 vs. canal Telegram)
- Influenceurs finance qui monétisent déjà mais perdent 20–30 % chez Whop

**Ce que le coach obtient :**
- Site + app marquée à son nom (sous-domaine ou domaine custom)
- Publication signaux avec ciblage par plan (ex: VIP vs. Starter)
- Distribution temps réel (push, email, WebSocket, Telegram/WhatsApp)
- Messagerie privée coach ↔ membre
- Journal trading pour ses membres (rétention)
- Gestion abonnements (Stripe) + KYC optionnel
- Dashboard MRR, churn, engagement

**Pourquoi c'est le bon pivot :**
- ✅ **Marché identifié** : des centaines de coachs FR/EN/AR sur Telegram/Instagram/TikTok qui paieraient 49–299 €/mois pour paraître pro
- ✅ **Douleur aiguë** : gestion paiements + diffusion = cauchemar opérationnel
- ✅ **Actif différenciant** : journal trading + signaux temps réel = pas clonable en 2 semaines
- ✅ **Pricing soutenable** : 50 coachs × 149 € = 7 450 € MRR sans compter les commissions
- ✅ **Moat** : chaque coach qui migre ses 200–1 000 membres verrouille son org (switching cost élevé)

**Risques & parades :**
| Risque | Parade |
|--------|--------|
| Coachs volatils / churn | Engagement 3 mois min + export facilité = confiance, pas prison |
| Support multi-org | Super-admin + docs + onboarding vidéo + SLA par tier |
| Fraude / mauvais signaux | Disclaimer + CGU : SignauxX = hébergeur, responsabilité = coach (voir doc 07) |

---

### 🅱️ Pivot B — Communauté premium générique (type Skool/Whop)

**Concept** : plateforme unique où **tout créateur** (trading, fitness, business, crypto) crée sa communauté payante. Plus large que le trading, mais moins différenciant.

**Pour qui :** créateurs de communautés payantes tous secteurs.

**Avantages :**
- Marché plus large (TAM supérieur)
- Modèle validé par Skool ($1M+ MRR) et Whop

**Inconvénients :**
- ❌ Concurrence frontale avec Skool/Whop/Discord — guerre feature
- ❌ Journal trading et signaux deviennent anecdotiques
- ❌ Besoin de beaucoup plus de features communautaires (cours vidéo, gamification poussée)
- ❌ Positionnement flou : pourquoi choisir SignauxX vs. Skool ?

**Verdict :** plan B crédible si le white-label trading ne décolle pas en 6 mois — mais dilue l'avantage technique existant.

---

### 🅲️ Pivot C — Journal trading standalone (type Tradersync / Edgewonk)

**Concept** : SaaS grand public centré uniquement sur le **journal trading** (saisie trades, analytics, discipline, streaks, réflexions quotidiennes). Abonnement 19–39 €/mois par trader individuel.

**Pour qui :** traders retail qui veulent progresser (marché B2C).

**Avantages :**
- Marché B2C large, acquisition via SEO/content
- Module journal déjà 85 % prêt (Trade, JournalSession, DailyReflection, Streak)

**Inconvénients :**
- ❌ CAC B2C élevé, churn naturel fort (traders abandonnent)
- ❌ Concurrence installée (Tradersync, Edgewonk, TraderVue) — $29–$50/mois
- ❌ ARPU faible (19–39 €) vs. white-label (49–299 € + commission)
- ❌ Gaspille l'actif le plus précieux : distribution signaux + messagerie + RBAC

**Verdict :** excellent **add-on** du pivot A (donné aux membres du coach = rétention), mais faible comme produit principal.

---

## 💰 Pricing tiers — Pivot A (recommandé)

| Tier | Prix / mois | Cible | Membres inclus | Commission SignauxX | Features clés |
|------|-------------|-------|----------------|---------------------|---------------|
| **Starter** | **49 €** | Coach solo qui démarre | Jusqu'à 100 membres | **10 %** sur abonnements membres | 1 org, sous-domaine, signaux illimités, messagerie, journal, Stripe billing, support email 48h |
| **Pro** | **149 €** | Coach établi (500–2k membres) | Jusqu'à 1 000 membres | **7 %** | Tout Starter + domaine custom, theming complet, API publique, webhooks, analytics avancés, support 24h, onboarding coach |
| **Scale** | **299 €** | Académie / team (2k+ membres) | Illimité | **5 %** | Tout Pro + multi-coach (rôles), SLA 99,9 %, manager dédié, feature requests prioritaires, export complet |
| **Enterprise** | Sur devis | Réseau / prop firm | Illimité | Négociée (3–5 %) | On-premise option, SSO, audit logs, contrat + DPA |

> **Frais Stripe** en sus (1,5 % + 0,25 € en Europe) payés par le coach — standard SaaS.

**Exemple de facture coach Pro :**
- 300 membres × 39 €/mois = 11 700 € de revenus coach
- SignauxX : 149 € + 7 % × 11 700 = 149 + 819 = **968 €/mois** pour SignauxX
- Coach net (avant Stripe) : 11 700 – 968 = **10 732 €**
- **Take rate effectif : ~8,3 %** — très compétitif vs. Whop (30 % sur certains produits)

---

## 📊 Unit economics (par organisation / coach)

| Métrique | Starter | Pro | Scale | Hypothèses |
|----------|---------|-----|-------|------------|
| **ARPU (abonnement)** | 49 € | 149 € | 299 € | Hors commission |
| **Commission moyenne** | ~25 € | ~180 € | ~600 € | Basée sur membres × prix membre |
| **Revenu total / org / mois** | **~74 €** | **~329 €** | **~899 €** | Abonnement + commission |
| **Coût infra / org / mois** | ~3 € | ~6 € | ~12 € | Postgres (Neon scale), Redis, stockage S3, bandwidth — mutualisé |
| **Coût support / org / mois** | ~5 € | ~10 € | ~25 € | Temps humain amorti |
| **Marge brute / org** | **~66 € (89 %)** | **~313 € (95 %)** | **~862 € (96 %)** | SaaS = marges élevées une fois le multi-tenant amorti |
| **CAC estimé** | 80–150 € | 100–200 € | 200–400 € | Outbound + influenceurs + ads ciblées |
| **Payback CAC** | 1–2 mois | <1 mois | <1 mois | Grâce à la commission |
| **Churn mensuel cible** | 8–12 % | 4–7 % | 2–5 % | Starter plus volatil |
| **LTV (12 mois, churn 6 %)** | ~600 € | ~3 200 € | ~9 800 € | LTV = ARPU × (1/churn) — simplifié |
| **Ratio LTV/CAC** | 4–7× | 16–32× | 24–49× | >3× = sain SaaS |

> **Lecture** : le modèle est rentable dès le mois 1–2 par org en Pro/Scale. Le Starter est un **acquisition tier** — rentabilité via upsell Pro.

---

## 🆚 Comparaison Whop / Skool / SignauxX

| Critère | **Whop** | **Skool** | **SignauxX (White-Label)** |
|---------|----------|-----------|----------------------------|
| **Positionnement** | Marketplace tout-créateur | Communauté + cours | **White-label trading** |
| **Branding** | Page Whop | Page Skool | **Ton domaine, tes couleurs, ton app** |
| **Commission plateforme** | 3 % + Stripe (ou 30 % via discover) | 0 % (mais $99/mois fixe) | **Forfait 49–299 € + 5–10 %** |
| **Paiement** | Stripe via Whop | Stripe via Skool | **Stripe direct org (tu es marchand)** |
| **Signaux trading natifs** | ❌ | ❌ | ✅ (ciblage par plan, versioning, scheduling) |
| **Journal trading** | ❌ | ❌ | ✅ (Trades, sessions, streaks, réflexions) |
| **Messagerie temps réel** | Basique | Basique | ✅ (Socket.IO, réactions, signalements) |
| **Distribution push/email/WS** | Non | Non | ✅ (BullMQ + Resend + web-push) |
| **API publique** | Oui (limitée) | Non | ✅ (prévue Phase 3) |
| **Sous-domaine / domaine custom** | Non | Non | ✅ (`*.signauxx.com` + domaine custom) |
| **Marché cible** | Global, saturé | Global, saturé | **Niche trading FR/EN/AR — moins saturé** |
| **Switching cost** | Faible (page marketplace) | Faible | **Élevé (toute ta base membres migrée)** |
| **Idéal pour** | Vendre un fichier / accès Discord | Animer une communauté cours | **Monétiser une audience trading existante** |

**Phrase killer face à Whop/Skool :**

> *« Whop et Skool te louent une étagère dans leur supermarché. SignauxX te construit ta boutique — à ton nom, avec ta caisse. »*

---

## 🔄 Stratégie de monétisation — 3 leviers

1. **Abonnement plateforme (MRR de base)** : 49/149/299 € — prévisible, churn maîtrisable.
2. **Commission sur revenus membres (variable)** : 5–10 % — aligne les intérêts (on gagne quand le coach gagne), upside non plafonné.
3. **Add-ons futurs** : domaine custom (inclus Pro+), stockage supplémentaire, SMS/WhatsApp, formation onboarding, migration assistée Telegram→SignauxX (500–1 500 € one-shot).

---

*Modèle recommandé : **A White-Label** — niche, différenciant, marges >90 %, LTV/CAC >4× dès Starter, >16× en Pro. Pivots B et C en plan B/C crédibles sans pivot technique lourd.*

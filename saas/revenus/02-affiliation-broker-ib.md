# 🔗 02 — Affiliation Broker IB (Deriv)

> **Pitch :** Chaque trader inscrit via ton lien Deriv IB te reverse **30-50% du spread à vie** à chaque trade, sans rien facturer à l'utilisateur.

---

## 🎯 Pitch 1 phrase

Tu monétises l'audience existante (81 users + signaux) en touchant une rente passive sur chaque trade Deriv, cumulable avec VIP et formation.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Usage affiliation |
|--------|-----------------|-------------------|
| **BrokerVerification** | `prisma/schema.prisma` + `src/app/(admin)/verifications` | Sait qui a un compte broker vérifié (vidéo) |
| **KycDocument** | `magicBytes` + `auto-cleanup` + MinIO | Confiance → conversion IB +30% |
| **Signal + SignalAudience** | `SignalVersion`, `SignalAudience` | CTA « Trade ce signal chez Deriv » |
| **Distribution** | BullMQ + Socket.IO + Resend + Push | Push affiliationcontextuelle |
| **Admin** | 17 onglets, `SponsorClick` à créer | Tracking clics / inscriptions |
| **81 users prod** | Base existante | 15-20 déjà éligibles J1 |

> **Flag `hasDeriv`** : champ booléen sur `User` ou `BrokerVerification.status = APPROVED`. Active le suivi commission et l'affichage du CTA Deriv. Sans ce flag, pas de tracking fiable.

## 💰 Pricing & modèle Deriv IB

| Plan IB Deriv | Commission | Condition | Paiement |
|---------------|------------|-----------|----------|
| **Standard IB** | **30-35% spread** | Inscription auto | Mensuel, wire/crypto |
| **IB Pro** | **40-45%** | >25 traders actifs | Mensuel |
| **Master IB** | **jusqu'à 50%** | >100 actifs + volume | Mensuel + bonus |
| **CPA hybride** | 20% spread + 30$ CPA | Sur demande | Mix |

- Pas de plafond, commission **à vie** tant que le trader trade.
- Stack possible : Deriv (Afrique #1) + Exness + XM + Binance (10-30% fees) → 1 lien par pays.

## 📊 Exemple chiffré réaliste

### Hypothèses spread moyen

- Forex Deriv : spread 0,8-1,2 pip → commission moyenne **12$ / trader actif / mois** (Afrique) / **25-40$** (Europe, dépôt plus élevé).
- Crypto Deriv : 8-15$ / mois / actif.

### Scénario Afrique francophone

| Mois | Clics | Inscriptions (25%) | Actifs (30% inscrits) | Cumul actifs | Commission/mois |
|------|-------|--------------------|-----------------------|--------------|-----------------|
| M1 | 120 | 30 | 9 | 9 | **108$** |
| M3 | 300 | 75 | 22 | 45 | **540$** |
| M6 | 500 | 125 | 37 | 100 | **1 200$ (~1 100€)** |
| M12 | 600 | 150 | 45 | 180 | **2 160$ (~1 990€)** |

> **100 traders actifs = 1 200$ / mois (~1 100-1 350€)** en Afrique. En Europe/Dubaï (dépôt 400€ vs 80€) : **2 500-4 000€/mois** pour 100 actifs.

### Europe (panier x3)

- 100 actifs × 32€ = **3 200€/mois** passif, cumulatif.

### Effet cumulatif clé

Contrairement au MRR SaaS (churn), l'IB grossit tant que tu acquiers : **+15-20 actifs nets/mois** = +180-240€/mois récurrents ajoutés chaque mois.

## 🚀 3 étapes lancement (2-3 jours)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Activer IB** | Inscription Deriv IB (KYC 2h) + créer page `/go/deriv` (redirect UTM + tracking) + champ `hasDeriv` + CTA broker | Lien IB live | J1 |
| **2. Injecter CTA** | Ajouter bouton « Trader chez Deriv » dans `SignalCard`, onboarding, email welcome Resend, message auto après 3e signal vu | 4 points de contact | J1-J2 |
| **3. Tracker** | Table `affiliation_click` (clic, IP, userId, date) + import CSV Deriv mensuel + dashboard admin (clics → inscriptions → $) | Dashboard | J2-J3 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Dépendance Deriv (baisse taux)** | Élevé | Diversifier 2-3 brokers (Exness 30%, XM 35%) + renégocier à 50 actifs |
| **Risque régulatoire AMF/ESMA** | Élevé | Disclaimer obligatoire : « Lien affilié, trading risqué, pertes possibles » (voir `07-risques-juridiques.md`) |
| **Faible activation (clic → trader)** | Moyen | Incentive : 7j VIP offerts si inscription via lien + tuto dépôt Loom 3 min |
| **Fraude / faux traders** | Faible | Suivi via `BrokerVerification` vidéo + Deriv détecte multi-comptes |

---

*À stacker avec `12-data-analytics.md` (affiliation = 300-600€/mois passif sans code) et `13-franchise-vip.md` (chaque VIP clique Deriv).*

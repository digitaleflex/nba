# 📔 03 — SaaS Journal B2B (Prop Firms / Fintechs)

> **Pitch :** SaaS **journal trading B2B** pour prop firms, brokers et fintechs — dashboard `Trade`/`Streak`/`recharts` en marque blanche à 99/299/599€/mois par organisation.

---

## 🎯 Concept

- **Positionnement** : « Tradersync pour prop firms » — journal imposé aux traders funded, avec analytics RH + conformité.
- **Cible** : prop firms (FTMO-like), brokers, écoles trading, fintechs — B2B, panier élevé, churn <3%, contrat annuel.
- **Douleur** : prop firms perdent 70% des funded par manque discipline ; besoin outil suivi + preuve (audit) pour régulateur.
- **Solution** : extraire `Trade`/`JournalSession`/`DailyReflection`/`Streak` en SaaS B2B multi-tenant.

## 🧩 Ce que tu as déjà (modules exacts)

| Module NBA | Réutilisation B2B |
|------------|-------------------|
| `Trade` (PnL, émotion, tags) | Journal obligatoire funded |
| `JournalSession` + `DailyReflection` + `Streak` | Discipline + psycho |
| `recharts` (winrate, drawdown) | Analytics manager |
| `KycDocument` + `BrokerVerification` | Vérif trader funded |
| `AuditLog` hash-chain | Preuve pour prop firm / régulateur |
| `SubscriptionPlan` + RBAC | Licence par prop firm (100 traders) |
| Admin 17 onglets | Super-admin prop firm |
| **Gap** | Multi-tenant `orgId` + dashboard manager (2-3 sem) |

## 💰 Pricing B2B (par organisation)

| Plan | Prix/mois/org | Traders inclus | Au-delà | Cible |
|------|----------------|----------------|---------|-------|
| **Starter** | **99€** | 20 | 3€/trader | Petite prop / école |
| **Pro** | **299€** | 100 | 2€/trader | Prop moyenne |
| **Scale** | **599€** | 500 | 1€/trader | Grosse prop / broker |
| **Enterprise** | Sur devis | Illimité | | Banque |

> Tradersync Teams 29$/user → 100 users = 2 900$/mois → **toi 299€ = 10× moins cher**.

## 📊 Exemple chiffré

| Orgs | Mix | MRR | Traders totaux |
|------|-----|-----|----------------|
| 5 | 3×99 +2×299 | 895€ | 260 |
| 15 | 5×99 +7×299 +3×599 | 4 385€ | 1 500 |
| 30 | 10×99 +12×299 +8×599 | 9 370€ | 4 000 |

> **15 prop firms = 4,3k€ MRR** — 1 deal = 299€ vs 49€ B2C.

### Afrique vs Europe

- Afrique : 10 écoles trading ×99€ = **990€ MRR** (prop firms émergentes).
- Europe/Dubaï : 5 props ×599€ = **2 995€ MRR** + upsell KYC 99€ (`revenus/05-micro-saas-kyc.md`).

### LTV B2B

- Churn 3% → LTV 9 966€ pour plan 299€ (vs 540€ B2C) — **18× LTV**.

## 🚀 GTM B2B

| Canal | Action |
|-------|--------|
| LinkedIn prop firms | 10 DMs/jour à COO prop firms (FTMO, Funding Pips, + locales) |
| Salons trading | Dubaï Forex Expo, Paris Trading |
| Landing | « Réduisez 30% l'échec funded » + démo analytics |
| POC | 14j gratuit pour 1 prop (20 traders) → case study |

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Cycle vente long (B2B) | POC 14j + ROI chiffré (ex: 10% funded sauvés = 5k€/mois pour prop) |
| Intégration broker | API Deriv/Binance/MT5 déjà partielle ; 1 dev 2 sem |
| RGPD (données traders) | Anonymisation + audit hash-chain + DPA |
| Concurrence Tradersync | Prix 10× moins + francophone + audit |

## 🔄 Bundle possible

- **Journal B2B + KYC** : 299€ + 99€ = **398€/mois** par prop firm (vérif funded + suivi).
- **Journal B2B + Distribution** : push manager → trader.

---

*Le plus stable (B2B churn faible) mais GTM plus lent. Idéal en 2e revenu après white-label.*

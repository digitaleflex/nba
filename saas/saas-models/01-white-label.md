# ⭐ 01 — SaaS White-Label (RECOMMANDÉ — STAR)

> **Pitch :** Chaque coach trading obtient sa plateforme marquée à son nom en 48h (sous-domaine `coach.signauxx.com`) pour **49/149/299€/mois + 3% commission** — 80% du code est déjà prêt.

---

## 🎯 Concept

- **Positionnement** : « Shopify du coach trading » — pas un outil, une **marque**.
- **Cible** : 100+ coachs Telegram/Instagram Afrique francophone + Dubaï/FR (10-50k followers, 0 plateforme).
- **Douleur** : Telegram artisanal → pas de paiement auto, pas de journal, pas de crédibilité.
- **Solution** : clone white-label en 48h, sans coder, avec ton moteur (signaux + journal + KYC + messagerie + admin).

## 🧩 Ce que tu as déjà (80% prêt)

| Module | État | Gap SaaS |
|--------|------|----------|
| Auth, RBAC 5 rôles, `SubscriptionPlan` | ✅ Prod | Ajouter `Organization` |
| `Signal` + `SignalAudience` + versioning | ✅ Prod | Filtrer par `orgId` |
| BullMQ + Socket.IO + Push + Resend | ✅ Prod | Namespace par org |
| `Trade` + `JournalSession` + `Streak` + recharts | ✅ Prod | Isolation org |
| `KycDocument` + `BrokerVerification` | ✅ Prod | Par org |
| `Conversation`/`Message` | ✅ Prod | Par org |
| Admin 17 onglets | ✅ Prod | Super-admin + org switcher |
| **Manque** | | **Multi-tenant** : `orgId` partout + sous-domaines + isolation PG (RLS ou middleware) — **4-6 sem, 8-15k€** (doc 04/05) |

## 💰 Pricing SaaS

| Plan | Prix/mois | Membres | Commission | Features |
|------|-----------|---------|------------|----------|
| **Starter** | **49€** | 100 | 5% | Signaux + push + page marque |
| **Pro** | **149€** | 1 000 | 3% | + journal + KYC + messagerie |
| **Scale** | **299€** | Illimité | 3% → 2% à 10k MRR | + API + domaine custom + support prio |
| **Enterprise** | Sur devis | | 2% | On-premise |

> Benchmark : Whop 3-30%, Skool 99$/host, Mighty 34$ → **49€ +3% = moins cher + francophone**.

## 📊 Exemple chiffré

| Coachs | Mix | MRR abos | Commission (GMV) | **MRR total** | ARR | Valo 10× ARR |
|--------|-----|----------|------------------|---------------|-----|--------------|
| 10 | 6 Starter +3 Pro +1 Scale | 1 040€ | ~300€ (10k GMV) | **1 340€** | 16k€ | 160k€ |
| 50 | 20×49 +20×149 +10×299 | 6 950€ | 2 500€ (80k GMV) | **9 450€** | 113k€ | 1,13M€ |
| 150 | 60×49 +60×149 +30×299 | 20 850€ | 9 000€ (300k GMV) | **29 850€** | 358k€ | 3,58M€ |

> **Seuil rentabilité** : 15-20 coachs Pro → **2 500-3 500€ MRR** couvre infra (100€/mois) + 1 support.

### Afrique vs Europe

- Afrique : 50 coachs ×49€ = **2 450€ MRR** + com.
- Europe/Dubaï : 20 coachs ×149€ = **2 980€ MRR** → ticket ×3.

## 🚀 GTM (Go-To-Market)

| Canal | Action | KPI |
|-------|--------|-----|
| **Outbound LinkedIn/X** | 10 DMs/jour à coachs trading (script doc 06) | 1 call/20 DMs |
| **Telegram** | Partenariat 3 channels (affiliation 20%) | 5 trials/semaine |
| **Landing** | `signauxx.com` (framer) + démo vidéo 90s + pricing | 10% conv. |
| **Preuve** | 81 users prod + 0 CVE + 8 releases + multi-VPS | Trust |
| **Onboarding** | 48h setup (sous-domaine + Stripe Connect + import Telegram) | Activation <48h |

## ⚠️ Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Churn coach | Onboarding 48h + concierge + journal = rétention ; churn cible <5% |
| Support multi-tenant | Super-admin + doc + Loom ; 1 support /50 coachs |
| Juridique (coach arnaque) | CGU white-label : coach responsable, toi hébergeur + disclaimer doc 07 + KYC coach |
| Tech multi-tenant | Roadmap 04 (8-15k€, 4-6 sem) + audit 02 |

## 🗓️ Roadmap 4-6 semaines (résumé doc 04)

- S1 : `Organization` model + middleware `orgId` + sous-domaines.
- S2 : Isolation données (RLS / Prisma middleware) + Stripe Connect.
- S3 : Super-admin + billing + tests.
- S4 : Beta 3 coachs pilotes.

---

*Voir `02-audit-saas-readiness.md` (80% prêt), `05-architecture-cible.md` (diagram), `08-financial-model.md` (MRR).*

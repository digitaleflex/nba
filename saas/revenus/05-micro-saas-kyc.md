# 🪪 05 — Micro-SaaS KYC-as-a-Service

> **Pitch :** Vends ton module `KycDocument` (magicBytes, auto-cleanup, MinIO chiffré) en **API KYC à 49-149€/mois + 0,10€/vérif** aux fintechs africaines.

---

## 🎯 Pitch 1 phrase

Chaque fintech Wave/Djamo-like paie 1-2$/vérif à Smile Identity (levée $20M) ; toi tu proposes **0,10€/vérif** en local avec 80% du code déjà prêt.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Avance |
|--------|-----------------|--------|
| **KycDocument** | `prisma/schema.prisma` (type, status, url, magicBytes) | Prod |
| **Vérif fichier** | `src/lib/kyc/magicBytes.ts` (anti-fake JPEG/PNG) | Prod |
| **Auto-cleanup** | Job BullMQ + cron (RGPD, 30j) | Prod |
| **Stockage** | MinIO chiffré / S3 | Prod |
| **Preuve vie** | `BrokerVerification` (vidéo) | Réutilisable liveness light |
| **Audit & anti-fraude** | `AuditLog` hash-chain + device fingerprint + IP reputation | Régulateur-ready |
| **Admin** | Queue KYC (approve/reject) dans 17 onglets | Dashboard fintech |

## 💰 Pricing recommandé

| Plan | Prix/mois | Vérifs incluses | Au-delà | Cible |
|------|-----------|-----------------|---------|-------|
| **Starter** | **49€** | 200 | 0,15€ | Startup / MVP |
| **Growth** | **99€** | 500 | 0,12€ | Fintech early |
| **Scale** | **149€** | 2 000 | 0,10€ | Scale-up |
| **Enterprise** | Sur devis | 10k+ | 0,07€ | Banque / telco |

> Marché : Smile Identity 1$/vérif, Onfido 2$/vérif, Didit gratuit→premium → **toi = 5-10× moins cher en Afrique**.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone

| Client | Plan | Vérifs/mois | Revenu/mois |
|--------|------|-------------|-------------|
| Fintech A (Dakar) | Growth | 650 → 500 + 150×0,12 | **117€** |
| Fintech B (Abidjan) | Scale | 2 300 → 2 000 + 300×0,10 | **179€** |
| Microfinance C (Bamako) | Starter | 180 | **49€** |
| **Total 3 clients M3** | | | **345€/mois** |
| **10 clients M12** | Mix 99€ | | **990-1 300€/mois** |
| **50 clients (objectif)** | | | **4 950-6 500€/mois** |

> **Réaliste M6 : 3-5 fintechs → 350-600€/mois** avec 10 DMs LinkedIn/jour.

### Scénario Europe (KYC plus cher)

- 5 clients × 149€ + 1 000 vérifs × 0,10 = **1 245€/mois**
- Marge 85% (MinIO + OCR Tesseract gratuit).

### Coûts

- Extraction API : 2 sem (1 dev).
- OCR : Tesseract gratuit (70% accuracy) ou API externe 0,02€/doc → marge conservée.
- Hébergement : 20€/mois (MinIO + Redis).

## 🚀 3 étapes lancement (2-3 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Exposer API** | `POST /api/kyc/verify` (upload ID → check magicBytes → OCR → statut pending/approved/rejected) + `GET /api/kyc/status/:id` + clé API `x-api-key` | API live | S1 |
| **2. Dashboard** | Fork → `signauxx-kyc` + dashboard fintech (file d'attente, approve/reject, export audit) + landing + doc Mintlify | Repo + landing | S1-S2 |
| **3. Vendre** | Outbound LinkedIn : 10 DMs/jour à CTOs fintechs Wave/Djamo/Push/Y'assur + démo Loom + offre 100 vérifs gratuites | 3 POCs M1 | S2-S3 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Régulation (BCEAO, RGPD)** | Critique | Anonymisation + consentement opt-in CGU + auto-cleanup 30j + audit hash-chain exportable |
| **Concurrence Smile Identity ($20M)** | Élevé | Positionnement prix local + support francophone + hébergement données en Afrique (RGPD local) |
| **Faux documents sophistiqués** | Moyen | magicBytes = v1, ajouter OCR + vérif manuelle admin + partenariat API externe en Scale |
| **Responsabilité juridique** | Moyen | Tu es prestataire tech, pas certificateur ; CGU : « aide à la vérification, décision finale client » |

---

*Voir `pivots/10-kyc-fintech-afrique.md` pour le pivot complet et `saas-models/03-journal-b2b.md` pour bundling KYC+Journal.*

## 📈 KPIs & conformité

- Taux acceptance auto >80%, temps vérif <2 min, faux positifs <3%.
- RGPD : registre traitement + DPA + auto-cleanup 30j prouvé.


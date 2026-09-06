# 🏪 03 — Marketplace de Signaleurs

> **Pitch :** Transforme SignauxX en **Fiverr/Whop du signal trading** : des signaleurs tiers publient, tu prends **20% de commission** sur chaque abonnement.

---

## 🎯 Pitch 1 phrase

Tu es le Stripe Connect du trading francophone : chaque signaleur apporte ses abonnés, tu encaisses 20% sans fournir les signaux toi-même.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Rôle marketplace |
|--------|-----------------|------------------|
| **Signal + versioning** | `Signal`, `SignalVersion`, `SignalAudience` | Signaux ciblés par plan (Free/VIP/Premium) |
| **Abonnements** | `SubscriptionPlan`, `AccessRequest` | Plans par signaleur |
| **Distribution** | BullMQ + Socket.IO + Push VAPID + Resend | Notif instantanée signaux tiers |
| **Messagerie** | `Conversation`, `Message`, reactions, typing Redis | Support signaleur ↔ abonné |
| **Admin 17 onglets** | Fraud detection, IP reputation, audit hash-chain | Modération & trust |
| **KYC + BrokerVerification** | `KycDocument`, `BrokerVerification` (vidéo) | Vérif signaleurs |
| **81 users prod** | Base initiale | 5-10 premiers signaleurs potentiels |

## 💰 Pricing recommandé

| Offre | Prix | Ta commission | Revenu/signaleur |
|-------|------|---------------|------------------|
| **Abonnement suiveur** | 29-99€/mois (fixé par signaleur) | **20%** | 5,8-19,8€/abonné |
| **Listing signaleur** | 49€ one-shot | 100% | Vérif KYC + badge |
| **Boost homepage** | 50€/mois | 100% | Mise en avant 7j |
| **Frais Stripe Connect** | 1,5% + 0,25€ | Payé par signaleur | - |

> Benchmark : Whop 30%, Fiverr 20%, ComeUp 1€+20% → **20% = sweet spot**.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone (panier 39€)

| Maturité | Signaleurs | Abonnés/signaleur | GMV | Ta com 20% |
|----------|------------|-------------------|-----|------------|
| M1 | 3 | 12 | 1 404€ | **281€** |
| M3 | 10 | 30 | 11 700€ | **2 340€/mois** |
| M6 | 20 | 35 | 27 300€ | **5 460€/mois** |
| M12 | 30 | 50 | 58 500€ | **11 700€/mois** |

> **Réaliste M3-M6 : 500-2 340€/mois** avec 5-10 signaleurs (tes 81 users = vivier).

### Scénario Europe (panier 59€)

- 10 signaleurs × 30 abonnés × 59€ × 20% = **3 540€/mois**
- 20 signaleurs × 40 abonnés × 59€ × 20% = **9 440€/mois**

### Coûts

- Stripe Connect : 0€ fixe, 1,5% par payout.
- Modération : 5h/semaine à 10 signaleurs (1 admin mi-temps à 300€/mois en Afrique).

## 🚀 3 étapes lancement (3-4 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Modèle & page** | Ajouter `role = SIGNAL_PROVIDER` à `User` + page `/marketplace` + fiche signaleur (bio, winrate, historique, badge KYC) | Marketplace MVP | S1 |
| **2. Paiement** | MVP manuel (tu factures, reverses par Mobile Money/virement) → puis Stripe Connect Express (1-2 sem) | Flux € | S2-S3 |
| **3. Trust & launch** | Système rating (réutiliser `Message reactions`) + signalement + `AuditLog` + onboarding 5 signaleurs pilotes (tes meilleurs users) | 5 signaleurs live | S3-S4 |

> **MVP 3 jours** : sans Stripe Connect, tu gères les payouts manuellement (Notion + virement) pour valider.

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Qualité / arnaques** | Critique | KYC obligatoire + période essai 7j + remboursement + disclaimer doc 07 + dashboard winrate vérifiable (`Trade` lié) |
| **Support multi-signaleurs** | Élevé | Super-admin + charte + FAQ + modérateur 5h/sem, SLA 24h |
| **Fuite signaleurs (off-platform)** | Moyen | Valeur rétention : distribution + push + paiement auto + audience → 20% justifié ; clause non-contournement CGU |
| **Charge juridique** | Moyen | Tu es hébergeur, pas conseiller ; CGU marketplace + disclaimer « signaux informatifs » (doc 07) |

---

*Stacke avec `02-affiliation-broker-ib.md` (chaque signaleur pousse Deriv) et `06-micro-saas-distribution.md` (moteur distribué).*


## 🔄 Variantes & évolution

- **Marketplace inversé** : acheteurs postent demande, signaleurs répondent (type Malt).
- **Copy auto** : bouton « Copier ce signaleur » → branche `11-copy-trading.md`.

## ✅ Check-list modération

- [ ] Charte signaleur (winrate honnête, pas de martingale promesse)
- [ ] Bot détection fraude (IP reputation + device fingerprint)
- [ ] Process litige : remboursement 7j + audit log

## 📈 KPIs à suivre

- GMV, take rate 20%, churn signaleurs, NPS abonnés, litiges/mois (<2%).

---

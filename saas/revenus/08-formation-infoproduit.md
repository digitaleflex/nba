# 🎓 08 — Formation / Infoproduit

> **Pitch :** Monétise ton module `Formation` existant en **formation vidéo 97-497€** avec funnel email Resend et upsell VIP/affiliation.

---

## 🎯 Pitch 1 phrase

Tu vends « De 0 à Signaux Rentables » ou « Clone SignauxX en 7 jours » à 97-497€ en utilisant ton infrastructure déjà en prod (MinIO + RBAC).

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier / Model | Rôle formation |
|--------|-----------------|----------------|
| **Formation** | `Formation` / `Course` (Prisma) | Contenu + chapitres |
| **Abonnements** | `SubscriptionPlan` + `AccessRequest` | Accès par plan (Basic/Pro/VIP) |
| **Stockage** | MinIO / S3 | Hébergement vidéos |
| **Email** | Resend (drip J0/J2/J5/J7) | Funnel |
| **Auth RBAC** | Better Auth, 5 rôles | Accès restreint |
| **Paiement** | Stripe | Checkout |
| **Messagerie** | `Conversation` | Q&A élèves |
| **81 users prod** | Base | Témoignages + beta testeurs |

## 💰 Pricing recommandé

| Produit | Prix | Contenu | Upsell |
|---------|------|---------|--------|
| **Initiation** | **97€** | 5 vidéos (2h) + PDF + 7j VIP offerts | → VIP 19€/mois |
| **Stratégie Deriv** | **197€** | 8 vidéos (4h) + journal template + live mensuel | → VIP 39€ |
| **Mentoring 1to1** | **497€** | Formation + 3 sessions 1to1 + accès lifetime | → Agence 5k€ |
| **Tech « Clone SignauxX »** | **149-297€** | Stack Next.js 16 + Prisma + BullMQ | → Licence 990€ |
| **Bundle** | **197€** (valeur 314€) | Formation 97€ + 3 mois VIP (117€) + affiliation Deriv | LTV 400€+ |

> Panier moyen francophone trading : 97€ (TikTok) à 497€ (Dubaï/France).

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone (2k followers TikTok/X + 500 Telegram)

| Canal | Vues | Conversion 2% | Prix | CA |
|-------|------|---------------|------|----|
| Lancement J1-J7 | 1 000 | 20 | 97€ | **1 940€** |
| Evergreen (organique) | 500/mois | 10 | 197€ | **1 970€/mois** |
| Avec pub Meta 10€/j (300€/mois) | 1 500 | 30 | 97€ | 2 910 -300 = **2 610€ net/mois** |
| Bundle 197€ (20% des acheteurs) | 4/mois | | +100€ LTV affiliation | **+400€** |

> **Réaliste M1 : 1 900€ lancement + M2-M3 : 1 000-2 000€/mois** sans pub, **2 500€ net** avec 10€/j.

### Scénario Europe

- 15 ventes/mois × 197€ = **2 955€/mois**
- + 5 mentorings 497€ = **2 485€**
- **Total : 5 440€/mois** (top formateurs FR font 10-30k€/mois, tu es à 15-20%).

### Coûts

- Production : 1 jour Loom (0€) + MinIO existant.
- Pub : 0-300€/mois optionnel.
- Remboursements 5-8% (14j) → prévoir -8% CA.

## 🚀 3 étapes lancement (1-2 semaines)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Enregistrer** | 5-8 vidéos Loom (2-4h total) + PDF + uploader MinIO + lier à `Formation` + page `/formation/[slug]` | Formation live | J1-J4 |
| **2. Payer** | 3 plans dans `SubscriptionPlan` + checkout Stripe + page pricing + témoignages 81 users | Tunnel paiement | J4-J6 |
| **3. Funnel** | Séquence Resend J0 (bienvenue) / J2 (cas client) / J5 (FOMO) / J7 (remise 20% 24h) + 3 posts TikTok/X + email 81 users | Funnel actif | J7-J10 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Promesse gains (AMF)** | Critique | Disclaimer + focus « méthode, pas rendement garanti » (doc 07) + CGU |
| **Remboursements 14j** | Moyen | Taux 5-8% normal ; vidéo 1 = valeur immédiate → baisse à 3-4% |
| **Piratage vidéos** | Moyen | MinIO URL signée 1h + watermark email + pas de download direct |
| **Concurrence formations trading** | Élevé | Différenciation : tu as la plateforme (81 users) → preuve, pas juste théorie |

---

*À stacker avec `13-franchise-vip.md` (VIP = upsell formation) et `02-affiliation-broker-ib.md` (formation pousse Deriv).*

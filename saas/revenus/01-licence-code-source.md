# 💿 01 — Licence / Vente Code Source

> **Pitch :** Vends la codebase NeverBrokeAgain (157k LOC, 29 models Prisma, 17 onglets admin) en licence privée à 590/990/1990€ sur Gumroad, Codester et Lemon Squeezy.

---

## 🎯 Pitch 1 phrase

Un formateur ou une agence achète ton code prêt-à-déployer et lance sa plateforme signaux en 1h au lieu de payer 15k€ d'agence.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichiers / Models | Valeur revente |
|--------|-------------------|----------------|
| **Coeur complet** | `src/` 565 fichiers, 157k LOC | Base 18,5M FCFA prouvée |
| **Prisma** | 29 models métier (User, Signal, Trade, KycDocument, SubscriptionPlan...) | Schéma prod |
| **Admin 17 onglets** | `src/app/(admin)/*`, AuditLog hash-chain, device fingerprint | 22 j-h seuls |
| **Infra** | `docker-compose.yml`, `Dockerfile`, GHCR, multi-VPS Tailscale | Déploiement 1-click |
| **Auth & RBAC** | Better Auth, 5 rôles, 11 permissions | Sécurité prod |
| **Temps réel** | BullMQ, Socket.IO, Push VAPID, Resend | Distribution premium |
| **Preuve valeur** | `estimation-valeur.md` (89 j-h), 0 vulnérabilité, 8 releases | Argument prix |

## 💰 Pricing recommandé

| Licence | Prix | Droits | Canal | Commission plateforme |
|---------|------|--------|-------|----------------------|
| **Starter** | **590 €** | 1 domaine, usage solo | Codester Regular | 30% → 413€ net |
| **Pro** | **990 €** | 1 domaine + support 3 mois + maj 1 an | Gumroad direct | 10% → 891€ net |
| **Agence** | **1 990 €** | Domaines illimités, revente autorisée | Lemon Squeezy / direct | 5-9% → ~1830€ net |
| **Upsell** | +300€ install / +500€ support 3 mois | Service | Stripe direct | 100% |

> Positionnement : 30% moins cher qu'une agence Afrique (5-8k€) et 10× moins qu'Europe (15-25k€).

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone (Bénin, Sénégal, CIV, Cameroun)

- Trafic Codester organique : 400 vues/mois × 1,2% conversion = **5 ventes Starter/mois**
- 5 × 413€ net = **2 065€/mois**
- + 1 vente Pro directe via X/TikTok (2 posts/semaine) = **891€**
- **Total M2-M3 : 2 956€/mois** sans pub payante.

### Scénario Europe / Dubaï

- 2 ventes Agence/mois à 1 990€ via outbound LinkedIn (10 DMs/jour) = **3 660€ net**
- + 2 Starter Codester = **826€**
- **Total : ~4 486€/mois**
- Pic lancement (Product Hunt + Reddit r/forex) : **6 000-8 000€** le mois 1.

### Coûts

- Temps SAV : 2-3h/semaine (FAQ + vidéo Loom).
- Frais plateformes : inclus ci-dessus. Hébergement démo : 12€/mois (VPS existant).

## 🚀 3 étapes lancement (5-7 jours)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Packager** | Nettoyer `.env.example` + `README_INSTALL.md` + script `setup.sh` one-click + vidéo démo 2 min (17 onglets) | Zip + repo privé | J1-J2 |
| **2. Publier** | Fiche Codester (screenshots + features + stack) + fiches Gumroad/Lemon Squeezy + prix 590/990/1990€ | 3 listings live | J3-J4 |
| **3. Distribuer** | Posts X/Reddit r/forex + Telegram trading + 10 DMs LinkedIn/jour à coachs + Product Hunt | 1 000 vues S1 | J5-J7 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Piratage / revente illégale** | Élevé | Licence privée (pas MIT), watermark footer, code non obfusqué mais contrat + DMCA, version marketplace légèrement allégée |
| **SAV chronophage** | Moyen | Support limité 3 mois, FAQ vidéo + Notion, upsell 500€ au-delà, Discord privé |
| **Cannibalise futur SaaS** | Faible | Licence = single-tenant only ; SaaS = multi-tenant + sous-domaines → 2 produits distincts, prix SaaS 49-299€/mois vs licence one-shot |
| **Concurrence boilerplates** | Moyen | Différenciation : KYC + audit hash-chain + 17 onglets + 0 CVE → aucun boilerplate FR n'a ça |

---


## 🔄 Variantes & upsells

- **Version light 290€** : sans KYC ni workers (pour petits coachs) → volume.
- **Pack agence 2 490€** : licence + install + 1 mois support prioritaire.
- **Abonnement maj 19€/mois** : updates + CVE patches → MRR passif.

## ✅ Check-list validation

- [ ] `.env.example` complet + `setup.sh` testé sur VPS vierge
- [ ] Vidéo démo 2 min (loom) + 5 screenshots admin
- [ ] Licence PDF + contrat signé numériquement
- [ ] 3 listings publiés + 1 post X + 1 post Reddit

## 🔗 Stack & dépendances

- Next.js 16, Prisma 7, Neon PG, Better Auth, BullMQ, Socket.IO, Tailwind 4, Sentry.
- Aucune dépendance exotique → install <15 min.

---
*Source : `01-valeur-projet.md` (89 j-h, 157k LOC), `estimation-valeur.md`. À croiser avec `04-micro-saas-kyc.md` et `07-micro-saas-admin.md` pour spin-offs.*

# 🔌 09 — API-as-a-Product (RapidAPI)

> **Pitch :** Expose `GET /api/v1/signals` en **API facturée à l'appel** sur RapidAPI (19-99$/mois) pour bots Telegram, apps et traders algo.

---

## 🎯 Pitch 1 phrase

Des devs paient pour consommer tes signaux en JSON au lieu de scraper Telegram — tu factures chaque appel, 80% de marge.

## 🧩 Ce que tu as déjà (modules / fichiers)

| Module | Fichier | Rôle API |
|--------|---------|----------|
| **Signal** | `Signal`, `SignalVersion`, `SignalAudience` | Donnée exposée |
| **API routes** | `src/app/api/*` (Next.js) | Base |
| **Auth** | Better Auth + `ApiKey` (à créer, 1j) | Clé `x-api-key` |
| **Rate-limit** | Redis/Valkey | Quota |
| **AuditLog** | `AuditLog` | Log appels facturables |
| **Workers** | BullMQ (webhooks) | Push webhook |
| **81 users** | Base | Premiers consommateurs |

## 💰 Pricing recommandé

| Plan RapidAPI | Prix/mois | Requêtes/mois | Webhook | Marge (après 20% RapidAPI) |
|---------------|-----------|---------------|---------|-----------------------------|
| **Free** | 0$ | 100 | Non | Acquisition |
| **Basic** | **19$** | 1 000 | Non | 15,2$ net |
| **Pro** | **49$** | 10 000 | Oui | 39,2$ net |
| **Ultra** | **99$** | 50 000 | Oui + support | 79,2$ net |
| **Enterprise** | Sur devis | Illimité | SLA | 80% |

> Alternative Stripe metered : 0,02€/appel au-delà du forfait.

## 📊 Exemple chiffré réaliste

### Scénario Afrique francophone (bots Telegram, apps locales)

| Mois | Free | Basic 19$ | Pro 49$ | Ultra 99$ | Brut | Net (80%) |
|------|------|-----------|---------|-----------|------|-----------|
| M1 | 20 | 5 | 2 | 0 | 193$ | **154$ (~142€)** |
| M3 | 60 | 15 | 8 | 2 | 875$ | **700$ (~645€)** |
| M6 | 100 | 30 | 15 | 5 | 1 800$ | **1 440$ (~1 327€)** |
| M12 | 200 | 50 | 25 | 10 | 3 165$ | **2 532$ (~2 334€)** |

> **Réaliste M3 sans effort : 100-400€/mois ; M12 avec doc propre : 800-1 440€/mois** quasi passif.

### Scénario Europe (traders algo)

- 30 Pro 49$ + 10 Ultra 99$ = 2 460$ brut → **1 968$ net (~1 814€)**
- 1 Enterprise 299$ → +239€ net.

### Coûts

- Dev API wrapper : 1 semaine (1 dev).
- RapidAPI fees 20%, hébergement inclus (VPS existant).
- Doc Mintlify gratuite.

## 🚀 3 étapes lancement (1 semaine)

| Étape | Action | Livrable | Délai |
|-------|--------|----------|-------|
| **1. Wrapper API** | `src/app/api/v1/signals/route.ts` (GET ?plan=vip&limit=20) + `POST /api/v1/webhooks` + auth `x-api-key` + table `ApiKey` | API live | J1-J3 |
| **2. Publier** | Spec OpenAPI + fiche RapidAPI (30 min) + doc `api.signauxx.com` (Mintlify) + rate-limit Redis | Listing RapidAPI | J4-J5 |
| **3. Distribuer** | Product Hunt + RapidAPI search + 10 DMs/jour devs bots Telegram + exemple bot Python/Node | 20 signups S1 | J5-J7 |

## ⚠️ Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Abus / scraping** | Moyen | Rate-limit Redis + rotation clé + quota + `AuditLog` |
| **Données sensibles exposées** | Critique | Exposer seulement `Signal` public, jamais `User`/`KycDocument`/`Trade` ; auth obligatoire |
| **Dépendance RapidAPI** | Moyen | Double canal : RapidAPI + Stripe metered direct (`api.signauxx.com`) |
| **Faible traction dev** | Moyen | Free tier 100 req + exemple bot prêt-à-copier + doc interactive |

---

*Complémentaire à `06-micro-saas-distribution.md` (moteur = infra API) et `03-marketplace-signaleurs.md` (signaleurs exposent via API).*


## 🔄 Extensions possibles

- **Webhook trading** : `POST /api/v1/webhooks` → exécute chez broker (upsell).
- **GraphQL** : alternative pour apps mobiles (1 endpoint).

## ✅ Check-list lancement

- [ ] OpenAPI 3.1 validé + exemple Postman
- [ ] Rate-limit 100/mn Free, 1000/mn Pro testé
- [ ] Page status + uptime 99,9%

## 📈 KPIs

- MAU API, conversion Free→Payant 12%, p95 latency <150ms, erreurs 4xx <2%.

---

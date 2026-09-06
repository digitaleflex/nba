# ✅ 09 — Checklist Lancement — Semaine par Semaine

> **Objectif : de 0 à 5 orgs pilotes en 6 semaines, puis 15–20 orgs à 12 semaines.**
> Chaque semaine a un livrable, un critère de succès et un owner. Coche et ship.

---

## 📋 Vue d'ensemble — 12 semaines

| Semaine | Thème | Livrable | Critère succès |
|:-------:|-------|----------|----------------|
| **S1** | Préparation & cadrage | Repo prêt, specs figées, 100 coachs listés | 100 coachs dans sheet + specs validées |
| **S2–S3** | Phase 1 — Multi-tenant DB | Migration Prisma + middleware org + tests isolation | 2 orgs isolées en local + tests verts |
| **S4** | Phase 1 — Sous-domaines & theming | Wildcard staging + theming de base | `alpha.staging.signauxx.com` live |
| **S5** | Phase 2 — Stripe billing | Checkout + webhooks + portal | Paiement test E2E OK |
| **S6** | Onboarding & pilotes | Flow création org + 5 pilotes onboardés | 5 orgs pilotes avec membres |
| **S7** | Durcissement & juridique | CGU, disclaimers, DPA, QA | Docs juridiques publiés |
| **S8** | Phase 3 — API + i18n | API v1 + OpenAPI + FR/EN | `curl /api/v1/signals` OK |
| **S9** | Landing & content | Landing + 3 articles + vidéo démo | Landing en ligne, 500 visites |
| **S10** | Acquisition — influenceurs | 1 partenariat + programme affilié | 1 post, 10 leads |
| **S11** | Acquisition — ads & referral | Ads 300€ + parrainage | CPL <15€, 2 referrals |
| **S12** | Bilan & scale | Rétro, pricing ajusté, roadmap 6 mois | MRR, churn, NPS mesurés |

---

## 🔨 S1 — Préparation (J1–J7)

### Tech

- [ ] Créer branche `feat/saas-multi-tenant` depuis `main`
- [ ] Figer spec `Organization` + `OrganizationMember` + `OrganizationSubscription` (doc 04 §1.1, §2.2)
- [ ] Lister tous les `where` à scoper (`grep -r "prisma\.\w\+\.find" src/`)
- [ ] Créer Neon branch `saas-staging` pour tester migrations sans toucher la prod
- [ ] Ajouter `stripe` + `next-intl` à `package.json` (pas encore utilisé, juste installé)
- [ ] Configurer DNS wildcard `*.staging.signauxx.com` → VPS staging + cert staging

### Business

- [ ] Lister 100 coachs cibles (sheet : nom, canal, abonnés, contact, statut DM) — sources : Telegram search "signaux trading", Instagram #tradingfr, TikTok
- [ ] Rédiger script DM (doc 06) + 2 variantes
- [ ] Créer adresse `hello@signauxx.com` + `support@` (Resend déjà configuré)
- [ ] Définir pricing final (valider 49/149/299 + commissions — doc 03)

### Juridique

- [ ] Brief avocat (droit financier + RGPD) — envoyer docs 07 + schema Prisma
- [ ] Commander RC pro / cyber — devis

**✅ Succès S1 :** 100 coachs listés, specs Prisma validées, Neon branch prête, script DM prêt.

---

## 🔨 S2–S3 — Phase 1 : Multi-tenant DB (J8–J21)

### S2 — Schema & migration

- [ ] Ajouter `Organization` + `OrganizationMember` + enums dans `prisma/schema.prisma`
- [ ] Ajouter `organizationId` (nullable) à : `Signal`, `SubscriptionPlan`, `Conversation`, `Notification`, `Trade`, `JournalSession`, `DailyReflection`, `Streak`, `AuditLog`, `SecurityEvent`
- [ ] Générer migration : `pnpm prisma migrate dev --name add-organizations`
- [ ] Créer org par défaut (`slug: "nba"`, owner = admin seed) + backfill tous les rows existants
- [ ] Passer `organizationId` en NOT NULL sur les tables obligatoires (2e migration)
- [ ] `pnpm prisma generate` + `pnpm typecheck` verts

### S3 — Middleware & isolation

- [ ] Créer `src/lib/organization.ts` : `resolveOrganization(host)`, `requireOrganization()`, `getOrgContext()`
- [ ] Modifier `src/middleware.ts` : résolution org depuis `host`, injection `x-organization-id`
- [ ] Scoper toutes les routes API : `src/app/api/signals/*`, `messages/*`, `notifications/*`, `modules/signals/*`
- [ ] Namespacer Redis (`org:{id}:`), BullMQ (`org:{id}:signals:dispatch`), Socket.IO rooms (`org:{id}`)
- [ ] Écrire `src/test/organization-isolation.test.ts` : 2 orgs, assert 0 fuite cross-org
- [ ] Revue code : `grep -r "prisma\." src/ | grep -v "organizationId"` → doit être vide sur tables scopées

**✅ Succès S2–S3 :** `pnpm test` verts dont tests isolation, 2 orgs `alpha`/`beta` en local avec données étanches, 0 `where` sans `organizationId`.

---

## 🔨 S4 — Sous-domaines & Theming (J22–J28)

- [ ] Traefik : `HostRegexp({org}.signauxx.com)` + fallback `signauxx.com` (doc 05)
- [ ] DNS wildcard `*.signauxx.com` → VPS prod (A record) + cert wildcard DNS-01 (Cloudflare)
- [ ] Garder `access.signauxx.com` en alias pendant transition
- [ ] Theming : `src/lib/theme.ts` + `OrgTheme` (logo, `primaryColor` → CSS variables)
- [ ] Admin : séparer super-admin plateforme (voit toutes les orgs) vs admin org (voit son org)
- [ ] Tester en staging : `alpha.staging.signauxx.com` et `beta.staging.signauxx.com` avec couleurs différentes
- [ ] Env démo : créer 2 orgs de démo avec fausses données pour le pitch

**✅ Succès S4 :** wildcard live en staging, theming visible (2 orgs = 2 couleurs/logos), super-admin OK.

---

## 🔨 S5 — Phase 2 : Stripe Billing (J29–J35)

- [ ] Créer compte Stripe (si pas existant) + 3 prix : Starter 49€, Pro 149€, Scale 299€ (mode test)
- [ ] Schema `OrganizationSubscription` (doc 04 §2.2) + migration
- [ ] `src/lib/stripe.ts` : client + helpers
- [ ] Routes : `POST /api/orgs`, `POST /api/orgs/[orgId]/checkout`, `POST /api/orgs/[orgId]/portal`, `POST /api/webhooks/stripe`
- [ ] Gérer events : `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid/failed`
- [ ] Réutiliser `WebhookDlq` pour retries Stripe
- [ ] Gating : middleware redirige vers `/billing` si subscription non ACTIVE
- [ ] Tester E2E en mode test : création org → checkout → webhook → org ACTIVE → accès dashboard

**✅ Succès S5 :** paiement test de bout en bout OK, Customer Portal OK, gating OK.

---

## 🔨 S6 — Onboarding & 5 Pilotes (J36–J42) ⭐ SEMAINE CLÉ

- [ ] Page `src/app/(onboarding)/create-org/page.tsx` : nom + slug + choix tier → Stripe Checkout → provisioning → redirect `{slug}.signauxx.com`
- [ ] Valider slug (regex `^[a-z0-9-]{3,30}$`, unique, pas de mot réservé : `www`, `api`, `admin`, `app`)
- [ ] Envoyer DMs aux 20 premiers coachs de la sheet (script doc 06) — **20 DMs/jour**
- [ ] Caler 5 calls (15 min) — objectif : 2–3 pilotes signés
- [ ] Onboarding pilotes : créer org + importer membres (CSV ou manuel) + configurer 1er signal ensemble
- [ ] Canal support pilotes : groupe Telegram/WhatsApp dédié + doc onboarding 1 page
- [ ] Collecter feedback quotidien (sheet : bug, feature request, NPS)

**✅ Succès S6 :** 5 orgs pilotes créées, 50–200 membres pilotes importés, 1er signal publié par chaque pilote, 0 bug bloquant.

---

## 🔨 S7 — Durcissement & Juridique (J43–J49)

- [ ] Intégrer disclaimers (doc 07) : sous chaque signal, pied de page, onboarding (case à cocher bloquante)
- [ ] Publier CGU / CGV / privacy / mentions légales (version avocat) + route `/cgu`, `/privacy`
- [ ] Contrat white-label + DPA : faire signer les 5 pilotes (PDF ou HelloSign)
- [ ] QA complète : tests E2E manuels (création org → signaux → messagerie → journal → billing)
- [ ] Audit sécurité : rejouer `pnpm audit`, vérifier rate limiting par org, tester fuite inter-tenant en staging
- [ ] Backup & rollback : tester `prisma migrate` + restore B2 sur Neon branch
- [ ] Fix bugs pilotes (priorité P0/P1)

**✅ Succès S7 :** CGU publiées, 5 contrats signés, QA verte, disclaimers visibles partout.

---

## 🔨 S8 — Phase 3 : API + i18n (J50–J56)

- [ ] `prisma/schema.prisma` : `model ApiKey` + migration
- [ ] `src/lib/api-keys.ts` : génération `sk_live_*`, hash, middleware `Authorization: Bearer`
- [ ] Routes `src/app/api/v1/*` : `signals`, `members`, `trades`, `webhooks` (doc 04 §3.1)
- [ ] Rate limiting par org + par clé (100 req/min/org)
- [ ] OpenAPI `docs/04-api/openapi.yaml` + Swagger UI sur `/docs`
- [ ] i18n : `next-intl`, `messages/fr.json` + `en.json`, middleware locale, switch FR/EN
- [ ] Tester : `curl -H "Authorization: Bearer sk_live_..." https://alpha.staging.signauxx.com/api/v1/signals`

**✅ Succès S8 :** API v1 live avec clé org-scoped, OpenAPI sur `/docs`, FR/EN switch OK.

---

## 🔨 S9 — Landing & Content (J57–J63)

- [ ] Ship landing `signauxx.com` (structure doc 06 § landing) — hero, douleur, solution, pricing, comparatif, FAQ
- [ ] Vidéo démo 2 min (Loom) : création org → 1er signal → membre reçoit push
- [ ] 3 articles SEO : "Comment créer sa plateforme de signaux", "Whop vs white-label", "Pourquoi Telegram tue ta rétention"
- [ ] SEO de base : meta, OG, sitemap, `robots.txt`
- [ ] Analytics : Plausible ou PostHog (RGPD-friendly) + events `cta_click`, `checkout_start`
- [ ] Continuer outbound : 20 DMs/jour → viser 10 orgs totales

**✅ Succès S9 :** landing en ligne, 500 visites, 20 leads inbound, 10 orgs totales.

---

## 🔨 S10 — Acquisition : Influenceurs (J64–J70)

- [ ] Identifier 10 influenceurs trading FR (5k–50k followers) — sheet : nom, audience, taux engagement, contact
- [ ] Pitch partenariat : 1 mois Pro offert + 20 % lifetime commission affilié (via code `COACH20`)
- [ ] Signer 1 partenariat minimum — 1 post + 1 story + 1 live/AMA
- [ ] Créer page affilié : `signauxx.com/affiliation` + tracking code
- [ ] Activer programme parrainage coachs : 1 mois offert par filleul (code parrain dans dashboard org)
- [ ] Suivre : leads affilié, conversion, CPL

**✅ Succès S10 :** 1 post influenceur live, 10–30 leads affilié, 2–5 orgs via ce canal.

---

## 🔨 S11 — Acquisition : Ads & Referral (J71–J77)

- [ ] Lancer Meta Ads (300€) : 2 créas (mockup app vs. témoignage pilote), ciblage trading + Afrique francophone 20–40 ans
- [ ] A/B test 7 jours, couper la moins bonne, scaler la gagnante
- [ ] Activer referral in-app : bannière "Parraine un coach → 1 mois offert"
- [ ] Relancer les 80 coachs non contactés de la sheet S1 (2e vague DM)
- [ ] Collecter 3 témoignages vidéo pilotes (30 sec, téléphone, sous-titré)
- [ ] Publier témoignages sur landing + réseaux

**✅ Succès S11 :** CPL <15€, 20 leads ads, 2 referrals, 3 témoignages en ligne.

---

## 🔨 S12 — Bilan & Scale (J78–J84)

- [ ] Mesurer : MRR, ARR, orgs actives, membres totaux, churn, NPS, CPL, LTV/CAC
- [ ] Rétro pilotes : call 30 min avec chaque pilote — qu'est-ce qui garde / qu'est-ce qui manque ?
- [ ] Ajuster pricing si besoin (ex: Starter 39€ si friction, ou Scale 349€ si valeur perçue haute)
- [ ] Prioriser roadmap 6 mois : features top demandées (ex: domaine custom auto, analytics avancés, app mobile)
- [ ] Préparer pitch deck avec chiffres réels M1–M3 pour lever / recruter
- [ ] Célébrer 🎉 — 15–20 orgs = 2k–5k€ MRR = seuil rentabilité franchi

**✅ Succès S12 :** MRR mesuré, churn <7 %, NPS >40, roadmap 6 mois priorisée, deck à jour.

---

## 🚨 Rituels hebdo (toute la durée)

| Rituel | Quand | Durée | Participants |
|--------|-------|-------|--------------|
| **Stand-up** | Lundi 9h | 15 min | Fondateur + dev |
| **Revue pilotes** | Vendredi 16h | 30 min | Fondateur + pilotes (async si besoin) |
| **Chiffres** | Vendredi 17h | 15 min | MRR, orgs, leads, bugs — 1 slide |
| **DM outbound** | Quotidien | 30 min | Fondateur — 20 DMs/jour non négociable |

---

## 🆘 Si ça dérape

| Problème | Plan B |
|----------|--------|
| Migration Prisma casse la prod | Rollback via Neon branch + `prisma migrate resolve --rolled-back` |
| Churn pilotes >20 % | Call immédiat + offre 1 mois offert + fix feature #1 demandée |
| 0 leads après S9 | Doubler outbound (40 DMs/jour) + baisser Starter à 29€ test 2 semaines |
| Stripe non dispo dans un pays cible | Activer Mobile Money (Wave, Orange Money) via CinetPay/PayDunya en parallèle |
| Avocat bloque sur AMF | Lancer en Afrique francophone uniquement (hors UE) + disclaimers renforcés, puis UE en V2 |

---

*Checklist du 6 septembre 2026 — 12 semaines, 5 orgs pilotes en S6, 15–20 orgs en S12, MRR 2k–5k€. Chaque case cochée = 1 pas vers 1,57M€ de valo (scénario base).*

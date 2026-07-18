# Authentification — User Stories & System Stories

> Module: Système d'authentification (Auth)
> Version: 1.1
> Status: Approved
> Last Updated: July 2026
> Complète `docs/01-product/USER_STORIES.md` (Epic 1 — Authentication)

Ce document décrit le comportement **réel** du système d'authentification de
NeverBrokeAgain, tel qu'implémenté (login, inscription, reset password, états
de compte, dashboard, admin). Il sépare :

- **User Stories** : ce que l'utilisateur veut faire et la valeur attendue.
- **System Stories** : ce que le système doit garantir techniquement
  (sécurité, intégrité, non-régression, zéro-downtime).

---

# Epic AUTH — Parcours Visiteur → Membre

---

## US-AUTH-001 — Créer un compte avec plan obligatoire

**As a** Visitor
**I want to** m'inscrire en choisissant un plan puis renseigner mon identité,
mon contact et ma sécurité
**So that** je devienne membre et accède aux signaux.

### Acceptance Criteria

- L'inscription se fait en 5 étapes : Service (plan), Identité, Contact,
  Sécurité, Confirmation.
- **Un plan est obligatoire** (anti-triche) : impossible de valider l'inscription
  sans `selectedPlan`.
- Le prénom, nom, email, WhatsApp et mot de passe sont validés côté client.
- L'email et le WhatsApp doivent être uniques.
- La politique de mot de passe est appliquée.
- Le compte est créé via Better Auth (`authClient.signUp.email`).
- **Auto-approbation** : un `accessRequest` de statut `APPROVED` est créé
  automatiquement à l'inscription (pas de validation manuelle).
- Un email de vérification est envoyé.
- En cas de succès : redirection vers les signaux (`/dashboard/signals`).
- En cas d'échec : toast d'erreur explicite, pas de redirection.

### Fichiers concernés

- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/register/components/*` (step-service, step-identity,
  step-contact, step-security, step-confirmation)
- `src/app/api/public/plans` (liste des plans)
- Logique `accessRequest` APPROVED à l'inscription.

---

## US-AUTH-002 — Se connecter

**As a** Member
**I want to** me connecter avec email + mot de passe
**So that** j'accède à mon tableau de bord.

### Acceptance Criteria

- Email et mot de passe requis et validés.
- **Avant** l'envoi des identifiants, le statut du compte est vérifié via
  `GET /api/auth/check-login?email=...`.
- Si le compte est `banned` / `inactive` / `deleted` → redirection vers
  `/blocked` avec `status`, `reason` et `at` (horodatage ISO).
- Si le compte est OK → `POST /api/auth/sign-in` (Better Auth), cookie de
  session posé par le serveur.
- Redirection vers `/dashboard` (qui redirige lui-même vers
  `/dashboard/signals`) via full reload pour forcer la lecture du cookie par
  le middleware.
- En cas d'identifiants invalides : message d'erreur + toast.
- Bouton "afficher/masquer le mot de passe".
- Tooltip d'aide sur le champ mot de passe.

### Fichiers concernés

- `src/app/(auth)/login/page.tsx`
- `src/app/api/auth/check-login/route.ts`
- `src/app/api/auth/sign-in/route.ts`

---

## US-AUTH-003 — Récupérer un mot de passe oublié

**As a** Member
**I want to** demander une réinitialisation de mot de passe
**So that** je puisse me reconnecter si je l'ai oublié.

### Acceptance Criteria

- L'écran `/forgot-password` valide l'email.
- Un email de reset est envoyé (si le compte existe).
- L'écran `/reset-password` valide le nouveau mot de passe (politique appliquée).
- Si le token est invalide / expiré : message clair indiquant le problème
  (pas de page vide).
- En cas de succès : toast + redirection vers `/login`.

### Fichiers concernés

- `src/app/(auth)/forgot-password/`
- `src/app/(auth)/reset-password/`

---

## US-AUTH-004 — Consulter l'état de mon compte bloqué

**As a** Member (banni / désactivé / supprimé)
**I want to** voir pourquoi je ne peux pas me connecter, avec la date
d'intervention
**So that** je comprenne la situation et puisse contacter le support.

### Acceptance Criteria

- La page `/blocked` affiche un titre + message selon le `status`
  (`banned` / `inactive` / `deleted`).
- Elle affiche l'horodatage de l'intervention (**à la seconde près**, format
  fr-FR long) : "Intervention effectuée le <date heure>".
- Elle affiche le `reason` si fourni.
- Deux CTA : "Contacter le support" (`/support`) et "Retour à la connexion"
  (`/login`).
- La suppression de compte côté profil redirige vers `/blocked?status=deleted`.

### Fichiers concernés

- `src/app/blocked/page.tsx`
- `src/app/api/auth/check-login/route.ts` (renvoie `at` ISO pour les états
  deleted/inactive/banned)

---

## US-AUTH-005 — Accéder à mon espace membre

**As a** Member connecté
**I want to** arriver directement sur mes signaux
**So that** je voie la valeur produit immédiatement.

### Acceptance Criteria

- `/` redirige vers `/login` (si non authentifié).
- `/dashboard` redirige vers `/dashboard/signals`.
- La sidebar utilisateur est simplifiée : "Mes Signaux" en tête, sans
  "Tableau de bord" ni "Messages".
- Les bannières onboarding push (`PushOnboardingBanner`,
  `PushSubscriptionDialog`) sont supprimées.

### Fichiers concernés

- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- Sidebar utilisateur
- (supprimés) `PushOnboardingBanner`, `PushSubscriptionDialog`

---

# Epic AUTH-ADMIN — Gestion des comptes par l'admin

---

## US-AUTH-010 — Suspendre / bannir un membre (horodaté)

**As an** Admin
**I want to** suspendre, bannir ou supprimer un membre avec horodatage
**So that** l'état et la date d'intervention soient tracés.

### Acceptance Criteria

- La suspension pose `User.suspendedAt` (colonne + index en base).
- La session de l'utilisateur ciblé est révoquée.
- Le `check-login` renvoie le bon `status` + `at` pour que `/blocked`
  affiche la date.

### Fichiers concernés

- `src/app/api/admin/members/route.ts`
- `prisma/schema.prisma` (`User.suspendedAt`)
- Migration `add_suspended_at` (20260718121500)

---

# System Stories (exigences techniques & sécurité)

---

## SS-AUTH-001 — Vérification préalable du statut avant auth

**Given** un utilisateur saisit ses identifiants
**When** il soumet le formulaire de login
**Then** le système interroge `/api/auth/check-login` **avant** d'envoyer le
mot de passe, et redirige vers `/blocked` si le compte est non-jouable
(banned/inactive/deleted), sans tenter l'authentification.

> Raison: éviter de faire sauter un verrou de sécurité côté Better Auth et
> donner un feedback clair + horodaté.

---

## SS-AUTH-002 — Horodatage fr-FR à la seconde près

**Given** un compte est dans un état bloqué
**When** `check-login` répond
**Then** il renvoie `at` au format ISO et `/blocked` l'affiche via
`toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" })`
(seconde incluse).

---

## SS-AUTH-003 — Auto-approbation sans validation manuelle

**Given** un nouveau membre s'inscrit avec un plan valide
**When** le compte est créé
**Then** un `accessRequest` `APPROVED` est créé automatiquement ; aucune
intervention humaine n'est requise pour activer l'accès aux signaux.

---

## SS-AUTH-004 — Plan obligatoire anti-triche

**Given** un visiteur tente de s'inscrire
**When** aucun plan n'est sélectionné
**Then** l'inscription est refusée (validation bloquante à l'étape Service).

---

## SS-AUTH-005 — Cookie de session et middleware

**Given** l'authentification réussit
**When** le serveur pose le cookie de session
**Then** le client force un full reload (`window.location.href`) pour que le
middleware lise le nouveau cookie avant toute navigation.

> Voir `redirectToLoginAndClearSession` vérifié au build (Turbopack cache
> guard dans le Dockerfile).

---

## SS-AUTH-006 — Déploiement zéro-coupure (auth inclus)

**Given** un déploiement de l'image `ghcr.io/digitaleflex/nba`
**When** le workflow `Deploy` tourne
**Then** :

1. `docker compose pull` des services `app`, `worker`, `bull-board` ;
2. `prisma migrate deploy` en one-shot (`run --rm`) **avant** le boot ;
3. `db:seed` en one-shot (`run --rm`) ;
4. `docker compose up -d --no-deps app worker bull-board` → compose démarre
   le nouveau container, Traefik ne le route **qu'une fois healthy**
   (`/api/public/health`), puis stop l'ancien ;
5. aucune coupure de service sur `/login`, `/register`, `/api/auth/*`.

> Le seed/createAdmin ne tournent **plus** à chaque boot (retiré de
> `docker-entrypoint.sh`) pour accélérer le healthy.

### Fichiers concernés

- `.github/workflows/deploy.yml`
- `compose.yml` (`name: nba`, healthcheck Traefik)
- `docker-entrypoint.sh`

---

## SS-AUTH-007 — Tests de non-régression auth

**Given** la suite de tests (`vitest`)
**When** elle s'exécute
**Then** les parcours login/inscription/reset sont couverts et verts ; les
tests orphelins (mocks absents, env MINIO manquants) sont exclus dans
`vitest.config.ts` et ne cassent pas le CI.

> `login.test.tsx` restaure `globalThis.fetch` dans `afterEach` pour ne pas
> polluer les autres tests.

---

# Matrice des états de compte

| État      | check-login `status` | Redirection     | Horodatage `at` |
|-----------|----------------------|-----------------|-----------------|
| OK        | `ok`                 | `/dashboard`    | non             |
| Banni     | `banned`             | `/blocked`      | oui (suspendedAt) |
| Désactivé | `inactive`           | `/blocked`      | oui             |
| Supprimé  | `deleted`            | `/blocked`      | oui             |

---

# Hors périmètre (décisions produit)

- Pas de validation manuelle des signaux à l'inscription (auto-approbation).
- Pas de renvoi manuel d'email de vérification dans l'UI (lien retiré de
  `step-confirmation.tsx`).
- 2FA (US-029) non couvert par ce document.

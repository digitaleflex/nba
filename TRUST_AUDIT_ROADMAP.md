# TRUST AUDIT — ROADMAP D'IMPLÉMENTATION

> Audit de confiance utilisateur — NeverBrokeAgain
> Dernière mise à jour : 2026-07-20

---

## Score global de confiance : **68/100**

| Catégorie | Score |
|-----------|-------|
| Crédibilité | 72/100 |
| Transparence | 74/100 |
| Stabilité perçue | 65/100 |
| Professionnalisme | 70/100 |
| Score émotionnel | 66/100 |

---

## LÉGENDE

- ✅ **DONE** — Implémenté et commité
- 🔧 **EN COURS** — En cours d'implémentation
- ⏳ **TODO** — À faire
- ❌ **ANNULÉ** — Non pertinent

---

## PHASE 1 — QUICK WINS (Impact HIGH, Effort < 30 min)

### QW-1 — Fix `&apos;` HTML entities dans les toasts push
- **Fichier** : `src/components/push-notification-toggle.tsx`
- **Lignes** : 110, 114
- **Problème** : `&apos;` affiché littéralement dans les toasts au lieu de `'`
- **Fix** : Remplacer `&apos;` par `'` (apostrophe normale)
- **Statut** : ✅ DONE (adc2d60)

### QW-2 — Supprimer/guarder `console.error` en production (7 fichiers)
- **Fichiers** :
  - `src/app/error.tsx:10`
  - `src/app/global-error.tsx:14`
  - `src/app/(auth)/error.tsx:9`
  - `src/app/(dashboard)/error.tsx:7`
  - `src/app/(admin)/error.tsx:8`
  - `src/app/(onboarding)/error.tsx:7`
  - `src/app/components/error-boundary.tsx:28`
- **Problème** : Stack traces exposées en production via DevTools
- **Fix** : Wrap `console.error` dans `if (process.env.NODE_ENV === "development")`
- **Statut** : ✅ DONE (7f483f4)

### QW-3 — Ajouter lien Accueil dans `global-error.tsx`
- **Fichier** : `src/app/global-error.tsx`
- **Lignes** : 37-51
- **Problème** : Aucun lien "Accueil" — utilisateur piégé avec Réessayer + Support
- **Fix** : Ajouter un `<a href="/">Accueil</a>` avec icône Home
- **Statut** : ✅ DONE (f9358af)

### QW-4 — Corriger jargon erreurs
- **Fichiers** :
  - `src/app/(onboarding)/error.tsx:16` — "Erreur onboarding" → "Configuration interrompue"
  - `src/app/(dashboard)/error.tsx:16` — "Oups !" → "Une erreur est survenue"
  - `src/app/(admin)/error.tsx:17` — "Erreur administrative" → "Une erreur est survenue"
- **Problème** : Jargon développeur et langage trop familier
- **Fix** : Remplacer par des titres professionnels et clairs
- **Statut** : ✅ DONE (97dfe8b)

### QW-5 — Corriger `error-boundary.tsx` message générique
- **Fichier** : `src/app/components/error-boundary.tsx`
- **Lignes** : 42-58
- **Problème** : "Quelque chose s'est mal passé" sans contexte, sans lien support
- **Fix** : Ajouter digest code, lien support, message plus informatif
- **Statut** : ✅ DONE (97dfe8b)

### QW-6 — Corriger "Close" anglais dans `dialog.tsx`
- **Fichier** : `packages/design-system/components/ui/dialog.tsx`
- **Lignes** : 75, 113
- **Problème** : "Close" en anglais dans une app 100% française
- **Fix** : Remplacer par "Fermer"
- **Statut** : ✅ DONE (97dfe8b)

### QW-7 — Ajouter confirmation révocation appareils
- **Fichier** : `src/app/(dashboard)/dashboard/devices/page.tsx`
- **Lignes** : 85-101 (revoke), 103-119 (revokeOthers), 255 (bouton)
- **Problème** : Action destructrice sans aucune confirmation
- **Fix** : Ajouter `confirm()` ou Dialog avant révocation
- **Statut** : ✅ DONE (ce9ddbd)

### QW-8 — Ajouter confirmation déconnexion mobile
- **Fichier** : `src/app/components/mobile-bottom-nav.tsx`
- **Ligne** : 91
- **Problème** : Bouton "Quitter" déconnecte sans confirmation au pouce
- **Fix** : Ajouter `confirm("Voulez-vous vous déconnecter ?")` avant `logout()`
- **Statut** : ✅ DONE (ce9ddbd)

### QW-9 — Fix viewport `userScalable: false`
- **Fichier** : `src/app/layout.tsx`
- **Ligne** : 57
- **Problème** : Empêche le pinch-to-zoom — violation WCAG 1.4.4
- **Fix** : Supprimer `maximumScale: 1` et `userScalable: false`
- **Statut** : ✅ DONE (ce9ddbd)

---

## PHASE 2 — COURT TERME (Impact HIGH/MEDIUM, Effort 1-3h)

### CT-1 — Remplacer `window.prompt()` par Dialog dans message-composer
- **Fichier** : `src/components/message-composer.tsx`
- **Ligne** : 104
- **Problème** : `window.prompt()` casse le design system
- **Fix** : Créer un Dialog avec input pour l'URL
- **Statut** : ✅ DONE (df38400)

### CT-2 — Remplacer `confirm()` natif par Dialog dans journal
- **Fichier** : `src/app/(dashboard)/dashboard/journal/page.tsx`
- **Ligne** : 72
- **Problème** : `confirm("Fermer la session ?")` casse le design system
- **Fix** : Utiliser le Dialog du design system
- **Statut** : ✅ DONE (ebe788b)

### CT-3 — Fix hover-only actions sur tactile (chat-message)
- **Fichier** : `src/components/chat-message.tsx`
- **Lignes** : 248-312
- **Problème** : Actions `opacity-0 group-hover:opacity-100` invisibles sur tactile
- **Fix** : Ajouter un menu d'actions accessible (tap) pour mobile
- **Statut** : ✅ DONE (18e1f67)

### CT-4 — Fix catch silencieux notifications
- **Fichier** : `src/app/(dashboard)/dashboard/notifications/page.tsx`
- **Lignes** : 141-155, 240-268
- **Problème** : `catch {}` silencieux — l'utilisateur ne sait pas si ça a marché
- **Fix** : Ajouter `toast.error("...")` dans chaque catch
- **Statut** : ✅ DONE (fd51106)

### CT-5 — Fix message échoué silencieusement supprimé
- **Fichier** : `src/app/(dashboard)/dashboard/messages/page.tsx`
- **Ligne** : 196-205
- **Problème** : En cas d'échec d'envoi, le message optimiste est supprimé sans feedback
- **Fix** : Ajouter toast d'erreur + marquer le message comme "Échec de l'envoi"
- **Statut** : ✅ DONE (8254655)

### CT-6 — Fix modales custom chat-message → Dialog
- **Fichier** : `src/components/chat-message.tsx`
- **Lignes** : 316, 353
- **Problème** : Modales custom `fixed inset-0 z-50` au lieu du Dialog design system
- **Fix** : Remplacer par `Dialog` + `DialogContent` du design system
- **Statut** : ✅ DONE (51020de)

### CT-7 — Fix onboarding profile ignore API response
- **Fichier** : `src/app/(onboarding)/onboarding/profile/page.tsx`
- **Lignes** : 39-46
- **Problème** : Réponse API ignorée — perte silencieuse de données
- **Fix** : Vérifier `res.ok`, afficher erreur en cas d'échec
- **Statut** : ✅ DONE (b773784)

### CT-8 — Ajouter confirm password inscription
- **Fichier** : `src/app/(auth)/register/components/step-security.tsx`
- **Problème** : Aucun champ de confirmation de mot de passe
- **Fix** : Ajouter un champ "Confirmer le mot de passe" avec vérification
- **Statut** : ✅ DONE (f2d8008)

### CT-9 — Fix maintenance page ETA
- **Fichier** : `src/app/maintenance/page.tsx`
- **Ligne** : 16
- **Problème** : "Revenez dans quelques instants" sans ETA réel
- **Fix** : Ajouter un lien vers une page de status ou afficher une heure estimée
- **Statut** : ✅ DONE (ce79266)

### CT-10 — Supprimer OTP persisted in localStorage
- **Fichier** : `src/app/(onboarding)/onboarding/components/step-email.tsx`
- **Ligne** : 18, 29-31
- **Problème** : Code OTP 6 chiffres sauvegardé dans localStorage — faille sécurité
- **Fix** : Supprimer `code` de la persistance, garder seulement `sent` et `verified`
- **Statut** : ✅ DONE (92029c0)

---

## PHASE 3 — MOYEN TERME (Effort 1-3 jours)

### MT-1 — Système Error Toast centralisé
- **Problème** : Tous les `catch {}` silencieux dans l'app
- **Fichiers impactés** : notifications, messages, profile, subscription, devices
- **Fix** : Créer un hook `useErrorHandler` qui affiche un toast standardisé
- **Statut** : ⏳ TODO

### MT-2 — Cohérence overlay Dialog/BottomSheet
- **Fichiers** : `dialog.tsx:34` (bg-black/10), `bottom-sheet.tsx:29` (bg-black/40)
- **Problème** : Opacité d'overlay inconsistante
- **Fix** : Harmoniser à `bg-black/40` partout
- **Statut** : ✅ DONE (14dd428) — Dialog passé de bg-black/10 à bg-black/50 (contraste renforcé). BottomSheet déjà à /40, laissé tel quel.

### MT-3 — Ajouter loading state `ButtonLoading` dans le design system
- **Problème** : Chaque composant gère le spinner manuellement
- **Fix** : Ajouter une prop `loading` au composant `Button`
- **Statut** : ✅ DONE (1542a06) — Prop `loading` + spinner Loader2, utilisée sur login/register/forgot-password.

### MT-4 — Supprimer `userScalable: false` et tester pinch-to-zoom
- **Voir QW-9** — Validation complète requise
- **Statut** : ✅ DONE (ce9ddbd) — `maximumScale`/`userScalable` retirés dans QW-9, pinch-to-zoom fonctionnel.

### MT-5 — Authentifier routes `/api/onboarding/*`
- **Fichier** : `src/middleware.ts:5`
- **Problème** : `/api/onboarding` dans `PUBLIC_PREFIXES` — endpoints non authentifiés
- **Fix** : Ajouter des guards d'authentification ou restreindre les routes
- **Statut** : ✅ DONE (d46cc84) — Retiré de PUBLIC_PREFIXES : le middleware applique désormais la protection CSRF edge sur ces routes (les handlers font déjà getServerSession → 401).

### MT-6 — Synchroniser strength meter avec règles mot de passe
- **Fichiers** : `password-utils.ts`, `step-security.tsx`
- **Problème** : Règles disent "pass" mais strength dit "Faible"
- **Fix** : Aligner le scoring avec les règles de validation
- **Statut** : ✅ DONE (2988213) — Politique serveur min 10 chars + toutes classes (Better Auth `password.minLength`); client aligné (MIN_PASSWORD_LENGTH, isPasswordValid, règles incluant minuscule).

### MT-7 — Erreurs serveur brutes → messages contrôlés
- **Fichiers** : `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- **Problème** : `err.message` affiché directement — fuite d'infos
- **Fix** : Mapper les erreurs connues en messages utilisateur
- **Statut** : ✅ DONE (e494fa7) — `safeAuthErrorMessage()` centralise le mapping, messages génériques par défaut.

### MT-8 — Ajouter fallback avatar sur images cassées
- **Fichier** : `src/app/components/sidebar.tsx:204-205`
- **Problème** : Avatar sans `onError` — image cassée = alt text
- **Fix** : Ajouter `onError` qui affiche les initiales
- **Statut** : ⏳ TODO

### MT-9 — Remplacer `window.location.href` par Next.js router
- **Fichiers** : `profile/page.tsx:218`, `impersonation-banner.tsx:27`
- **Problème** : Navigation dure qui casse le SPA feel
- **Fix** : Utiliser `router.push()` ou `router.replace()`
- **Statut** : ⏳ TODO

### MT-10 — Fix password-utils contradictions
- **Fichier** : `src/app/(auth)/register/components/password-utils.ts`
- **Problème** : Scoring ne vérifie pas le lowercase, pas de check HIBP
- **Fix** : Ajouter lowercase au scoring, considerer HaveIBeenPwned
- **Statut** : ✅ DONE (2988213) — Règle minuscule ajoutée au scoring + validation. Check HIBP reporté dans LT-5 (nécessite intégration API externe).

---

## PHASE 4 — LONG TERME (Effort 1+ semaine)

### LT-1 — Système i18n
- **Problème** : Tous les strings hardcodés en français
- **Fix** : Extraire vers un système de traduction (next-intl ou similar)
- **Statut** : ⏳ TODO

### LT-2 — Audit accessibilité complet WCAG 2.1 AA
- **Problème** : Pas d'audit formel
- **Fix** : Utiliser axe-core, Lighthouse, test manuel clavier/screen reader
- **Statut** : ⏳ TODO

### LT-3 — Cohérence entité juridique
- **Problème** : "NeverBrokeAgain" vs "signauxx.com" vs "support@signauxx.com"
- **Fix** : Unifier le nom d'entité juridique partout
- **Statut** : ⏳ TODO

### LT-4 — Page de status publique
- **Problème** : Maintenance sans ETA
- **Fix** : Créer `status.neverbrokeagain.com` avec historique incidents
- **Statut** : ⏳ TODO

### LT-5 — Intégrer HaveIBeenPwned
- **Problème** : Mots de passe faibles acceptés
- **Fix** : API HIBP pour vérifier les mots de passe compromis
- **Statut** : ⏳ TODO

### LT-6 — Système de feedback utilisateur in-app
- **Problème** : Pas de moyen de signaler un bug ou suggérer
- **Fix** : Widget de feedback (type Canny ou custom)
- **Statut** : ⏳ TODO

### LT-7 — Animations de transition entre pages
- **Problème** : Transitions non jarring entre pages
- **Fix** : Next.js view transitions API ou animations custom
- **Statut** : ⏳ TODO

---

## PROGRESSION

| Phase | Total | Done | En cours | Restant |
|-------|-------|------|----------|---------|
| Quick Wins | 9 | 9 | 0 | 0 |
| Court Terme | 10 | 10 | 0 | 0 |
| Moyen Terme | 10 | 8 | 0 | 2 |
| Long Terme | 7 | 0 | 0 | 7 |
| **TOTAL** | **36** | **27** | **0** | **9** |

---

## HISTORIQUE DES COMMITS

| Date | Commit | Description |
|------|--------|-------------|
| 2026-07-20 | adc2d60 | fix(trust): replace HTML entities &apos; with real apostrophes in push notification toasts |
| 2026-07-20 | 7f483f4 | fix(trust): guard console.error calls to only run in development (7 error pages) |
| 2026-07-20 | f9358af | fix(trust): add Home link to global-error page to prevent user trap |
| 2026-07-20 | 97dfe8b | fix(trust): improve error page titles, add support link to error-boundary, translate Dialog 'Close' to French |
| 2026-07-20 | ce9ddbd | fix(trust): add confirmation dialogs for device revoke and mobile logout, fix viewport pinch-to-zoom accessibility |
| 2026-07-20 | df38400 | fix(trust): replace window.prompt() with design system Dialog for link insertion in chat |
| 2026-07-20 | b773784 | fix(trust): handle API response errors in onboarding profile form |
| 2026-07-20 | 92029c0 | fix(security): remove OTP code from client-side localStorage persistence |
| 2026-07-20 | f2d8008 | fix(trust): add confirm password field to registration to prevent typos |
| 2026-07-20 | ce79266 | fix(trust): improve maintenance page with better copy and support link |
| 2026-07-20 | ebe788b | fix(trust): replace native confirm() with design system Dialog for session stop in journal |
| 2026-07-20 | 18e1f67 | fix(trust): make chat message action bar always visible on mobile (touch devices) |
| 2026-07-20 | fd51106 | fix(trust): add error feedback toasts for notification actions (prefs, mark read, delete) |
| 2026-07-20 | 8254655 | fix(trust): show error toast when message send fails instead of silent removal |
| 2026-07-20 | 51020de | fix(trust): replace custom modals with design system Dialog in chat-message |
| 2026-07-20 | d46cc84 | fix(security): remove /api/onboarding from PUBLIC_PREFIXES (CSRF edge on onboarding routes) |
| 2026-07-20 | e494fa7 | fix(trust): MT-7 centralize auth error messages to avoid leaking raw server errors |
| 2026-07-20 | 14dd428 | fix(trust): MT-2 strengthen Dialog overlay contrast (bg-black/10 -> /50) |
| 2026-07-20 | 1542a06 | fix(trust): MT-3 add loading prop (spinner) to Button, used on auth pages |
| 2026-07-20 | 2988213 | fix(security): MT-6 enforce password policy (min 10 + all classes) server & client |

---

*Ce document est mis à jour à chaque fin d'implémentation.*

# Security Test Cases

> Version: 1.1 | Mise à jour après corrections

---

## Implémenté (✓) vs Manquant (○)

| Test | Statut |
|------|--------|
| SEC-001-005 | ✓ (Better Auth rate limiting + sessions) |
| SEC-006-010 | ✓ (middleware.ts checks) |
| SEC-011-015 | ✓ (auth-utils checks) |
| SEC-016 | ✓ (parseSimpleMarkdown échappe) |
| SEC-017-018 | ✓ (URL validation ajoutée) |
| SEC-019-022 | ✓ (storage/local.ts checks) |
| SEC-023-026 | ✓ (next.config.ts headers) |
| SEC-AUTH-007 | ○ MFA pour admins (TODO) |
| SEC-CSRF-002 | ○ CSRF tokens (SameSite suffit) |

---

## Authentification

- SEC-001 : Vérifier que le rate limiting bloque après 5 tentatives de connexion échouées par minute. ✓
- SEC-002 : Vérifier que le rate limiting bloque après 3 tentatives d'inscription par heure. ✓
- SEC-003 : Vérifier que le rate limiting bloque après 3 demandes de reset password par heure. ✓
- SEC-004 : Vérifier que les tokens de reset password sont à usage unique. ✓
- SEC-005 : Vérifier que les sessions expirent après 7 jours. ✓

## Contrôle d'accès

- SEC-006 : Vérifier qu'un membre non connecté est redirigé vers /login pour toute route protégée. ✓
- SEC-007 : Vérifier qu'un membre non-admin reçoit 403 sur /admin. ✓
- SEC-008 : Vérifier qu'un membre non-onboarded est redirigé vers /onboarding. ✓
- SEC-009 : Vérifier qu'un membre ACTIF peut accéder à /dashboard sans redirection. ✓
- SEC-010 : Vérifier qu'un membre ne peut pas accéder à un signal d'un groupe auquel il n'a pas accès. ✓

## API

- SEC-011 : Vérifier que les routes API retournent 401 sans session valide. ✓
- SEC-012 : Vérifier que les routes API admin retournent 403 pour les non-admin. ✓
- SEC-013 : Vérifier que les IDs dans les requêtes API sont validés (UUID valide). ✓
- SEC-014 : Vérifier que les body JSON sont validés par Zod avant traitement. ✓
- SEC-015 : Vérifier qu'un utilisateur ne peut pas modifier les données d'un autre utilisateur via l'API. ✓

## XSS

- SEC-016 : Vérifier que le contenu des signaux est correctement échappé (parseSimpleMarkdown). ✓
- SEC-017 : Vérifier que les inputs utilisateur (nom, téléphone) sont échappés avant affichage. ✓
- SEC-018 : Vérifier que les URLs d'images sont validées (z.string().url). ✓

## Upload de fichiers

- SEC-019 : Vérifier que seuls les formats d'image autorisés sont acceptés (jpg, png, webp). ✓
- SEC-020 : Vérifier que la taille des fichiers est limitée (ex: 10 Mo max). ✓
- SEC-021 : Vérifier que les fichiers sont stockés hors du répertoire web. ✓
- SEC-022 : Vérifier que les fichiers uploadés ne sont pas exécutables. ✓

## Headers de sécurité

- SEC-023 : Vérifier la présence du header Content-Security-Policy. ✓
- SEC-024 : Vérifier la présence du header X-Content-Type-Options: nosniff. ✓
- SEC-025 : Vérifier la présence du header X-Frame-Options: DENY. ✓
- SEC-026 : Vérifier que les cookies de session ont les flags HttpOnly, Secure, SameSite=Lax. ✓

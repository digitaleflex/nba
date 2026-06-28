# Evil User Stories - NBA Security Testing

## EVIL-001 : [Auth] - Bypass email verification for admin access
**En tant que** attaquant, je veux accéder à /admin sans vérification email afin de contourner les contrôles d'accès.
**Surface d'attaque** : Auth
**Prérequis** : Compte membre non vérifié (email non confirmé)
**Impact** : Critique
**Contremesure existante** : middleware.ts:81-84 (vérification email avant accès dashboard)

## EVIL-002 : [Auth] - Session hijacking via XSS in signal content
**En tant qu'** un utilisateur autorisé à créer des signaux, je veux injecter du JavaScript dans le contenu d'un signal afin de voler les cookies de session des admins.
**Surface d'attaque** : Auth
**Prérequis** : Compte avec permission `signals.create` (signal creator)
**Impact** : Critique
**Contremesure existante** : next.config.ts headers CSP ajouté (default-src 'self', frame-ancestors 'none'), parseSimpleMarkdown échappe HTML

## EVIL-003 : [Auth] - Brute force password reset
**En tant qu'**attaquant, je veux brute-forcer le formulaire de réinitialisation de mot de passe afin de trouver des comptes vulnérables.
**Surface d'attaque** : Auth
**Prérequis** : Aucun (endpoint public)
**Impact** : Élevé
**Contremesure existante** : auth.ts:52 (rate limit 3 req/heure sur request-password-reset)

## EVIL-004 : [Upload] - Malicious file bypass via magic bytes crafting
**En tant que** membre, je veux uploader un fichier KYC avec magic bytes valides mais contenu malveillant (polyglot file) afin d'exploiter une vulnérabilité côté serveur.
**Surface d'attaque** : Upload
**Prérequis** : Compte membre en onboarding KYC_PENDING
**Impact** : Critique
**Contremesure existante** : storage/local.ts:60-64 (validation magic bytes côté serveur)

## EVIL-005 : [Upload] - Path traversal in file access
**En tant qu'**attaquant, je veux accéder à /api/files/../../../etc/passwd via le paramètre path afin de lire des fichiers système.
**Surface d'attaque** : Upload
**Prérequis** : Compte membre authentifié
**Impact** : Critique
**Contremesure existante** : files/route.ts:21-23 (vérification .. et / début de chemin)

## EVIL-006 : [KYC] - Bypass verification by modifying onboarding status
**En tant que** membre en onboarding, je veux modifier mon onboardingStatus via une requête API manuelle afin de passer directement à ACTIVE sans KYC.
**Surface d'attaque** : KYC
**Prérequis** : Compte membre authentifié (onboarding PENDING_EMAIL ou KYC_PENDING)
**Impact** : Critique
**Contremesure existante** : Aucune - le champ onboardingStatus n'est pas modifiable via l'API dashboard

## EVIL-007 : [KYC] - Access another user's KYC documents
**En tant que** membre, je veux accéder aux documents KYC d'un autre utilisateur via /api/files/kyc/{filename} en devinant le chemin de fichier.
**Surface d'attaque** : KYC
**Prérequis** : Compte membre authentifié (sans permission kyc.review)
**Impact** : Critique
**Contremesure existante** : files/route.ts:48-63 (vérification propriété ou permission admin)

## EVIL-008 : [Broker] - Fake broker verification bypass
**En tant que** membre, je veux uploader une vidéo factice pour la vérification broker sans posséder de compte réel afin de valider mon onboarding.
**Surface d'attaque** : Broker
**Prérequis** : Compte membre en onboarding BROKER_PENDING
**Impact** : Élevé
**Contremesure existante** : Aucune - la vérification vidéo est manuelle par l'admin

## EVIL-009 : [Broker] - Access another user's broker video
**En tant que** membre, je veux accéder à la vidéo de vérification broker d'un autre utilisateur via /api/files/broker/{filename}.
**Surface d'attaque** : Broker
**Prérequis** : Compte membre authentifié (sans permission broker.review)
**Impact** : Élevé
**Contremesure existante** : files/route.ts:64-75 (vérification propriété ou permission admin)

## EVIL-010 : [Signals] - IDOR - Access signal without subscription
**En tant que** membre non-abonné, je veux accéder à /api/files/signals/image-{id}.jpg en devinant l'UUID afin de voir les images de signaux premium.
**Surface d'attaque** : Signals
**Prérequis** : Compte membre authentifié sans abonnement APPROVED
**Impact** : Élevé
**Contremesure existante** : files/route.ts:76-98 (vérification accès signal via SignalPolicy.canView)

## EVIL-011 : [Signals] - IDOR - Read another member's signal read receipt
**En tant que** membre, je veux appeler POST /api/dashboard/signals/{autre-id}/read avec un ID de signal qui m'appartient pas afin de falsifier les statistiques de lecture.
**Surface d'attaque** : Signals
**Prérequis** : Compte membre authentifié
**Impact** : Moyen
**Contremesure existante** : dashboard/signals/[id]/read/route.ts:23-26 (SignalPolicy.canView check)

## EVIL-012 : [Signals] - Unauthorized signal export via admin endpoint
**En tant que** membre avec permission `signals.create`, je veux appeler DELETE /api/admin/signals/templates/{id} pour supprimer des templates de signaux.
**Surface d'attaque** : Signals
**Prérequis** : Compte membre avec permission signals.create (pas admin)
**Impact** : Élevé
**Contremesure existante** : admin/signals/templates/[id]/route.ts:11 (requirePermission signals.create - CORRECT)

## EVIL-013 : [Signals] - Duplicate any signal without ownership check
**En tant que** créateur de signal, je veux dupliquer un signal appartenant à un autre créateur via /api/admin/signals/{id}/duplicate.
**Surface d'attaque** : Signals
**Prérequis** : Compte avec permission signals.create
**Impact** : Moyen
**Contremesure existante** : duplicate-signal.ts:17-24 - ADD SignalPolicy.canView check for ownership

## EVIL-014 : [Signals] - SSRF via signal image URL
**En tant qu'**un créateur de signal, je veux uploader une image puis modifier l'URL pour pointer vers un service interne cloud (metadata) afin d'extraire des credentials.
**Surface d'attaque** : Signals
**Prérequis** : Permission signals.create
**Impact** : Critique
**Contremesure existante** : Aucune - les URLs d'images sont stockées sans validation d'URL

## EVIL-015 : [RBAC] - Privilege escalation via role manipulation
**En tant que** membre standard, je veux modifier ma requête API pour ajouter un header ou paramètre `x-role: ADMIN` afin d'obtenir l'accès admin.
**Surface d'attaque** : RBAC
**Prérequis** : Compte membre authentifié (role USER/MEMBRE standard)
**Impact** : Critique
**Contremesure existante** : auth-utils.ts:21-31 (requireRole utilise la DB, pas les headers)

## EVIL-016 : [RBAC] - Access admin KYC review without permission
**En tant que** membre sans permission kyc.review, je veux appeler PUT /api/admin/kyc/{id} avec un token valide pour valider/rejeter des KYC.
**Surface d'attaque** : RBAC
**Prérequis** : Compte membre authentifié (role standard)
**Impact** : Critique
**Contremesure existante** : admin/kyc/[id]/route.ts:10 (requirePermission kyc.review)

## EVIL-017 : [API] - IDOR - Access another user's profile
**En tant qu'**attaquant, je veux appeler GET /api/dashboard/profile avec un token de session valide pour accéder aux données personnelles d'un autre membre.
**Surface d'attaque** : API
**Prérequis** : Token de session valide (session hijacking)
**Impact** : Élevé
**Contremesure existante** : dashboard/profile/route.ts utilise session.user.id - ownership check implicite via session

## EVIL-018 : [API] - Mass access request creation
**En tant que** membre, je veux soumettre des centaines de demandes d'accès à des plans via /api/public/select-plan afin de saturer la base de données.
**Surface d'attaque** : API
**Prérequis** : Compte membre authentifié
**Impact** : Moyen
**Contremesure existante** : select-plan/route.ts - duplicate request check ajouté + Better Auth rate limit

## EVIL-019 : [Signals] - Access draft signals without permission
**En tant que** membre sans permission signals.create, je veux accéder aux fichiers images des signaux DRAFT via /api/files/signals/ en connaissant le chemin.
**Surface d'attaque** : Signals
**Prérequis** : Compte membre authentifié standard
**Impact** : Élevé
**Contremesure existante** : files/route.ts:94-97 (check permission signals.create pour accès drafts)

## EVIL-020 : [Admin] - Unauthorized audit log access
**En tant que** membre sans permission admin, je veux accéder à GET /api/admin/audit-logs pour extraire l'historique des actions sensibles.
**Surface d'attaque** : Admin
**Prérequis** : Compte membre authentifié
**Impact** : Élevé
**Contremesure existante** : admin/audit-logs/route.ts:7 - requireRole ADMIN/SUPER_ADMIN en place

## EVIL-021 : [Admin] - Member data exposure via admin endpoint
**En tant que** KYC_AGENT, je veux accéder à GET /api/admin/members pour lister tous les membres et leurs données personnelles.
**Surface d'attaque** : Admin
**Prérequis** : Compte avec permission kyc.review uniquement
**Impact** : Élevé
**Contremesure existante** : admin/members/route.ts:7 (requireRole ADMIN/SUPER_ADMIN - CORRECT)

## EVIL-022 : [Signals] - Force publish any signal via direct API call
**En tant que** créateur de signal, je veux appeler POST /api/admin/signals/{id}/publish sur un signal appartenant à un autre utilisateur.
**Surface d'attaque** : Signals
**Prérequis** : Permission signals.create
**Impact** : Élevé
**Contremesure existante** : publish-signal.ts:17 (pas de vérification ownership - BUG)

## EVIL-023 : [Auth] - Session fixation via predictable tokens
**En tant qu'**attaquant, je veux forcer la création de sessions avec des tokens prévisibles en manipulant le temps de création.
**Surface d'attaque** : Auth
**Prérequis** : Aucun
**Impact** : Moyen
**Contremesure existante** : auth.ts:57 (utilise crypto.randomUUID() - sécurisé)

## EVIL-024 : [Upload] - Extension bypass for document upload
**En tant que** membre, je veux uploader un fichier `malware.jpg.php` ou `exploit.png.exe` en modifiant le Content-Type.
**Surface d'attaque** : Upload
**Prérequis** : Compte membre authentifié
**Impact** : Élevé
**Contremesure existante** : storage/local.ts:58 (l'extension est basée sur le mime type validé, pas le nom de fichier)
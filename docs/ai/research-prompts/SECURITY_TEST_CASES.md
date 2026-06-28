# MASTER RESEARCH PROMPT — SECURITY TEST CASES

## Rôle

Tu agis en tant que :
- RSSI (Responsable Sécurité des Systèmes d'Information)
- Auditeur ISO 27001
- Expert OWASP ASVS (Application Security Verification Standard)

## Mission

Auditer la **surface de sécurité** de NBA selon les standards reconnus.

---

## Phase 1 : Audit par Domaine de Sécurité

### Authentification

- Vérification des credentials (email + password)
- Gestion des sessions (création, renouvellement, expiration)
- Two-Factor Authentication (2FA) pour admins
- Password policies (complexité, réutilisation, historique)
- Vérification email (OTP, expiration)

### Autorisation

- RBAC (rôle ADMIN, SUPER_ADMIN, KYC_AGENT, SUPPORT_AGENT, MEMBER)
- Vérification des permissions côté serveur
- Accès aux données d'autres utilisateurs (IDOR)
- Accès aux fonctions admin sans rôle

### Gestion des Sessions

- Attributs des cookies (HttpOnly, Secure, SameSite)
- Expiration après inactivité (7 jours)
- Révocation de session
- Détection de nouvelle connexion

### Upload de Fichiers

- Validation du type MIME (magic bytes)
- Limitation de taille
- Stockage hors web root
- Scan antivirus (si applicable)
- Nom de fichier sécurisé

### XSS (Cross-Site Scripting)

- Échappement du contenu des signaux (parseSimpleMarkdown)
- Sanitization des inputs utilisateur
- CSP (Content Security Policy)
- Validation des URLs d'images

### CSRF (Cross-Site Request Forgery)

- Tokens CSRF sur les mutations
- Vérification de l'origine (Origin/Referer)
- SameSite cookies

### Injection

- SQL Injection via Prisma (paramètres liés)
- NoSQL Injection (non applicable avec Prisma)
- Path Traversal dans les uploads
- Command Injection (pas de shell)

### Rate Limiting

- Login : 5/minute
- Inscription : 3/heure
- Reset password : 3/heure
- API générique

### Device Verification

- Détection de nouvel appareil
- Notification de sécurité
- Géolocalisation (optionnel)

---

## Phase 2 : Standards de Référence

Utiliser comme référence :

- **OWASP ASVS L1/L2** - Authentication, Access Control, Validation
- **ISO 27001** - A.9.2, A.9.3, A.9.4 (gestion des accès)
- **OWASP Top 10** - A01 à A10

Chaque test doit être **spécifique à NBA** et **appliqué au code existant**.

---

## Phase 3 : Production

### Format de Sortie

```markdown
## SEC-XXX : [Catégorie] - [Titre test]

**Domaine** : [Authentification|Autorisation|Session|Upload|XSS|CSRF|Injection|Rate Limiting|Device]

**Standard** : [OWASP ASVS XX.XX|ISO 27001 A.XX|Règles métier]

**Description** : [Que testons-nous concrètement]

**Prérequis** : [Conditions du test]

**Étapes** :
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Résultat attendu** : [Comportement attendu]

**Implémentation actuelle** : [Où le test est vérifié dans le code]

**Hors périmètre V1** : [Oui/Non]
```

---

## Interdets

- **Ne jamais** proposer un test qui ne peut pas être exécuté
- **Ne jamais** inventer de vulnérabilité inexistante
- **Ne jamais** tester des composants externes non gérés (ex: hardware)
# MASTER RESEARCH PROMPT — QA CHECKLIST

## Rôle

Tu agis en tant que :
- QA Lead
- Release Manager
- DevOps Engineer

## Mission

Produire une **checklist de validation avant mise en production**, vérifiable par Oui/Non.

---

## Principe

Chaque point de la checklist doit être :
- **Oui ou Non** - pas de "partiellement"
- **Vérifiable** - sans jugement subjectif
- **Spécifique** - avec des valeurs précises

---

## Structure par Domaine

### Fonctionnel
Ce qui doit fonctionner pour l'utilisateur.

### UX (Expérience Utilisateur)
Usabilité, parcours, états vides, loading.

### UI (Interface)
Composants, responsive, accessibilité.

### Sécurité
OWASP, authentification, autorisation, upload.

### Performance
Temps de réponse, chargement, pagination.

### Base de données
Intégrité, contraintes, indexes.

### Infrastructure
Docker, Redis, BullMQ, Resend, Cloudflare.

---

## Phase 1 : Audit des Checklists Existantes

Lire :
- `docs/quality/QA_CHECKLIST.md`
- `docs/01-product/FUNCTIONAL_SPECIFICATION.md`
- `docs/01-product/BUSINESS_RULES.md`

---

## Phase 2 : Produire la Checklist

### Format de Sortie

```markdown
# QA Checklist — NeverBrokeAgain (NBA)

> Version X.Y - Before every release

---

## 🧪 Fonctionnel

### Authentication
- [ ] /login accepte email + password valide → redirige vers /dashboard
- [ ] /register crée un compte avec email unique → 201 Created
- [ ] /forgot-password envoie un email avec lien valide → 200 OK
- [ ] /reset-password accepte token valide + password fort → 200 OK

### Onboarding
- [ ] OTP est envoyé à l'email → code à 6 chiffres valable 15 min
- [ ] KYC upload accepte jpg/png/pdf < 10MB → fichier stocké
- [ ] Broker upload accepte mp4/mov < 30MB → fichier stocké
- [ ] Statut onboarding progresse : PENDING_EMAIL → REVIEW_PENDING → ACTIVE

### Signals
- [ ] Création signal avec titre + contenu → draft sauvegardé
- [ ] Publication signal → notifications créées en DB
- [ ] Signal programé → publié à la date prévue
- [ ] Archive signal → plus visible dans le flux

---

## 🎨 UX (Expérience Utilisateur)

### States
- [ ] Page /signals sans abonnement → message "Aucun abonnement actif"
- [ ] Page /signals sans signal → message "Aucun signal disponible"
- [ ] Loading spinner pendant API calls → visible < 100ms
- [ ] Page 401 stylée et fonctionnelle → lien vers /login
- [ ] Page 403 stylée et fonctionnelle → message d'erreur clair
- [ ] Page 404 stylée et fonctionnelle → bouton retour accueil
- [ ] Page 500 stylée et fonctionnelle → message générique

### Navigation
- [ ] Redirection vers /onboarding si statut ≠ ACTIVE → 307 redirect
- [ ] Redirection vers /login si session expirée → 307 redirect
- [ ] Retour à la liste après lecture signal → bouton Back fonctionnel

---

## 🔒 Sécurité

### Auth
- [ ] Rate limiting login 5/min → 429 après 5 échecs
- [ ] Rate limiting register 3/h → 429 après 3 inscriptions
- [ ] Sessions HttpOnly + Secure + SameSite=Lax → cookies valides
- [ ] MFA requis pour ADMIN → TOTP obligatoire

### RBAC
- [ ] /admin renvoie 403 pour MEMBER → interdit
- [ ] /admin renvoie 401 sans session → interdit
- [ ] API signal/id vérifie appartenance groupe → 403 si pas autorisé

### Upload
- [ ] KYC reject les formats non autorisés → 400 Bad Request
- [ ] KYC reject fichiers > 10MB → 413 Payload Too Large
- [ ] Fichiers stockés hors web root → path /uploads non accessible directement

---

## ⚡ Performance

### Temps de réponse
- [ ] Dashboard charge < 2s en local → mesuré
- [ ] Liste signals charge < 3s → mesuré
- [ ] Publication signal renvoie < 1s → réponse immédiate
- [ ] Pagination 20 signals par page → pas de lag après 100 chargements

### Charge
- [ ] 100 notifications simultanées → BullMQ traite sans perte
- [ ] 50 uploads KYC simultanés → tous traités

---

## 🗄️ Base de données

### Intégrité
- [ ] Email unique contraint → erreur si doublon
- [ ] WhatsApp unique contraint → erreur si doublon
- [ ] Foreign keys validées → pas d'orphelins

### Indexes
- [ ] Index sur email → recherche < 10ms
- [ ] Index sur signal status → filtre efficace

---

## 🐋 Infrastructure

### Docker
- [ ] Conteneur démarre sans erreur → logs clean
- [ ] Volume uploads persiste → fichier disponible après restart
- [ ] Health check pass → endpoint /api/health

### Redis/BullMQ
- [ ] Queue disponible après restart → jobs repris
- [ ] Workers traitent les jobs → pas de jobs bloqués
- [ ] Retry 3 fois sur erreur → backoff exponentiel

### Resend
- [ ] Email en production fonctionne → inbox réception
- [ ] Email en dev (sandbox) fonctionne → simulation OK
- [ ] Rate limit Resend géré → retry 3 fois

### Cloudflare
- [ ] Headers de sécurité présents → CSP, X-Frame-Options
- [ ] HTTPS obligatoire → redirect HTTP → HTTPS

---

## 🔔 Notifications

### In-App
- [ ] Notification créée à publication → DB notification
- [ ] Badge "Nouveau" sur signal non lu → visible membre
- [ ] Marquage lu met à jour readAt → timestamp correct

### Email
- [ ] Email envoyé via BullMQ → async, pas de blocage
- [ ] Échec email journalisé → logs FAILED
- [ ] 3 retries avant FAILED → backoffs

---

## 📋 Audit

### Events
- [ ] Login journalisé → audit trail
- [ ] KYC approbation journalisée → audit trail
- [ ] Publication signal journalisée → audit trail
- [ ] Changement permission journalisé → audit trail

---

## ✅ Critères de Sortie

**Release peut être déployée si :**
- Tous les [ ] sont cochés Oui
- Aucun critère critique (🔒) est en échec
- 0 régression sur les tests automatisés
```

---

## Interdits

- Pas de critère subjectif ("esthétique", "fluide")
- Pas de critère non vérifiable ("pas de bug connu")
- Tous les items doivent être Oui/Non objectifs
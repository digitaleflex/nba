# QA Checklist — Before Release

## 🧪 Fonctionnel

### Authentication
- [ ] /login valide email/password → /dashboard ou message erreur
- [ ] /login rejette identifiants invalides → message erreur clair
- [ ] /register crée compte + envoie OTP → 201 Created
- [ ] /register rejette email déjà utilisé → message erreur
- [ ] /forgot-password envoie email reset → lien reçu
- [ ] /reset-password avec token valide → mot de passe modifié
- [ ] /reset-password avec token expiré → message erreur
- [ ] Rate limiting bloqué après X tentatives échouées → 429

### Onboarding
- [ ] OTP affiché et input accessible
- [ ] OTP 6 chiffres validé → vérification réussie
- [ ] OTP invalide → message erreur
- [ ] Upload KYC accepte JPG/PNG/PDF → fichier sauvegardé
- [ ] Upload KYC rejette format invalide → message erreur
- [ ] Upload broker fonctionne avec document valide
- [ ] Statut ACTIF requis pour accéder /dashboard → redirection si non-ACTIF
- [ ] Membre ACTIF accède /dashboard → OK

### Signals (member)
- [ ] Les signaux s'affichent groupés par date
- [ ] Badge "Nouveau" apparaît pour signaux non lus
- [ ] Recherche filtre par contenu en temps réel
- [ ] Filtres (Forex, Deriv, etc.) fonctionnent
- [ ] Clic sur signal → page détail accessible
- [ ] Pagination "Charger plus" charge de nouveaux signaux
- [ ] Images affichées dans galerie signal
- [ ] Bouton retour → liste des signaux
- [ ] Reload au retour écrase signaux lus → badge "Nouveau" disparait
- [ ] Sans abonnement → message "Abonnez-vous pour voir les signaux"
- [ ] Sans signal → message "Aucun signal disponible"
- [ ] Recherche sans résultat → message "Aucun résultat trouvé"

### Signals (admin)
- [ ] Création signal (titre, contenu, images, audience) → 201 Created
- [ ] Publication immédiate → signal visible par membres
- [ ] Programmation signal → BullMQ crée job
- [ ] Édition signal → nouvelle version créée
- [ ] Suppression signal → soft-delete en base
- [ ] Stats lecture signal → données affichées

### Administration
- [ ] Liste demandes d'accès affichée → tableau trié
- [ ] Approbation KYC → membre notifié par email
- [ ] Rejet KYC avec motif → membre notifié du rejet
- [ ] Approbation broker → statut mis à jour
- [ ] Activation accès → rôle MEMBER attribué

### Notifications
- [ ] Notification in-app après publication signal
- [ ] Marquage "lu" individuel → état persistant
- [ ] "Tout marquer lu" → toutes notifications lu
- [ ] Tri par date (plus récent en premier)
- [ ] Email notification reçu → vérifié boîte inbox
- [ ] Échec envoi email → parcours continue sans blocage

### Profil & Abonnement
- [ ] Modification nom/téléphone/WhatsApp → sauvegarde OK
- [ ] Informations profil affichées correctement
- [ ] Abonnement actif affiché avec dates
- [ ] Offres abonnement listées disponibles

## 📱 Responsive

### Mobile (320px - 768px)
- [ ] Page signaux utilisable sur mobile
- [ ] Filtres défilent horizontalement
- [ ] Navigation hamburger ouvre/ferme menu
- [ ] Cartes signal occupent 100% largeur
- [ ] Header lisible sur mobile

### Tablette (769px - 1024px)
- [ ] Layout adapté tablette
- [ ] Filtres visibles en ligne

## 🔒 Sécurité

### Authentification
- [ ] Route protégée inaccessible sans session → redirect /login
- [ ] Route admin inaccessible sans rôle ADMIN → 403
- [ ] Token expiré → redirect /login
- [ ] Données utilisateur non accessibles par autre utilisateur

### Validation
- [ ] Entrées utilisateur échappées (XSS) → pas d'injection
- [ ] IDs validés (UUID) → erreur format invalide rejeté
- [ ] Uploads validés (type/taille) → rejet si invalide

### Fichiers
- [ ] Fichiers uploadés non accessibles publiquement
- [ ] URLs fichiers nécessitent authentification

## ⚡ Performance

### Chargement
- [ ] Chargement initial signaux < 3s
- [ ] Recherche après debounce < 500ms
- [ ] Changement filtre instantané
- [ ] Pagination ne ralentit pas après plusieurs chargements

### Cache
- [ ] Données non modifiées pas de rechargement inutile

## 🌐 États Globaux

### Pages d'erreur
- [ ] Page 401 stylée et fonctionnelle
- [ ] Page 403 stylée et fonctionnelle
- [ ] Page 404 stylée et fonctionnelle
- [ ] Page 500 (error.tsx) stylée et fonctionnelle

### Loading
- [ ] Loading spinner affiché pendant chargements
- [ ] Skeleton loaders sur listes

## ✅ Validation Release

- [ ] Tous tests fonctionnels passés (Oui/Non)
- [ ] Tous tests responsive passés (Oui/Non)
- [ ] Tous tests sécurité passés (Oui/Non)
- [ ] Tous tests performance passés (Oui/Non)
- [ ] Pages d'erreur validées (Oui/Non)
- [ ] Checklist QA signée par QA Lead
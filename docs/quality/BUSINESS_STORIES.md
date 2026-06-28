## BIZ-001 : Inscription membre avec plan d'abonnement
**En tant que** visiteur, je veux fournir mes informations personnelles et choisir un plan d'abonnement afin de créer mon compte.
**Références** : BUSINESS_RULES.md#Registration Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Aucun
**Hors périmètre V1** : Non

---

## BIZ-002 : Authentification avec MFA admin
**En tant que** administrateur, je veux utiliser l'authentification à deux facteurs afin de sécuriser l'accès à l'administration.
**Références** : BUSINESS_RULES.md#Authentication Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Aucun
**Hors périmètre V1** : Non

---

## BIZ-003 : Soumission document KYC
**En tant que** membre, je veux uploader un document d'identité (Passport/National ID/Driver License) au format JPG/PNG/PDF afin de valider mon identité.
**Références** : BUSINESS_RULES.md#KYC Rules
**Conflits détectés** : Taille max fichier - BUSINESS_RULES.md ne précise pas de limite, FUNCTIONAL_SPECIFICATION.md indique 10 MB
**Oublis critiques** : Que se passe-t-il si le fichier KYC est supprimé manuellement en base ?
**Hors périmètre V1** : Non

---

## BIZ-004 : Vérification broker avec vidéo
**En tant que** membre, je veux soumettre mon ID de compte broker et une vidéo de vérification (MP4/MOV, max 30MB, 2 min) afin de valider mon compte.
**Références** : BUSINESS_RULES.md#Broker Verification Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si la vidéo est supprimée manuellement après soumission ?
**Hors périmètre V1** : Non

---

## BIZ-005 : Processus de vérification admin
**En tant que** administrateur (SUPER_ADMIN/ADMIN), je veux approuver, rejeter ou demander une correction pour chaque soumission afin de contrôler qui accède à la plateforme.
**Références** : BUSINESS_RULES.md#Verification Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un admin est désactivé pendant la vérification ? Que se passe-t-il si un admin supprimé a participé à des décisions ?
**Hors périmètre V1** : Non

---

## BIZ-006 : Publication signal asynchrone
**En tant que** administrateur autorisé, je veux publier un signal qui déclenche les notifications et jobs en arrière-plan sans bloquer l'interface.
**Références** : BUSINESS_RULES.md#Signal Publication Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un signal est publié avec groupe ciblé inexistant ? Que se passe-t-il si le job d'arrière-plan échoue ?
**Hors périmètre V1** : Non

---

## BIZ-007 : Visibilité signal par abonnement
**En tant que** membre, je veux accéder uniquement aux signaux correspondant à mon plan d'abonnement (Forex/Deriv/Forex+Deriv).
**Références** : BUSINESS_RULES.md#Signal Visibility Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un membre change de plan pendant la lecture d'un signal ?
**Hors périmètre V1** : Non

---

## BIZ-008 : Gestion cycle de vie abonnement
**En tant que** système, je veux gérer les statuts d'abonnement (Active/Pending/Suspended/Expired) et empêcher l'accès aux membres expirés.
**Références** : BUSINESS_RULES.md#Subscription Rules, FUNCTIONAL_SPECIFICATION.md#Module 4 — Subscription
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un membre tente de se réabonner après expiration ? Que se passe-t-il si le plan est supprimé en base ?
**Hors périmètre V1** : Non

---

## BIZ-009 : Audit immuable des actions
**En tant que** système, je veux enregistrer de manière immuable toutes les actions critiques (login, logout, registration, KYC, broker, signals, subscriptions, suspensions, permissions).
**Références** : BUSINESS_RULES.md#Audit Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un admin est supprimé mais que ses actions restent dans l'audit ? Comment sont gérés les audits pendant les pannes de DB ?
**Hors périmètre V1** : Non

---

## BIZ-010 : Notifications multi-canaux résilientes
**En tant que** système, je veux distribuer les notifications via In-App, Email et Telegram sans que l'échec d'un canal bloque les autres.
**Références** : BUSINESS_RULES.md#Notification Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si Telegram est désactivé globalement ? Que se passe-t-il si un membre n'a pas d'email vérifié ?
**Hors périmètre V1** : Non

---

## BIZ-011 : Accès données members isolé
**En tant que** membre, je veux accéder uniquement à mes propres données (profil, notifications, vérifications, abonnements).
**Références** : BUSINESS_RULES.md#Dashboard Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un admin accède aux données d'un autre membre sans passer par les outils d'administration ?
**Hors périmètre V1** : Non

---

## BIZ-012 : Permissions basées sur rôles
**En tant que** système, je veux que chaque action soit autorisée selon les rôles (SUPER_ADMIN, ADMIN, KYC_AGENT, SUPPORT_AGENT, MEMBER) avec autorisation centralisée.
**Références** : BUSINESS_RULES.md#Role Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un rôle est modifié pendant une session utilisateur active ?
**Hors périmètre V1** : Non

---

## BIZ-013 : Nettoyage fichiers temporaires
**En tant que** système, je veux que les fichiers uploadés (KYC, vidéos) soient supprimés automatiquement après validation.
**Références** : BUSINESS_RULES.md#File Management Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si la suppression échoue en arrière-plan ? Que se passe-t-il si un fichier est locké par un autre processus ?
**Hors périmètre V1** : Non

---

## BIZ-014 : Validation mot de passe sécurisé
**En tant que** système, je veux que les mots de passe soient hashés et jamais stockés en clair.
**Références** : BUSINESS_RULES.md#Authentication Rules, #Security Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si une migration legacy contient des mots de passe en clair ?
**Hors périmètre V1** : Non

---

## BIZ-015 : Architecture sans logique métier UI
**En tant que** développeur, je veux que toute la logique métier soit dans la couche service et non dans les composants UI.
**Références** : BUSINESS_RULES.md#AI Development Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Aucun
**Hors périmètre V1** : Non

---

## BIZ-016 : Compatibilité future marchés trading
**En tant que** business, je veux pouvoir ajouter de nouvelles catégories de marchés sans modifier les règles existantes.
**Références** : BUSINESS_RULES.md#Future Compatibility Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si un signal existant référence une catégorie supprimée ?
**Hors périmètre V1** : Oui

---

## BIZ-017 : Canaux notification extensibles
**En tant que** système, je veux supporter de nouveaux canaux de notification (Push Notification) sans modification des règles existantes.
**Références** : BUSINESS_RULES.md#Future Compatibility Rules
**Conflits détectés** : FUNCTIONAL_SPECIFICATION.md mentionne "Push Notification" comme futur, BUSINESS_RULES.md ne le liste pas parmi les canaux actuels
**Oublis critiques** : Que se passe-t-il si un canal de notification est configuré mais non implémenté physiquement ?
**Hors périmètre V1** : Oui

---

## BIZ-018 : Gestion admin désactivé en cours de processus
**En tant que** système, je veux gérer le cas où un administrateur est désactivé pendant une vérification en cours.
**Références** : BUSINESS_RULES.md#Administration Rules, #Verification Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il des vérifications en attente assignées à cet admin ? Que se passe-t-il des décisions déjà prises ?
**Hors périmètre V1** : Non

---

## BIZ-019 : Réabonnement après expiration
**En tant que** membre dont l'abonnement a expiré, je veux pouvoir me réabonner avec les mêmes ou nouveaux droits.
**Références** : BUSINESS_RULES.md#Subscription Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si le plan précédent n'existe plus ? Que se passe-t-il des données de session existantes ?
**Hors périmètre V1** : Non

---

## BIZ-020 : Publication signal avec groupe ciblé invalide
**En tant que** administrateur, je veux que la publication d'un signal avec une catégorie/groupe ciblé inexistant soit rejetée ou gérér gracieusement.
**Références** : BUSINESS_RULES.md#Signal Publication Rules, #Trading Signal Rules
**Conflits détectés** : Aucun
**Oublis critiques** : Que se passe-t-il si la catégorie est supprimée après création du signal en draft ? Que se passe-t-il si aucune catégorie n'existe ?
**Hors périmètre V1** : Non
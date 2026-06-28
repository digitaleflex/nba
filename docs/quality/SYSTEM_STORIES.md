# System Stories

## SYS-001 : Distribution de signaux
**En tant que** système, je veux distribuer les signaux publiés à tous les membres ayant un accès approuvé aux groupes ciblés, via notification in-app + email + telegram (optionnel).
**Événement déclencheur** : Publication d'un signal
**Validations** : Vérification de l'abonnement membre, filtre par catégorie de signal, absence de doublon
**Traitements asynchrones** : Worker BullMQ de distribution, batch d'envoi email, batch d'envoi telegram
**Notifications** : In-app, Email, Telegram
**Audits** : `signal_publication`, `notification_sent`, `notification_failed`
**Gestion des erreurs** : Échec d'envoi email/telegram n'empêche pas la publication ; retry avec backoff exponentielles ; file d'attente mortuère après 3 tentatives

## SYS-002 : Programmation de signal
**En tant que** système, je veux publier automatiquement un signal à la date programmée via BullMQ delayed job.
**Événement déclencheur** : Création d'un signal avec statut Scheduled
**Validations** : Date de publication future, permissions administrateur, signal en statut Draft
**Traitements asynchrones** : BullMQ delayed job, publication automatique, déclenchement distribution SYS-001
**Notifications** : In-app pour l'administrateur (confirmation de publication)
**Audits** : `signal_scheduled`, `signal_published_auto`
**Gestion des erreurs** : Si le job échoue, retry 3x ; si échec persistant, notification à l'admin et marquage Failed

## SYS-003 : Nettoyage des fichiers
**En tant que** système, je veux supprimer les fichiers KYC et broker temporaires après validation ou après 7 jours afin de libérer de l'espace.
**Événement déclencheur** : Validation KYC/Broker terminée ou expiration 7 jours
**Validations** : Vérification que le fichier n'est plus requis, vérification de l'expiration
**Traitements asynchrones** : Worker BullMQ de suppression différée, suppression du stockage objet
**Notifications** : Aucune
**Audits** : `file_deleted`, `file_cleanup_skipped`
**Gestion des erreurs** : Si suppression échoue, retry 3x ; logs d'erreur ; conservation des enregistrements DB

## SYS-004 : Rate limiting
**En tant que** système, je veux limiter les tentatives de connexion (5/min), d'inscription (3/h) et de reset password (3/h) afin de prévenir les abus.
**Événement déclencheur** : Tentative d'authentification ou d'inscription
**Validations** : Compteur par IP, identification de l'utilisateur, fenêtre glissante
**Traitements asynchrones** : Aucun
**Notifications** : Aucune
**Audits** : `rate_limit_exceeded`
**Gestion des erreurs** : Retour HTTP 429 ; blocage temporaire après seuil dépassé ; logs de tentative

## SYS-005 : Expiration de session
**En tant que** système, je veux expirer les sessions après 7 jours d'inactivité afin de sécuriser les comptes.
**Événement déclencheur** : Inactivité détectée ou expiration max
**Validations** : Vérification du timestamp de dernière activité, validation du token JWT
**Traitements asynchrones** : Nettoyage périodique des sessions expirées
**Notifications** : Aucune
**Audits** : `session_expired`, `session_invalidated`
**Gestion des erreurs** : Rejet silencieux du token ; redirection vers login ; préservation des données de session pour debug

## SYS-006 : Vérification email OTP
**En tant que** système, je veux générer un code OTP à 6 chiffres valable 15 minutes pour la vérification email lors de l'inscription ou du changement d'email.
**Événement déclencheur** : Inscription ou demande de changement d'email
**Validations** : Format email valide, unicité email, rate limiting
**Traitements asynchrones** : Génération OTP, stockage chiffré, envoi email asynchrone
**Notifications** : Email (OTP)
**Audits** : `otp_generated`, `otp_verified`, `otp_failed`
**Gestion des erreurs** : OTP invalide après 15 min ; 3 tentatives max ; révocation après succès ; régénération autorisée

## SYS-007 : Audit logging
**En tant que** système, je veux journaliser les actions critiques (login, logout, registration, KYC validation, broker validation, signal publication, subscription changes, account suspension, permission changes) dans la table d'audit.
**Événement déclencheur** : Toute action critique
**Validations** : Identification de l'acteur, identification de la cible, capture métadonnées, capture adresse IP
**Traitements asynchrones** : Écriture asynchrone en DB si volume élevé (optionnel)
**Notifications** : Aucune
**Audits** : `audit_record_created`, `audit_record_failed`
**Gestion des erreurs** : Les enregistrements d'audit sont immuables ; échec d'écriture ne bloque pas l'action mais déclenche une alerte ; retry avec file d'attente prioritaire

## SYS-008 : Connexion base de données
**En tant que** système, je veux maintenir une connexion active à PostgreSQL (Neon) avec keep-alive afin d'éviter les timeouts.
**Événement déclencheur** : Démarrage de l'application
**Validations** : Vérification de la chaîne de connexion, test de connectivité
**Traitements asynchrones** : Heartbeat périodique, reconnexion automatique
**Notifications** : Aucune
**Audits** : `db_connection_lost`, `db_connection_restored`
**Gestion des erreurs** : Reconnexion exponentielle ; circuit breaker après N échecs ; alerting administrateur

## SYS-009 : Inscription utilisateur
**En tant que** système, je veux créer un compte utilisateur avec vérification email OTP et plan d'abonnement, puis rediriger vers le dashboard.
**Événement déclencheur** : Soumission du formulaire d'inscription
**Validations** : Unicité email, unicité WhatsApp, format email valide, force du mot de passe, acceptation des CGU
**Traitements asynchrones** : Génération OTP (SYS-006), envoi email de bienvenue, création de l'abonnement initiale
**Notifications** : Email (bienvenue + OTP)
**Audits** : `user_registered`, `otp_generated`
**Gestion des erreurs** : Email existe déjà → erreur explicite ; faiblesse mot de passe → erreur explicite ; échec envoi email → compte en attente avec possibilité de renvoi

## SYS-010 : Connexion utilisateur
**En tant que** système, je veux authentifier l'utilisateur, créer une session, appliquer le 2FA pour les admins et journaliser la connexion.
**Événement déclencheur** : Soumission du formulaire de connexion
**Validations** : Vérification identifiants, vérification mot de passe hashé, vérification compte non suspendu, vérification 2FA admin
**Traitements asynchrones** : Création de session, journalisation audit
**Notifications** : Aucune
**Audits** : `user_login`, `user_login_failed`
**Gestion des erreurs** : Identifiants invalides → erreur générique ; compte suspendu → accès refusé ; 2FA requis pour admin → challenge 2FA

## SYS-011 : Déconnexion utilisateur
**En tant que** système, je veux invalider la session active et journaliser la déconnexion.
**Événement déclencheur** : Clic sur déconnexion ou expiration de session
**Validations** : Session active existante
**Traitements asynchrones** : Invalidation du token, suppression de la session, journalisation audit
**Notifications** : Aucune
**Audits** : `user_logout`
**Gestion des erreurs** : Session déjà expirée → traitement silencieux ; échec invalidation → logs d'erreur

## SYS-012 : Reset de mot de passe
**En tant que** système, je veux permettre la réinitialisation du mot de passe via lien email expirant après 1 heure.
**Événement déclencheur** : Demande de reset mot de passe
**Validations** : Email existe dans la DB, rate limiting (3/h), token sécurisé
**Traitements asynchrones** : Génération token, envoi email avec lien de reset
**Notifications** : Email (lien de réinitialisation)
**Audits** : `password_reset_requested`, `password_reset_completed`
**Gestion des erreurs** : Email inexistant → réponse générique ; token expiré → demande de nouveau ; token invalide → rejet

## SYS-013 : Upload document KYC
**En tant que** système, je veux valider et stocker temporairement les documents KYC (JPG, PNG, PDF, max 10MB) avant examen administratif.
**Événement déclencheur** : Soumission du formulaire KYC
**Validations** : Format fichier, taille max 10MB, type MIME, unicité membre (pas de double soumission)
**Traitements asynchrones** : Stockage temporaire, mise en file pour examen
**Notifications** : In-app (accusé de réception)
**Audits** : `kyc_uploaded`
**Gestion des erreurs** : Format invalide → rejet explicite ; taille dépassée → erreur explicite ; échec stockage → rollback transaction

## SYS-014 : Approval KYC
**En tant que** système, je veux enregistrer l'approbation KYC par un administrateur, mettre à jour le statut membre, déclencher le nettoyage des fichiers et notifier le membre.
**Événement déclencheur** : Action admin "Approve" sur soumission KYC
**Validations** : Rôle admin, soumission KYC en attente, document valide
**Traitements asynchrones** : Mise à jour statut membre, marquage fichiers pour suppression (SYS-003), notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `kyc_approved`
**Gestion des erreurs** : Erreur notification ne bloque pas l'approbation ; fichier déjà supprimé → log warning

## SYS-015 : Rejet KYC
**En tant que** système, je veux enregistrer le rejet KYC, conserver les fichiers pour possible re-soumission, notifier le membre avec raison.
**Événement déclencheur** : Action admin "Reject" sur soumission KYC
**Validations** : Rôle admin, soumission KYC en attente, raison de rejet obligatoire
**Traitements asynchrones** : Mise à jour statut membre, notification membre avec raison
**Notifications** : In-app, Email, Telegram
**Audits** : `kyc_rejected`
**Gestion des erreurs** : Raison de rejet manquante → erreur ; erreur notification → log + retry

## SYS-016 : Demande de correction KYC
**En tant que** système, je veux permettre aux administrateurs de demander une correction KYC et notifier le membre avec les instructions.
**Événement déclencheur** : Action admin "Request Correction"
**Validations** : Rôle admin, soumission KYC en attente, message de correction obligatoire
**Traitements asynchrones** : Mise à jour statut, notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `kyc_correction_requested`
**Gestion des erreurs** : Message vide → erreur ; erreur notification → log + retry

## SYS-017 : Upload vérification Broker
**En tant que** système, je veux valider et stocker temporairement la vidéo de vérification broker (MP4/MOV, max 30MB, max 2 min) et l'ID du broker.
**Événement déclencheur** : Soumission du formulaire de vérification broker
**Validations** : Format vidéo, taille max 30MB, durée max 2 minutes, ID broker non vide
**Traitements asynchrones** : Stockage temporaire, extraction métadonnées vidéo, mise en file pour examen
**Notifications** : In-app (accusé de réception)
**Audits** : `broker_uploaded`
**Gestion des erreurs** : Format vidéo invalide → rejet ; durée dépassée → erreur ; échec stockage → rollback

## SYS-018 : Approval Broker
**En tant que** système, je veux enregistrer l'approbation broker par un administrateur, mettre à jour le statut, déclencher le nettoyage des fichiers et notifier le membre.
**Événement déclencheur** : Action admin "Approve" sur vérification broker
**Validations** : Rôle admin, soumission broker en attente
**Traitements asynchrones** : Mise à jour statut, marquage fichiers pour suppression (SYS-003), notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `broker_approved`
**Gestion des erreurs** : Erreur notification ne bloque pas l'approbation

## SYS-019 : Rejet Broker
**En tant que** système, je veux enregistrer le rejet broker, conserver les fichiers pour re-soumission, notifier le membre avec raison.
**Événement déclencheur** : Action admin "Reject" sur vérification broker
**Validations** : Rôle admin, soumission broker en attente, raison de rejet obligatoire
**Traitements asynchrones** : Mise à jour statut, notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `broker_rejected`
**Gestion des erreurs** : Raison manquante → erreur ; erreur notification → log + retry

## SYS-020 : Demande de correction Broker
**En tant que** système, je veux permettre aux administrateurs de demander une correction broker et notifier le membre.
**Événement déclencheur** : Action admin "Request Correction"
**Validations** : Rôle admin, soumission broker en attente, message obligatoire
**Traitements asynchrones** : Mise à jour statut, notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `broker_correction_requested`
**Gestion des erreurs** : Message vide → erreur ; erreur notification → log + retry

## SYS-021 : Création brouillon signal
**En tant que** système, je veux sauvegarder un signal en mode brouillon sans distribuer ni notifier.
**Événement déclencheur** : Action admin "Save Draft"
**Validations** : Rôle admin, champs obligatoires présents (titre, contenu, catégorie)
**Traitements asynchrones** : Aucun
**Notifications** : Aucune
**Audits** : `signal_draft_created`, `signal_draft_updated`
**Gestion des erreurs** : Champs invalides → erreur explicite ; sauvegarde partielle interrompue → rollback

## SYS-022 : Archivage signal
**En tant que** système, je veux archiver un signal publié pour le retirer de la distribution active tout en préservant l'historique.
**Événement déclencheur** : Action admin "Archive"
**Validations** : Rôle admin, signal en statut Published
**Traitements asynchrones** : Mise à jour statut, suppression des références actives
**Notifications** : In-app pour les admins (optionnel)
**Audits** : `signal_archived`
**Gestion des erreurs** : Signal non publiable → erreur ; échec archivage → rollback + alerte

## SYS-023 : Suppression signal
**En tant que** système, je veux supprimer définitivement un brouillon ou signal archivé avec confirmation.
**Événement déclencheur** : Action admin "Delete"
**Validations** : Rôle admin, signal en Draft ou Archived, confirmation explicite
**Traitements asynchrones** : Suppression DB, suppression médias associés
**Notifications** : In-app pour les admins
**Audits** : `signal_deleted`
**Gestion des erreurs** : Signal publié → rejet ; échec suppression médias → log + retry

## SYS-024 : Gestion abonnement
**En tant que** système, je veux assigner, suspendre, expirer et renouveler les abonnements membres selon les règles métier.
**Événement déclencheur** : Action admin, expiration automatique, paiement confirmé
**Validations** : Plan existe dans catalogue, membre valide, pas d'abonnement actif existant (pour assignation)
**Traitements asynchrones** : Calcul expiration, mise à jour permissions, notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `subscription_assigned`, `subscription_suspended`, `subscription_expired`, `subscription_renewed`
**Gestion des erreurs** : Plan inexistant → erreur ; double abonnement → rejet ; erreur notification → log + retry

## SYS-025 : Suspension membre
**En tant que** système, je veux suspendre un compte membre, révoquer les sessions actives et bloquer l'accès aux signaux.
**Événement déclencheur** : Action admin "Suspend"
**Validations** : Rôle admin, membre existe, membre non déjà suspendu
**Traitements asynchrones** : Révocation sessions, mise à jour statut, suppression accès signaux
**Notifications** : In-app, Email
**Audits** : `account_suspended`
**Gestion des erreurs** : Membre introuvable → erreur ; échec révocation sessions → retry

## SYS-026 : Réactivation membre
**En tant que** système, je veux réactiver un compte membre suspendu et restaurer l'accès aux signaux selon son abonnement.
**Événement déclencheur** : Action admin "Reactivate"
**Validations** : Rôle admin, membre suspendu, abonnement valide
**Traitements asynchrones** : Mise à jour statut, restauration permissions, notification membre
**Notifications** : In-app, Email, Telegram
**Audits** : `account_reactivated`
**Gestion des erreurs** : Abonnement expiré → avertissement admin ; erreur notification → log + retry

## SYS-027 : Suppression membre (soft delete)
**En tant que** système, je veut supprimer un membre via soft delete en préservant les données d'audit et en révoquant toutes les sessions.
**Événement déclencheur** : Action admin "Delete"
**Validations** : Rôle admin (SUPER_ADMIN uniquement), membre existe, confirmation explicite
**Traitements asynchrones** : Soft delete DB, révocation sessions, anonymisation optionnelle
**Notifications** : Aucune
**Audits** : `account_deleted`
**Gestion des erreurs** : Permissions insuffisantes → 403 ; dépendances existantes → avertissement ; rollback si échec critique

## SYS-028 : Vérification des permissions
**En tant que** système, je veux vérifier centralisée les permissions avant chaque action sensible en se basant sur le rôle et l'abonnement.
**Événement déclencheur** : Toute requête sur endpoint protégé
**Validations** : Rôle suffisant, abonnement actif, resource autorisée pour le rôle
**Traitements asynchrones** : Aucun
**Notifications** : Aucune
**Audits** : `permission_denied`
**Gestion des erreurs** : Accès refusé → 403 ; redirection vers unauthorized ; logs de tentative

## SYS-029 : Visibilité des signaux
**En tant que** système, je veux filtrer automatiquement les signaux selon l'abonnement du membre, sans sélection manuelle.
**Événement déclencheur** : Requête de liste de signaux par un membre
**Validations** : Abonnement actif, catégorie de signal incluse dans l'abonnement
**Traitements asynchrones** : Aucun
**Notifications** : Aucune
**Audits** : `signal_visibility_filtered`
**Gestion des erreurs** : Abonnement sans accès → liste vide ; expiration abonnement → masquage progressif

## SYS-030 : Gestion des échecs de notification
**En tant que** système, je veux gérer les échecs de livraison (email/telegram) sans bloquer la publication de signaux ni d'autres opérations critiques.
**Événement déclencheur** : Échec d'envoi de notification
**Validations** : Canal notifié, type de notification, priorité
**Traitements asynchrones** : Retry automatique, file d'attente mortuère, notification admin si échec persistant
**Notifications** : In-app pour admin en cas d'échec critique
**Audits** : `notification_delivery_failed`
**Gestion des erreurs** : Retry 3x avec backoff ; après échec, marquage failed mais succès opération parent ; alerte si taux d'échec > seuil

## SYS-031 : Authentification à deux facteurs (2FA)
**En tant que** système, je veux obliger les administrateurs à utiliser un 2FA lors de la connexion.
**Événement déclencheur** : Connexion d'un utilisateur avec rôle ADMIN ou SUPER_ADMIN
**Validations** : Rôle admin, 2FA activé pour le compte, token TOTP valide
**Traitements asynchrones** : Validation TOTP, génération codes de secours
**Notifications** : Aucune
**Audits** : `admin_2fa_challenge`, `admin_2fa_success`, `admin_2fa_failed`
**Gestion des erreurs** : Token invalide → rejet ; 2FA non activé → blocage avec instruction ; 3 échecs → verrouillage temporaire compte

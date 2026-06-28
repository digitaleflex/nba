# Edge Cases

## EC-001 : Auth - Race condition de session concurrente
**Scénario** : Deux requêtes d'authentification simultanées pour le même utilisateur sous charge de 10 000 utilisateurs.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. Une seule session active est créée ; la seconde requête reçoit le jeton existant ou est rejetée proprement sans duplication.
**Référence** : BUSINESS_RULES.md#authentication-rules

## EC-002 : Auth - Double submit du formulaire de connexion
**Scénario** : L'utilisateur clique deux fois rapidement sur "Se connecter" pendant un pic de trafic.
**Probabilité** : Élevée
**Impact** : Moyen
**Attendu** : 
1. Le middleware d'idempotence bloque la seconde soumission et renvoie la réponse de la première sans créer de session dupliquée.
**Référence** : BUSINESS_RULES.md#authentication-rules

## EC-003 : Auth - Timeout MFA sous charge
**Scénario** : L'utilisateur valide le code MFA après l'expiration du délai (ex. 5 min) pendant un pic de trafic.
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. La tentative est rejetée avec un message "Code expiré" ; l'utilisateur doit redémarrer le flux sans être connecté.
**Référence** : BUSINESS_RULES.md#authentication-rules

## EC-004 : KYC - Upload interrompu à mi-transfert
**Scénario** : Connexion perdue pendant le téléversement d'un document KYC (PDF 10 MB) sous forte charge.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. Le fichier partiel est supprimé ; l'utilisateur peut relancer l'upload sans état corrompu.
**Référence** : BUSINESS_RULES.md#kyc-rules

## EC-005 : KYC - Fichier corrompu passe la validation de format
**Scénario** : Un fichier JPG avec extension .jpg mais contenu corrompu (header invalide) est téléversé.
**Probabilité** : Faible
**Impact** : Moyen
**Attendu** : 
1. La validation côté serveur détecte la corruption et rejette le fichier avec une erreur claire.
**Référence** : BUSINESS_RULES.md#kyc-rules

## EC-006 : KYC - Re-soumission après rejet avec ancien identifiant
**Scénario** : L'utilisateur re-soumet le même document après rejet KYC sans changer de fichier.
**Probabilité** : Faible
**Impact** : Faible
**Attendu** : 
1. Le système accepte la re-soumission, crée une nouvelle version, et enregistre l'action en audit log.
**Référence** : BUSINESS_RULES.md#kyc-rules

## EC-007 : Broker - Vidéo dépasse la durée maximale
**Scénario** : Vidéo MOV de 29 Mo (dans la limite) mais durée de 2 min 05 s.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. L'upload est rejeté côté serveur avec "Durée maximale dépassée (2 min)" avant stockage permanent.
**Référence** : BUSINESS_RULES.md#broker-verification-rules

## EC-008 : Broker - Format vidéo non supporté
**Scénario** : L'utilisateur upload un fichier .avi alors que seuls MP4 et MOV sont acceptés.
**Probabilité** : Moyenne
**Impact** : Moyen
**Attendu** : 
1. Le fichier est rejeté immédiatement avec la liste des formats autorisés.
**Référence** : BUSINESS_RULES.md#broker-verification-rules

## EC-009 : Broker - Compte fermé pendant vérification
**Scénario** : Le broker ferme le compte du membre entre la soumission et la validation par l'admin.
**Probabilité** : Très faible
**Impact** : Critique
**Attendu** : 
1. L'admin voit un indicateur "Compte fermé" ; la validation est bloquée jusqu'à mise à jour du statut broker.
**Référence** : BUSINESS_RULES.md#broker-verification-rules

## EC-010 : Signals - Publication pendant fenêtre de maintenance
**Scénario** : Un admin tente de publier un signal alors que le mode maintenance est activé (ex. migration DB).
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. La publication est rejetée avec "Service temporairement indisponible" ; le brouillon reste en statut DRAFT.
**Référence** : BUSINESS_RULES.md#signal-publication-rules

## EC-011 : Signals - Double publication simultanée
**Scénario** : Deux admins cliquent sur "Publier" pour le même signal dans la même seconde.
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. Un seul enregistrement PUBLISHED est créé ; le second est ignoré ou déclenche un conflit résolu proprement.
**Référence** : BUSINESS_RULES.md#signal-publication-rules

## EC-012 : Signals - 10 000 signaux non lus pour un membre
**Scénario** : Un membre a accumulé 10 000 signaux non lus après une longue absence.
**Probabilité** : Moyenne
**Impact** : Moyen
**Attendu** : 
1. La pagination côté API renvoie les résultats par lots sans timeout ; le compteur "non lu" est mis à jour de manière asynchrone.
**Référence** : BUSINESS_RULES.md#signal-visibility-rules

## EC-013 : Signals - Signal publié sans abonné valide
**Scénario** : Un signal Forex est publié alors qu'aucun membre n'a d'abonnement Forex actif.
**Probabilité** : Faible
**Impact** : Faible
**Attendu** : 
1. La publication réussit ; aucune notification n'est envoyée ; le signal est archivé après la durée de vie configurée.
**Référence** : BUSINESS_RULES.md#signal-publication-rules

## EC-014 : Notifications - Queue BullMQ saturée par un bulk de 10k jobs
**Scénario** : Un bulk de 10 000 notifications est injecté dans la queue alors que les workers sont saturés.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. Les jobs sont persistés dans Redis ; les workers traitent par lots sans perte ; l'interface reste réactive.
**Référence** : BUSINESS_RULES.md#performance-rules

## EC-015 : Notifications - Rate limit Resend (429)
**Scénario** : Le fournisseur d'email Resend retourne 429 Too Many Requests lors d'un envoi massif.
**Probabilité** : Élevée
**Impact** : Élevé
**Attendu** : 
1. Le worker applique un backoff exponentiel et retente ; l'échec temporaire ne bloque pas la publication du signal.
**Référence** : BUSINESS_RULES.md#notification-rules

## EC-016 : Notifications - Webhook Telegram indisponible
**Scénario** : Le bot Telegram est supprimé ou le webhook expire pendant une campagne de notification.
**Probabilité** : Faible
**Impact** : Moyen
**Attendu** : 
1. Les notifications Telegram sont marquées FAILED ; les canaux Email et In-App continuent de fonctionner ; la plateforme reste opérationnelle.
**Référence** : BUSINESS_RULES.md#platform-rules

## EC-017 : Notifications - Déduplication après retry réseau
**Scénario** : Un réseau capricieux provoque un double acquittement BullMQ, causant un doublon de notification email.
**Probabilité** : Faible
**Impact** : Moyen
**Attendu** : 
1. Une clé d'idempotence basée sur (eventId, channel, recipient) empêche l'envoi en double.
**Référence** : BUSINESS_RULES.md#notification-rules

## EC-018 : Admin - Deux admins valident le même KYC simultanément
**Scénario** : Deux agents KYC approuvent le même document dans la même fenêtre de temps.
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. Un verrou sur la validation KYC garantit qu'une seule approbation est enregistrée ; la seconde reçoit "Déjà traité".
**Référence** : BUSINESS_RULES.md#administration-rules

## EC-019 : Admin - Suppression et restauration soft-delete d'un admin
**Scénario** : Un SUPER_ADMIN supprime (soft-delete) un autre ADMIN, puis tente de le restaurer.
**Probabilité** : Très faible
**Impact** : Critique
**Attendu** : 
1. La suppression marque deletedAt ; la restauration est autorisée uniquement par SUPER_ADMIN ; les permissions sont réattribuées proprement.
**Référence** : BUSINESS_RULES.md#administration-rules

## EC-020 : Admin - Accès au panneau admin sans rôle ADMIN
**Scénario** : Un membre avec rôle MEMBER forge l'URL pour accéder au panneau d'administration.
**Probabilité** : Moyenne
**Impact** : Critique
**Attendu** : 
1. L'autorisation centralisée rejette avec 403 ; l'événement est enregistré en audit log.
**Référence** : BUSINESS_RULES.md#role-rules

## EC-021 : Subscriptions - Changement de plan pendant session active
**Scénario** : Un membre passe de "Signals X Forex" à "Signals X Pro Forex" alors que sa session est en cours.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. Les permissions sont rechargées dynamiquement à la prochaine requête ; l'ancien plan est révoqué sans coupure.
**Référence** : BUSINESS_RULES.md#subscription-rules

## EC-022 : Subscriptions - Expiration pendant usage actif
**Scénario** : L'abonnement d'un membre expire alors qu'il consulte un signal en temps réel.
**Probabilité** : Moyenne
**Impact** : Élevé
**Attendu** : 
1. L'accès au signal est révoqué à la requête suivante ; un message "Abonnement expiré" s'affiche sans erreur serveur.
**Référence** : BUSINESS_RULES.md#subscription-rules

## EC-023 : Auth - Rejeu de refresh token après déconnexion
**Scénario** : Un token de refresh est rejoué après que l'utilisateur a cliqué sur "Déconnexion" sur un autre appareil.
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. Le token est rejeté (révoqué) ; une nouvelle authentification est requise ; l'événement est enregistré en audit log.
**Référence** : BUSINESS_RULES.md#authentication-rules

## EC-024 : KYC - Deux uploads simultanés du même document
**Scénario** : L'utilisateur téléverse le même fichier KYC depuis deux onglets en même temps.
**Probabilité** : Faible
**Impact** : Moyen
**Attendu** : 
1. Un verrou sur l'utilisateur empêche le traitement parallèle ; un seul document est retenu et traité.
**Référence** : BUSINESS_RULES.md#kyc-rules

## EC-025 : Subscriptions - Downgrade avec crédit prorata non calculé
**Scénario** : L'utilisateur downgrade en milieu de période ; le crédit au prorata n'est pas appliqué à la nouvelle facture.
**Probabilité** : Faible
**Impact** : Élevé
**Attendu** : 
1. Le calcul de prorata est atomique ; le crédit est appliqué immédiatement sur la nouvelle facture sans délai.
**Référence** : BUSINESS_RULES.md#subscription-rules

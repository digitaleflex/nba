# Acceptance Criteria - Administration Module

## ACR-001 : Accès tableau de bord admin
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given un administrateur authentifié avec rôle ADMIN ou SUPER_ADMIN
When il accède à l'URL /admin/dashboard
Then le tableau de bord s'affiche avec les métriques dans les 2 secondes
And les demandes d'accès en attente sont listées avec statut "pending"
But une erreur 403 est retournée si l'utilisateur n'a pas les permissions
```

**Données de test** : Input : authToken valide ADMIN, Output : dashboard JSON avec totalMembers, pendingKYC, pendingBroker, activeSubscriptions, signalCount
**Méthode de vérif** : Automatisé

---

## ACR-002 : Liste demandes d'accès paginée
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given 25 demandes d'accès en attente dans la base de données
When l'administrateur demande la page 2 avec une pagination de 20 items
Then 5 demandes sont retournées avec les métadonnées pagination (page: 2, totalPages: 2, totalItems: 25)
But une erreur 404 est retournée si la page demandée n'existe pas
```

**Données de test** : Input : page=2&limit=20, Output : tableau avec 5 éléments + metadata
**Méthode de vérif** : Automatisé

---

## ACR-003 : Validation KYC document approuvé
**Story associée** : ADM-002
**Critère Given / When / Then** :

```gherkin
Given un document KYC en statut "pending" avec ID 12345
And un administrateur authentifié
When il soumettre l'action "approve" avec le formulaire /admin/kyc/12345/approve
Then le statut du document passe à "approved"
And une entrée est créée dans l'audit log avec action "KYC_VALIDATION" et statut "approved"
And une notification "KYC_APPROVED" est générée pour le membre
But une erreur 400 est retournée si le document n'existe pas
```

**Données de test** : Input : { action: "approve", documentId: 12345 }, Output : { status: "approved", auditCreated: true, notificationSent: true }
**Méthode de vérif** : Automatisé

---

## ACR-004 : Validation KYC document rejeté
**Story associée** : ADM-002
**Critère Given / When / Then** :

```gherkin
Given un document KYC en statut "pending" avec ID 12346
And un administrateur authentifié
When il soumettre l'action "reject" avec le motif "Document illisible"
Then le statut du document passe à "rejected"
And le motif de rejet est enregistré dans le champ rejectionReason
And une notification "KYC_REJECTED" est générée avec le motif
But une erreur 400 si le motif de rejet est vide ou > 500 caractères
```

**Données de test** : Input : { action: "reject", reason: "Document illisible" }, Output : { status: "rejected", reasonStored: true }
**Méthode de vérif** : Automatisé

---

## ACR-005 : Validation broker vidéo approuvée
**Story associée** : ADM-003
**Critère Given / When / Then** :

```gherkin
Given une soumission broker en statut "pending" avec ID 56789
And une vidéo de vérification MP4 de 25 Mo
And un administrateur authentifié
When il valide la soumission via /admin/broker/56789/approve
Then le statut passe à "approved"
And la date de vérification est enregistrée
And une entrée audit log est créée avec action "BROKER_VALIDATION"
But une erreur 413 si la vidéo dépasse 30 Mo
```

**Données de test** : Input : video size 25MB, format MP4, Output : status "approved"
**Méthode de vérif** : Automatisé

---

## ACR-006 : Validation broker vidéo rejetée
**Story associée** : ADM-003
**Critère Given / When / Then** :

```gherkin
Given une soumission broker en statut "pending" avec ID 56789
And un administrateur authentifié
When il rejette la soumission avec le motif "Vidéo hors durée maximale (3min au lieu de 2min)"
Then le statut passe à "rejected"
And le motif est stocké dans rejectionReason
And le membre peut resoumettre une nouvelle vérification
But une erreur 422 si le formulaire de rejet est soumis sans motif
```

**Données de test** : Input : { reason: "Vidéo hors durée maximale" }, Output : { status: "rejected", reasonRequired: true }
**Méthode de vérif** : Automatisé

---

## ACR-007 : Approbation demande accès groupe
**Story associée** : ADM-004
**Critère Given / When / Then** :

```gherkin
Given une demande d'accès à un groupe en statut "pending" avec ID 99999
And un administrateur authentifié
When il approuve la demande via /admin/access/99999/approve
Then le membre obtient l'accès au groupe
And le statut passe à "approved"
And une notification "ACCESS_APPROVED" est envoyée
But une erreur 409 si l'accès a déjà été approuvé
```

**Données de test** : Input : accessRequestId: 99999, Output : access granted + notification
**Méthode de vérif** : Automatisé

---

## ACR-008 : Rejet demande accès groupe
**Story associée** : ADM-004
**Critère Given / When / Then** :

```gherkin
Given une demande d'accès à un groupe en statut "pending" avec ID 99998
And un administrateur authentifié
When il rejette la demande avec le motif "Non eligible"
Then le statut passe à "rejected"
And le membre est notifié du rejet
But une erreur 400 si le motif contient des mots interdits
```

**Données de test** : Input : { reason: "Non eligible" }, Output : status "rejected" + notification
**Méthode de vérif** : Automatisé

---

## ACR-009 : Création signal trading
**Story associée** : ADM-005
**Critère Given / When / Then** :

```gherkin
Given un administrateur authentifié
When il crée un signal avec : title="EUR/USD Buy", category="Forex", entryPrice=1.0850, takeProfit1=1.0900, takeProfit2=1.0950, stopLoss=1.0800, riskLevel="HIGH"
Then le signal est créé avec statut "draft"
And l'entrée est enregistrée avec createdAt et updatedAt
But une erreur 400 si le titre est vide ou > 100 caractères
```

**Données de test** : Input : signal avec tous les champs requis, Output : signal ID créé + statut "draft"
**Méthode de vérif** : Automatisé

---

## ACR-010 : Ajout images à signal
**Story associée** : ADM-005
**Critère Given / When / Then** :

```gherkin
Given un signal en statut "draft" avec ID 11111
And 3 images JPG de moins de 5 Mo chacune
When l'administrateur upload les images via /admin/signals/11111/attachments
Then les images sont attachées au signal
And les URLs sont stockées dans le champ attachments
But une erreur 413 si une image dépasse 10 Mo
```

**Données de test** : Input : 3 images JPG < 5MB, Output : attachments array avec 3 URLs
**Méthode de vérif** : Automatisé

---

## ACR-011 : Publication immédiate signal
**Story associée** : ADM-006
**Critère Given / When / Then** :

```gherkin
Given un signal en statut "draft" avec ID 11111
And un administrateur authentifié
When il publie le signal immédiatement via /admin/signals/11111/publish
Then le statut passe à "published"
And publicationDate est définie à l'instant T
And les notifications sont mises en file d'attente de manière asynchrone
But une erreur 409 si le signal est déjà publié
```

**Données de test** : Input : signalId: 11111, publishMode: "immediate", Output : status "published" + date définie
**Méthode de vérif** : Automatisé

---

## ACR-012 : Programmation signal
**Story associée** : ADM-006
**Critère Given / When / Then** :

```gherkin
Given un signal en statut "draft" avec ID 11112
And un administrateur authentifié
When il programme la publication pour le 2026-07-15T10:00:00Z
Then le statut passe à "scheduled"
And scheduledFor est défini à la date demandée
But une erreur 400 si la date est dans le passé
```

**Données de test** : Input : publishAt: "2026-07-15T10:00:00Z", Output : status "scheduled" + scheduledFor
**Méthode de vérif** : Automatisé

---

## ACR-013 : Édition signal existant
**Story associée** : ADM-007
**Critère Given / When / Then** :

```gherkin
Given un signal publié avec ID 11111
And version 1 existante
When un administrateur modifie le titre à "EUR/USD Buy - Updated"
Then une nouvelle version est créée (version 2)
And le signal original reste accessible en version 1
And updatedAt est mis à jour
But une erreur 404 si le signal n'existe pas
```

**Données de test** : Input : { title: "EUR/USD Buy - Updated" }, Output : version incrémentée + updatedAt
**Méthode de vérif** : Automatisé

---

## ACR-014 : Versioning signal archivé
**Story associée** : ADM-007
**Critère Given / When / Then** :

```gherkin
Given un signal avec 3 versions
When un administrateur consulte l'historique
Then toutes les versions sont listées avec timestamps
And le contenu de chaque version est consultable
But les versions ne peuvent pas être effacées
```

**Données de test** : Input : signalId: 11111, Output : array versions avec version, createdAt, content
**Méthode de vérif** : Automatisé

---

## ACR-015 : Création template signal
**Story associée** : ADM-008
**Critère Given / When / Then** :

```gherkin
Given un administrateur authentifié
When il crée un template avec title="Template Forex Long", structure={title, entry, TP1, TP2, SL, risk}
Then le template est sauvegardé avec statut "active"
And peut être réutilisé pour créer de nouveaux signaux
But une erreur 400 si le nom du template est vide
```

**Données de test** : Input : templateName: "Template Forex Long", Output : templateId créé
**Méthode de vérif** : Automatisé

---

## ACR-016 : Utilisation template pour signal
**Story associée** : ADM-008
**Critère Given / When / Then** :

```gherkin
Given un template existant avec ID 22222
And un administrateur authentifié
When il crée un signal depuis ce template
Then le signal est pré-rempli avec la structure du template
And le templateId est lié au signal créé
But une erreur 404 si le template n'existe pas
```

**Données de test** : Input : templateId: 22222, Output : signal avec champs pré-remplis
**Méthode de vérif** : Automatisé

---

## ACR-017 : Statistiques vues signal
**Story associée** : ADM-009
**Critère Given / When / Then** :

```gherkin
Given un signal publié avec ID 11111
And 150 membres uniques ayant vu le signal
When un administrateur consulte les stats via /admin/signals/11111/stats
Then totalViews = 250 et uniqueMembers = 150 sont retournés
And un graphique de tendance sur 30 jours est disponible
But une erreur 404 si le signal n'existe pas
```

**Données de test** : Input : signalId: 11111, Output : { totalViews: 250, uniqueMembers: 150 }
**Méthode de vérif** : Automatisé

---

## ACR-018 : Statistiques temps réel
**Story associée** : ADM-009
**Critère Given / When / Then** :

```gherkin
Given un signal publié avec ID 11111
When 50 nouveaux membres consultent le signal en 1 minute
Then les stats sont mises à jour dans les 30 secondes
And lastUpdated est actualisé
But les stats ne sont pas disponibles si le signal est en draft
```

**Données de test** : Input : 50 vues en 60s, Output : stats actualisées < 30s
**Méthode de vérif** : Automatisé

---

## ACR-019 : Consultation journal d'audit
**Story associée** : ADM-010
**Critère Given / When / Then** :

```gherkin
Given 100 événements d'audit dans les 30 derniers jours
And un administrateur authentifié
When il accède au journal via /admin/audit
Then les 20 premiers événements sont affichés
And chaque entrée contient: timestamp, actor, action, target, ipAddress
But les entrées sont en lecture seule
```

**Données de test** : Input : page=1&limit=20, Output : 20 entrées audit avec champs requis
**Méthode de vérif** : Automatisé

---

## ACR-020 : Filtre journal d'audit
**Story associée** : ADM-010
**Critère Given / When / Then** :

```gherkin
Given 100 événements d'audit avec 25 "KYC_VALIDATION"
When un administrateur filtre par action "KYC_VALIDATION" et date "2026-06"
Then 25 événements sont retournés
And les filtres sont appliqués avec un temps de réponse < 2s
But une erreur 400 si le format de date est invalide
```

**Données de test** : Input : filter[action]=KYC_VALIDATION&filter[date]=2026-06, Output : 25 entrées filtrées
**Méthode de vérif** : Automatisé

---

## ACR-021 : Authentification requise admin
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given un utilisateur non authentifié
When il tente d'accéder à /admin/dashboard
Then une erreur 401 Unauthorized est retournée
And aucune donnée sensible n'est exposée
```

**Données de test** : Input : aucune authentification, Output : 401
**Méthode de vérif** : Automatisé

---

## ACR-022 : Autorisation rôle requise
**Story associée** : ADM-002
**Critère Given / When / Then** :

```gherkin
Given un utilisateur authentifié avec rôle MEMBER
When il tente d'accéder à /admin/kyc
Then une erreur 403 Forbidden est retournée
And un message "Insufficient permissions" est affiché
```

**Données de test** : Input : authToken MEMBER, Output : 403
**Méthode de vérif** : Automatisé

---

## ACR-023 : Upload document KYC format invalide
**Story associée** : ADM-002
**Critère Given / When / Then** :

```gherkin
Given un document GIF de 5 Mo
When un membre tente de l'uploader via /kyc/upload
Then une erreur 415 Unsupported Media Type est retournée
And le message indique "Formats acceptés: JPG, PNG, PDF"
But le document n'est pas stocké
```

**Données de test** : Input : fichier GIF, Output : 415 + message d'erreur
**Méthode de vérif** : Automatisé

---

## ACR-024 : Upload document KYC taille dépassée
**Story associée** : ADM-002
**Critère Given / When / Then** :

```gherkin
Given un document JPG de 15 Mo
When un membre tente de l'uploader
Then une erreur 413 Payload Too Large est retournée
And le message indique "Taille maximum: 10 Mo"
But le document n'est pas stocké
```

**Données de test** : Input : 15MB JPG, Output : 413
**Méthode de vérif** : Automatisé

---

## ACR-025 : Upload vidéo broker durée dépassée
**Story associée** : ADM-003
**Critère Given / When / Then** :

```gherkin
Given une vidéo MOV de 3 minutes
When un membre tente de l'uploader
Then une erreur 400 Bad Request est retournée
And le message indique "Durée maximum: 2 minutes"
But la vidéo n'est pas stockée
```

**Données de test** : Input : vidéo 180s, Output : 400 + message durée
**Méthode de vérif** : Automatisé

---

## ACR-026 : Publication signal sans KYC
**Story associée** : ADM-006
**Critère Given / When / Then** :

```gherkin
Given un signal avec statut "draft"
And le membre destinataire n'a pas de KYC approuvé
When le signal est publié
Then les notifications sont envoyées uniquement aux membres KYC approuvés
And le signal reste accessible pour les futurs membres vérifiés
But les membres non KYC validés n'ont pas accès au signal
```

**Données de test** : Input : signal publié, Output : notifications envoyées à 150/200 membres (seulement KYC validés)
**Méthode de vérif** : Automatisé

---

## ACR-027 : Recherche membre admin
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given 500 membres dans la base de données
And un administrateur authentifié
When il recherche "john@example.com"
Then le membre correspondant est retourné en < 2 secondes
And les résultats incluent email, nom, statut KYC
But aucune donnée sensible (mot de passe) n'est exposée
```

**Données de test** : Input : q=john@example.com, Output : membre trouvé < 2s
**Méthode de vérif** : Automatisé

---

## ACR-028 : Suspension membre
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given un membre actif avec ID 33333
And un administrateur authentifié
When il suspend le membre avec motif "Violation des règles"
Then le statut passe à "suspended"
And une entrée audit est créée avec action "ACCOUNT_SUSPENSION"
And le membre ne peut plus accéder à la plateforme
```

**Données de test** : Input : memberId: 33333, action: "suspend", Output : status "suspended"
**Méthode de vérif** : Automatisé

---

## ACR-029 : Révocation suspension membre
**Story associée** : ADM-001
**Critère Given / When / Then** :

```gherkin
Given un membre suspendu avec ID 33333
And un administrateur authentifié
When il réactive le membre
Then le statut passe à "active"
And une entrée audit est créée avec action "ACCOUNT_REACTIVATION"
And le membre retrouve l'accès immédiatement
```

**Données de test** : Input : memberId: 33333, action: "reactivate", Output : status "active"
**Méthode de vérif** : Automatisé

---

## ACR-030 : Suppression signal draft
**Story associée** : ADM-007
**Critère Given / When / Then** :

```gherkin
Given un signal en statut "draft" avec ID 11113
And un administrateur authentifié
When il supprime le signal via /admin/signals/11113
Then le signal est marqué "deleted" (soft delete)
And n'apparaît plus dans les listes
But aucune suppression définitive de la base
```

**Données de test** : Input : signalId: 11113, Output : status "deleted"
**Méthode de vérif** : Automatisé

---

## ACR-031 : Archivage signal publié
**Story associée** : ADM-007
**Critère Given / When / Then** :

```gherkin
Given un signal en statut "published" avec ID 11114
And expirationDate passée
When un administrateur archive le signal
Then le statut passe à "archived"
And le signal reste accessible en lecture seule
But ne peut plus être modifié
```

**Données de test** : Input : signalId: 11114, action: "archive", Output : status "archived"
**Méthode de vérif** : Automatisé

---

## ACR-032 : Duplication signal
**Story associée** : ADM-007
**Critère Given / When / Then** :

```gherkin
Given un signal publié avec ID 11115
And un administrateur authentifié
When il duplique le signal via /admin/signals/11115/duplicate
Then un nouveau signal est créé avec statut "draft"
And le contenu est copié à l'identique
And le titre est suffixé de " (Copy)"
```

**Données de test** : Input : signalId: 11115, Output : nouveau signalId avec statut "draft"
**Méthode de vérif** : Automatisé

---

## ACR-033 : Assignation abonnement admin
**Story associée** : ADM-004
**Critère Given / When / Then** :

```gherkin
Given un membre avec ID 44444
And un plan d'abonnement "Pro Forex"
And un administrateur authentifié
When il assigne le plan via /admin/members/44444/subscription
Then le membre a un abonnement actif "Pro Forex"
And subscriptionStartDate est définie à maintenant
And une notification "SUBSCRIPTION_UPDATED" est envoyée
But une erreur 400 si le plan n'existe pas
```

**Données de test** : Input : { planId: "pro-forex" }, Output : subscription active + notification
**Méthode de vérif** : Automatisé

---

## ACR-034 : Expiration abonnement forcée
**Story associée** : ADM-004
**Critère Given / When / Then** :

```gherkin
Given un membre avec abonnement actif ID 44445
And un administrateur authentifié
When il expire l'abonnement via /admin/members/44445/subscription/expire
Then subscriptionEndDate est définie à maintenant
And le statut passe à "expired"
And le membre perd l'accès aux signaux
But une notification "SUBSCRIPTION_EXPIRED" est envoyée
```

**Données de test** : Input : memberId: 44445, action: "expire", Output : status "expired"
**Méthode de vérif** : Automatisé

---

## ACR-035 : Export journal d'audit CSV
**Story associée** : ADM-010
**Critère Given / When / Then** :

```gherkin
Given 300 événements d'audit sur le mois de Juin 2026
And un administrateur authentifié
When il exporte via /admin/audit/export?format=csv&month=2026-06
Then un fichier CSV de moins de 10 Mo est généré
And téléchargé dans les 5 secondes
And contient toutes les colonnes: timestamp, actor, action, target, ipAddress
But une erreur 400 si le mois est invalide
```

**Données de test** : Input : format=csv&month=2026-06, Output : fichier CSV < 10MB téléchargé < 5s
**Méthode de vérif** : Automatisé
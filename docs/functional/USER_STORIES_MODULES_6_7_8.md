# Module 6 : Vérification Broker (US-BRK-001 → US-BRK-025)

## US-BRK-001 — Connexion du compte broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Connexion Broker |
| **Titre** | Connecter son compte broker via API |
| **Description** | En tant que **membre**, je souhaite **connecter mon compte de courtage via API** afin de **lier mon broker à la plateforme NBA** |
| **Valeur métier** | Activation du compte, vérification des fonds, conformité réglementaire |
| **Préconditions** | `onboardingStatus = BROKER_PENDING` ; KYC approuvé |
| **Scénario principal** | 1. L'utilisateur sélectionne son broker dans la liste 2. Il saisit ses identifiants API (clé, secret) 3. Le système teste la connexion 4. La connexion est établie et le statut passe à `BROKER_CONNECTED` |
| **Exceptions** | 1. API key invalide → message d'erreur explicite 2. Broker temporairement indisponible → réessayer plus tard 3. Compte déjà lié → redirection vers modification |
| **Règles métier** | BR-BRK-001 : Un seul compte broker par membre BR-BRK-002 : La connexion API doit être testée avant validation |
| **Données** | `BrokerConnection` (brokerType, apiKeyHash, status, connectedAt), `User.onboardingStatus` |
| **Sécurité** | Chiffrement des API keys (AES-256) ; Tokenization ; Stockage sécurisé hors base |
| **Critères d'acceptation** | Given un membre en BROKER_PENDING, When il connecte son broker avec des identifiants valides, Then la connexion est établie et le statut passe à BROKER_CONNECTED |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-002 — Liste des brokers supportés

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Connexion Broker |
| **Titre** | Voir la liste des brokers disponibles |
| **Description** | En tant que **membre**, je souhaite **voir la liste des brokers supportés** afin de **savoir si le mien est compatible** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-003 — Saisie des identifiants API

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Connexion Broker |
| **Titre** | Saisir clé API et secret |
| **Description** | En tant que **membre**, je souhaite **saisir ma clé API et mon secret** afin de **configurer la connexion** |
| **Priorité** | Must |
| **Complexité** | S |

## US-BRK-004 — Test de connexion automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Connexion Broker |
| **Titre** | Tester la connexion API |
| **Description** | En tant que **système**, je souhaite **tester la connexion au broker avant de la valider** afin de **garantir que les identifiants sont corrects** |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-005 — Modification des identifiants broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Connexion Broker |
| **Titre** | Modifier ses identifiants broker |
| **Description** | En tant que **membre**, je souhaite **modifier mes identifiants API broker** afin de **les mettre à jour si nécessaire** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-006 — Validation des identifiants API

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Validation |
| **Titre** | Valider le format des identifiants API |
| **Description** | En tant que **système**, je souhaite **valider le format des identifiants API saisis** afin de **prévenir les erreurs de saisie** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-007 — Vérification de solde minimum

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Validation |
| **Titre** | Vérifier le solde minimum requis |
| **Description** | En tant que **système**, je souhaite **vérifier que le compte broker a un solde supérieur au minimum requis** afin de **garantir la solvabilité du membre** |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-008 — Validation du pays du broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Validation |
| **Titre** | Valider la juridiction du broker |
| **Description** | En tant que **système**, je souhaite **valider que le broker est basé dans une juridiction autorisée** afin de **respecter les contraintes réglementaires** |
| **Priorité** | Must |
| **Complexité** | S |

## US-BRK-009 — Détection de compte broker existant

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Validation |
| **Titre** | Détecter si un broker est déjà lié |
| **Description** | En tant que **système**, je souhaite **détecter si le compte broker est déjà lié à un autre membre** afin de **prévenir les doublons** |
| **Priorité** | Should |
| **Complexité** | M |

## US-BRK-010 — Expiration de la tentative de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Validation |
| **Titre** | Gérer l'expiration de session API |
| **Description** | En tant que **système**, je souhaite **détecter et signaler une expiration de token API** afin de **demander une reconnexion** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-011 — Récupération des soldes broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | API |
| **Titre** | Récupérer les soldes du compte broker |
| **Description** | En tant que **système**, je souhaite **récupérer les soldes du compte broker via API** afin de **les afficher sur la plateforme** |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-012 — Récupération du portfolio broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | API |
| **Titre** | Récupérer le portfolio broker |
| **Description** | En tant que **système**, je souhaite **récupérer les positions et actifs du compte broker** afin de **fournir une vue consolidée** |
| **Priorité** | Must |
| **Complexité** | L |

## US-BRK-013 — Synchronisation périodique des données

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | API |
| **Titre** | Synchroniser automatiquement les données |
| **Description** | En tant que **système**, je souhaite **synchroniser périodiquement les données du broker** afin de **maintenir les informations à jour** |
| **Priorité** | Should |
| **Complexité** | M |

## US-BRK-014 — Gestion des erreurs API broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | API |
| **Titre** | Gérer les erreurs de l'API broker |
| **Description** | En tant que **système**, je souhaite **capturer et gérer les erreurs de l'API broker** afin de **notifier le membre en cas de problème** |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-015 — Déconnexion du broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | API |
| **Titre** | Déconnecter le compte broker |
| **Description** | En tant que **membre**, je souhaite **déconnecter mon compte broker** afin de **mettre fin à la liaison** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-016 — Chiffrement des identifiants API

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Chiffrer les clés API stockées |
| **Description** | En tant que **système**, je souhaite **chiffrer les clés API des brokers au repos** afin de **protéger les accès aux comptes** |
| **Priorité** | Must |
| **Complexité** | M |

## US-BRK-017 — Rotation des tokens API

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Gérer la rotation des tokens API |
| **Description** | En tant que **système**, je souhaite **gérer la rotation automatique des tokens API** afin de **renouveler les accès expirés** |
| **Priorité** | Should |
| **Complexité** | M |

## US-BRK-018 — Journalisation des accès broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Journaliser les accès aux données broker |
| **Description** | En tant que **système**, je souhaite **journaliser tous les accès aux données broker** afin de **tracer les actions suspectes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-BRK-019 — Masquage des identifiants dans l'UI

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Masquer les identifiants affichés |
| **Description** | En tant que **système**, je souhaite **masquer les clés API dans l'interface** afin de **ne pas exposer les secrets** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-020 — Révocation d'accès broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Révoquer l'accès au broker |
| **Description** | En tant que **système**, je souhaite **révoquer l'accès au broker en cas d'activité suspecte** afin de **protéger le compte du membre** |
| **Priorité** | Should |
| **Complexité** | M |

## US-BRK-021 — Indicateur de statut broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Voir le statut de connexion broker |
| **Description** | En tant que **membre**, je souhaite **voir le statut de ma connexion broker (connecté, expiré, erreur)** afin de **savoir si tout fonctionne** |
| **Priorité** | Must |
| **Complexité** | S |

## US-BRK-022 — Notification de statut broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Recevoir une notification de statut |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification si la connexion broker est perdue** afin de **réagir rapidement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-023 — Page d'aide connexion broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Accéder à l'aide pour connecter son broker |
| **Description** | En tant que **membre**, je souhaite **consulter un guide pas-à-pas pour connecter mon broker** afin de **faciliter la configuration** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-024 — Test de connexion visible

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Voir le résultat du test de connexion |
| **Description** | En tant que **membre**, je souhaite **voir le résultat du test de connexion (succès/échec)** afin de **savoir si la configuration est correcte** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-025 — Réassurance sécurité broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Voir les mesures de sécurité appliquées |
| **Description** | En tant que **membre**, je souhaite **voir un récapitulatif des mesures de sécurité (chiffrement, masquage)** afin de **connecter mon broker en confiance** |
| **Priorité** | Could |
| **Complexité** | S |

---

# Module 7 : Gestion des accès (US-ACC-001 → US-ACC-020)

## US-ACC-001 — Demande d'accès aux signaux premium

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Demande d'accès |
| **Titre** | Soumettre une demande d'accès aux signaux |
| **Description** | En tant que **membre vérifié**, je souhaite **soumettre une demande d'accès aux signaux premium** afin de **recevoir les recommandations de trading** |
| **Valeur métier** | Monétisation des signaux, engagement des membres vérifiés |
| **Préconditions** | `kycStatus = APPROVED` ; `brokerStatus = CONNECTED` |
| **Scénario principal** | 1. L'utilisateur clique sur "Demander l'accès" 2. Il sélectionne un niveau d'abonnement 3. Il confirme la demande 4. Le système crée une `AccessRequest` avec status `PENDING` |
| **Exceptions** | 1. KYC non approuvé → redirection vers KYC 2. Broker non connecté → redirection vers connexion broker 3. Demande déjà en cours → message d'information |
| **Règles métier** | BR-ACC-001 : KYC et Broker doivent être validés avant toute demande BR-ACC-002 : Une seule demande active à la fois |
| **Données** | `AccessRequest` (userId, tier, status, requestedAt), `User.accessStatus` |
| **Sécurité** | Validation du statut KYC et Broker avant autorisation |
| **Critères d'acceptation** | Given un membre vérifié, When il soumet une demande d'accès, Then une demande est créée avec le statut PENDING |
| **Priorité** | Must |
| **Complexité** | M |

## US-ACC-002 — Visualisation des niveaux d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Demande d'accès |
| **Titre** | Voir les niveaux d'abonnement disponibles |
| **Description** | En tant que **membre**, je souhaite **voir les différents niveaux d'abonnement et leurs avantages** afin de **choisir celui qui me correspond** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ACC-003 — Sélection du niveau d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Demande d'accès |
| **Titre** | Choisir son niveau d'abonnement |
| **Description** | En tant que **membre**, je souhaite **sélectionner un niveau d'abonnement lors de ma demande** afin de **définir mon accès aux signaux** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-004 — Confirmation de la demande

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Demande d'accès |
| **Titre** | Confirmer la demande d'accès |
| **Description** | En tant que **membre**, je souhaite **confirmer ma demande d'accès après avoir choisi mon niveau** afin de **valider ma sélection** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ACC-005 — Suivi du statut de la demande

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Demande d'accès |
| **Titre** | Suivre le statut de ma demande d'accès |
| **Description** | En tant que **membre**, je souhaite **voir le statut de ma demande d'accès (PENDING, APPROVED, REJECTED)** afin de **savoir où j'en suis** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-006 — Approbation manuelle d'une demande

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Approuver une demande d'accès |
| **Description** | En tant que **admin**, je souhaite **approuver manuellement une demande d'accès** afin de **valider le membre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-007 — Rejet d'une demande avec motif

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Rejeter une demande avec motif |
| **Description** | En tant que **admin**, je souhaite **rejeter une demande d'accès avec un motif** afin de **fournir une explication au membre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-008 — Approbation automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Approuver automatiquement les demandes éligibles |
| **Description** | En tant que **système**, je souhaite **approuver automatiquement les demandes des membres remplissant tous les critères** afin de **réduire le temps d'attente** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ACC-009 — Notification d'approbation

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Recevoir une notification d'approbation |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification lorsque ma demande est approuvée** afin de **commencer à utiliser les signaux** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-010 — Notification de rejet

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Recevoir une notification de rejet |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification avec le motif si ma demande est rejetée** afin de **comprendre pourquoi** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-011 — Création d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Créer un abonnement après approbation |
| **Description** | En tant que **système**, je souhaite **créer un abonnement actif après approbation de la demande** afin de **donner accès aux signaux** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ACC-012 — Visualisation de l'abonnement actif

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Voir les détails de mon abonnement |
| **Description** | En tant que **membre**, je souhaite **voir les détails de mon abonnement actif (niveau, dates)** afin de **suivre ma souscription** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-013 — Renouvellement d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Renouveler mon abonnement |
| **Description** | En tant que **membre**, je souhaite **renouveler mon abonnement avant expiration** afin de **ne pas perdre l'accès aux signaux** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ACC-014 — Expiration d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Gérer l'expiration de l'abonnement |
| **Description** | En tant que **système**, je souhaite **désactiver l'accès aux signaux à l'expiration de l'abonnement** afin de **respecter les termes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-015 — Historique des abonnements

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Consulter l'historique des abonnements |
| **Description** | En tant que **membre**, je souhaite **consulter l'historique de mes abonnements passés** afin de **suivre ma relation avec la plateforme** |
| **Priorité** | Could |
| **Complexité** | S |

## US-ACC-016 — Accès complet à la liste des signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Accéder à la liste complète des signaux |
| **Description** | En tant que **membre abonné**, je souhaite **accéder à la liste complète des signaux de trading** afin de **consulter les recommandations** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-017 — Accès au détail d'un signal

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Accéder au détail d'un signal |
| **Description** | En tant que **membre abonné**, je souhaite **ouvrir le détail d'un signal** afin de **voir les informations complètes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-018 — Restrictions selon le niveau d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Appliquer les restrictions par niveau |
| **Description** | En tant que **système**, je souhaite **restreindre certains signaux selon le niveau d'abonnement** afin de **réserver les signaux premium aux niveaux supérieurs** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ACC-019 — Vérification d'accès en temps réel

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Vérifier l'accès avant affichage |
| **Description** | En tant que **système**, je souhaite **vérifier l'accès du membre avant chaque affichage de signal** afin de **garantir la sécurité des accès** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ACC-020 — Page d'accès restreint

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Voir une page d'accès restreint |
| **Description** | En tant que **membre non abonné**, je souhaite **voir une page d'accès restreint avec les avantages de l'abonnement** afin de **m'inciter à souscrire** |
| **Priorité** | Should |
| **Complexité** | S |

---

# Module 8 : Trading Signals (US-SIG-001 → US-SIG-050)

## US-SIG-001 — Affichage de la liste des signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la liste des signaux de trading |
| **Description** | En tant que **membre abonné**, je souhaite **voir la liste chronologique des signaux de trading** afin de **consulter les recommandations disponibles** |
| **Valeur métier** | Produit principal, engagement utilisateur, rétention |
| **Préconditions** | `subscriptionStatus = ACTIVE` |
| **Scénario principal** | 1. L'utilisateur accède à la section "Signaux" 2. Le système charge les signaux paginés par date 3. Chaque signal affiche : titre, paire, direction, prix d'entrée, statut, date 4. L'utilisateur peut faire défiler la liste |
| **Exceptions** | 1. Aucun signal disponible → message "Aucun signal pour le moment" 2. Erreur API → message de réessai |
| **Règles métier** | BR-SIG-001 : Les signaux sont triés par date décroissante BR-SIG-002 : Pagination de 20 signaux par page |
| **Données** | `Signal` (id, title, pair, direction, entryPrice, status, createdAt, content) |
| **Sécurité** | Vérification d'abonnement actif avant affichage |
| **Critères d'acceptation** | Given un membre abonné, When il accède à la section signaux, Then il voit la liste paginée des signaux triés par date |
| **Priorité** | Must |
| **Complexité** | L |

## US-SIG-002 — Signal avec paire de trading

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la paire de trading sur chaque signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir la paire de trading (ex: BTC/USDT) sur chaque signal** afin de **savoir quel actif est concerné** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-003 — Direction du signal (Buy/Sell)

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la direction du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir la direction du signal (BUY/SELL)** afin de **connaître le sens de la recommandation** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-004 — Prix d'entrée affiché

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir le prix d'entrée du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir le prix d'entrée recommandé** afin de **savoir à quel niveau ouvrir la position** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-005 — Statut du signal visible

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir le statut du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir le statut du signal (ACTIVE, TARGET_HIT, STOPPED, EXPIRED)** afin de **suivre son évolution** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-006 — Prix actuel vs prix d'entrée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir l'écart entre prix actuel et entrée |
| **Description** | En tant que **membre abonné**, je souhaite **voir la différence entre le prix actuel et le prix d'entrée** afin de **mesurer la performance en temps réel** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-007 — Date et heure du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la date de publication du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir la date et l'heure de publication du signal** afin de **connaître son ancienneté** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-008 — Pagination infinie

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Parcourir les signaux par scroll infini |
| **Description** | En tant que **membre abonné**, je souhaite **faire défiler la liste des signaux avec une pagination infinie** afin de **naviguer sans interruption** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-009 — Rafraîchissement automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Rafraîchir automatiquement la liste |
| **Description** | En tant que **membre abonné**, je souhaite **que la liste se rafraîchisse automatiquement toutes les 30 secondes** afin de **voir les nouveaux signaux en temps réel** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-010 — Nombre de signaux non lus

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir le nombre de signaux non lus |
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge avec le nombre de signaux non lus** afin de **savoir ce qui est nouveau** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-011 — Détail complet du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Ouvrir le détail d'un signal |
| **Description** | En tant que **membre abonné**, je souhaite **ouvrir la vue détaillée d'un signal** afin de **voir toutes les informations (analyse, niveaux, commentaires)** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-012 — Objectifs de prix (Take Profit)

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir les objectifs de take profit |
| **Description** | En tant que **membre abonné**, je souhaite **voir les niveaux de take profit (TP1, TP2, TP3)** afin de **planifier mes sorties** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-013 — Stop Loss affiché

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir le stop loss du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir le niveau de stop loss recommandé** afin de **gérer mon risque** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-014 — Analyse détaillée du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Lire l'analyse détaillée du signal |
| **Description** | En tant que **membre abonné**, je souhaite **lire l'analyse détaillée accompagnant le signal** afin de **comprendre la recommandation** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-015 — Graphique intégré au détail

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir un graphique intégré |
| **Description** | En tant que **membre abonné**, je souhaite **voir un graphique de prix intégré dans le détail du signal** afin de **visualiser l'analyse technique** |
| **Priorité** | Could |
| **Complexité** | L |

## US-SIG-016 — Recherche par texte

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Rechercher un signal par mot-clé |
| **Description** | En tant que **membre abonné**, je souhaite **rechercher un signal par mot-clé dans le titre ou l'analyse** afin de **trouver rapidement un signal spécifique** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-017 — Filtre par paire de trading

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Filtrer les signaux par paire |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par paire de trading** afin de **ne voir que les actifs qui m'intéressent** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-018 — Filtre par direction

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Filtrer les signaux par direction |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par direction (BUY/SELL)** afin de **cibler un type de trade** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-019 — Filtre par statut

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Filtrer les signaux par statut |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par statut (ACTIVE, TARGET_HIT, etc.)** afin de **ne voir que les signaux pertinents** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-020 — Filtre par date

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Filtrer les signaux par période |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par période (aujourd'hui, cette semaine, ce mois)** afin de **consulter les signaux récents** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-021 — Regroupement par jour

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Grouper les signaux par jour |
| **Description** | En tant que **membre abonné**, je souhaite **voir les signaux groupés par jour avec un séparateur "Aujourd'hui", "Hier", "JJ/MM/AAAA"** afin de **naviguer chronologiquement** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-022 — Regroupement "Aujourd'hui"

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Voir la section "Aujourd'hui" |
| **Description** | En tant que **membre abonné**, je souhaite **voir un en-tête "Aujourd'hui" pour les signaux du jour** afin de **repérer les plus récents immédiatement** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-023 — Regroupement "Hier"

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Voir la section "Hier" |
| **Description** | En tant que **membre abonné**, je souhaite **voir un en-tête "Hier" pour les signaux de la veille** afin de **distinguer les jours** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-024 — Indicateur de signal du jour

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Marquer les premiers signaux du jour |
| **Description** | En tant que **membre abonné**, je souhaite **qu'un indicateur visuel signale le premier signal d'aujourd'hui** afin de **repérer le début de journée** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SIG-025 — Collapse/Expand par jour

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Réduire/développer un groupe de signaux |
| **Description** | En tant que **membre abonné**, je souhaite **réduire ou développer les signaux d'un jour spécifique** afin de **masquer les jours moins pertinents** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-026 — Badge de statut coloré

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir un badge coloré selon le statut |
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge coloré (vert=TP touché, rouge=stop, bleu=actif)** afin de **comprendre le statut d'un coup d'œil** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-027 — Badge de direction (Buy/Sell)

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir un badge BUY/SELL stylisé |
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge BUY (vert) ou SELL (rouge)** afin de **connaître la direction visuellement** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-028 — Badge "Nouveau"

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir un badge "Nouveau" sur les signaux récents |
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge "Nouveau" sur les signaux de moins de 1h** afin de **repérer les signaux frais** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-029 — Icône de take profit atteint

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir une icône quand un TP est atteint |
| **Description** | En tant que **membre abonné**, je souhaite **voir une coche ou icône quand un take profit est atteint** afin de **célébrer le gain** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-030 — Indicateur de signal copié

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir si j'ai déjà copié un signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir une indication visuelle si j'ai déjà copié/exécuté ce signal** afin de **ne pas le refaire** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-031 — Notification push nouveau signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Recevoir une notification push pour un nouveau signal |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification push dès qu'un nouveau signal est publié** afin de **réagir rapidement** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-032 — Notification par email

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Recevoir un email pour un nouveau signal |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir un email récapitulatif des nouveaux signaux** afin de **ne rien manquer même hors ligne** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-033 — Notification take profit atteint

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Être notifié quand un TP est atteint |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification quand un take profit du signal est atteint** afin de **clôturer ma position** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-034 — Notification stop loss atteint

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Être notifié quand le stop loss est touché |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification quand le stop loss est atteint** afin de **limiter mes pertes** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-035 — Paramètres de notification par signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Configurer les notifications par type |
| **Description** | En tant que **membre abonné**, je souhaite **choisir pour quels types d'événements je reçois des notifications** afin de **personnaliser mon expérience** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-036 — Ajout d'un signal aux favoris

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Ajouter un signal aux favoris |
| **Description** | En tant que **membre abonné**, je souhaite **ajouter un signal à mes favoris** afin de **le retrouver facilement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-037 — Liste des favoris

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Voir la liste des signaux favoris |
| **Description** | En tant que **membre abonné**, je souhaite **voir une vue filtrée de mes signaux favoris** afin de **les consulter rapidement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-038 — Retrait des favoris

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Retirer un signal des favoris |
| **Description** | En tant que **membre abonné**, je souhaite **retirer un signal de mes favoris** afin de **nettoyer ma liste** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-039 — Badge favori sur la liste

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Voir une étoile de favori sur les signaux |
| **Description** | En tant que **membre abonné**, je souhaite **voir une étoile remplie sur les signaux déjà en favoris** afin de **les identifier dans la liste** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-040 — Favoris persistants entre sessions

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Conserver les favoris entre sessions |
| **Description** | En tant que **membre abonné**, je souhaite **que mes favoris soient sauvegardés sur mon compte** afin de **les retrouver sur tous mes appareils** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-041 — Export d'un signal en PDF

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Exporter un signal en PDF |
| **Description** | En tant que **membre abonné**, je souhaite **exporter un signal en PDF** afin de **le consulter hors ligne ou l'imprimer** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-042 — Export de la liste des signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Exporter la liste filtrée en CSV |
| **Description** | En tant que **membre abonné**, je souhaite **exporter la liste des signaux (filtrée) en CSV** afin de **l'analyser dans un tableur** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-043 — Partage d'un signal par lien

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Partager un signal par lien |
| **Description** | En tant que **membre abonné**, je souhaite **copier un lien de partage pour un signal** afin de **le partager avec d'autres membres** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-044 — Copie des informations du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Copier les détails du signal |
| **Description** | En tant que **membre abonné**, je souhaite **copier les informations clés du signal (paire, prix, TP, SL)** afin de **les coller dans ma plateforme de trading** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-045 — Capture d'écran du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Générer une image du signal |
| **Description** | En tant que **membre abonné**, je souhaite **générer une image stylisée du signal** afin de **la partager sur les réseaux sociaux** |
| **Priorité** | Could |
| **Complexité** | L |

## US-SIG-046 — Ratio de réussite global

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le ratio de réussite global des signaux |
| **Description** | En tant que **membre abonné**, je souhaite **voir le pourcentage de signaux ayant atteint au moins un TP** afin de **mesurer la performance de la plateforme** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-047 — Performance par paire

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir la performance par paire de trading |
| **Description** | En tant que **membre abonné**, je souhaite **voir le taux de réussite par paire de trading** afin de **savoir quels actifs sont les plus performants** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-048 — Graphique de performance cumulée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir un graphique de performance cumulée |
| **Description** | En tant que **membre abonné**, je souhaite **voir un graphique de la performance cumulée des signaux sur le temps** afin de **visualiser la tendance** |
| **Priorité** | Could |
| **Complexité** | L |

## US-SIG-049 — Meilleur signal du mois

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le meilleur signal du mois |
| **Description** | En tant que **membre abonné**, je souhaite **voir le signal avec le meilleur rendement du mois** afin de **mettre en avant les succès** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-050 — Temps moyen avant take profit

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le temps moyen avant atteinte du TP |
| **Description** | En tant que **membre abonné**, je souhaite **voir le délai moyen entre la publication et l'atteinte du premier TP** afin de **gérer mes attentes temporelles** |
| **Priorité** | Could |
| **Complexité** | M |

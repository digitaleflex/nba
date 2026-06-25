# NEVERBROKEAGAIN (NBA)

# Cahier d'Architecture Technique

Version : 1.0
Date : Juin 2026
Statut : Document d'Architecture de Référence (ADR)

---

# 1. Présentation du Projet

## 1.1 Contexte

NeverBrokeAgain (NBA) est une plateforme premium de signaux de trading permettant :

* l'inscription des membres ;
* la vérification d'identité (KYC) ;
* la validation de l'éligibilité ;
* la gestion des abonnements ;
* la diffusion ciblée de signaux de trading ;
* la gestion administrative des membres ;
* la consultation des signaux depuis un espace membre sécurisé.

Le Bot Telegram et les systèmes de paiement sont des composants externes et ne constituent pas le cœur du système.

La plateforme NBA est le système central de gestion des utilisateurs, des abonnements et des signaux.

---

# 2. Vision d'Architecture

L'architecture doit répondre aux objectifs suivants :

## Fonctionnels

* Gérer plusieurs milliers de membres.
* Diffuser des signaux en quelques secondes.
* Permettre l'administration des dossiers KYC.
* Gérer les abonnements et permissions.
* Garantir la traçabilité des actions.

## Non Fonctionnels

* Disponibilité élevée.
* Temps de chargement inférieur à 3 secondes.
* Sécurité des données personnelles.
* Architecture évolutive.
* Déploiement simplifié.
* Faible coût opérationnel.

---

# 3. Principes d'Architecture

L'application est conçue comme un :

**Monolithe Modulaire (Modular Monolith)**

L'objectif est de :

* réduire la complexité ;
* accélérer le développement ;
* simplifier le déploiement ;
* faciliter la maintenance ;
* permettre une future extraction vers des microservices si nécessaire.

---

# 4. Architecture Générale

Internet
↓
Cloudflare
↓
Reverse Proxy (Nginx)
↓
Docker Network
├── NBA Application
├── NBA Worker
├── Redis
└── Uploads Temporaires

Neon PostgreSQL
↓
Base de données managée

---

# 5. Stack Technologique

## Frontend

* Next.js 16
* React 19
* TypeScript
* App Router
* Server Components
* Server Actions
* Tailwind CSS
* Shadcn UI

---

## Backend

* Next.js Route Handlers
* Service Layer
* Repository Pattern
* Validation Zod

---

## Authentification

### Better Auth

Plugins activés :

* Email & Password
* Email Verification
* Password Reset
* Session Management
* RBAC
* Admin Plugin
* Two-Factor Authentication (2FA)

Avantages :

* Productivité élevée
* Forte intégration Prisma
* Gestion avancée des sessions
* Extensibilité
* Faible charge de maintenance

---

## ORM

### Prisma

Fonctionnalités :

* Migrations
* Typage automatique
* Transactions
* Relations
* Génération de schéma

---

## Base de Données

### Neon PostgreSQL

Justifications :

* modèle fortement relationnel ;
* intégrité référentielle ;
* transactions ACID ;
* sauvegardes automatiques ;
* administration réduite ;
* faible consommation des ressources VPS ;
* excellente compatibilité avec Prisma.

---

## Cache et Queue

### Redis

Utilisations :

* cache ;
* sessions ;
* files de tâches ;
* limitation de débit ;
* traitements asynchrones.

---

## Traitements Asynchrones

### BullMQ

Responsabilités :

* diffusion des signaux ;
* notifications ;
* suppression automatique des fichiers ;
* tâches programmées ;
* traitements différés.

---

# 6. Infrastructure d'Hébergement

## Serveur Principal

Hostinger VPS KVM2

Configuration :

* 2 vCPU
* 8 Go RAM
* 100 Go NVMe

Le serveur héberge :

* Application NBA
* Redis
* Workers BullMQ
* Reverse Proxy
* Fichiers temporaires

La base de données est externalisée sur Neon afin de préserver les ressources du serveur.

---

# 7. Déploiement Docker

Services :

nba-app
nba-worker
redis
nginx

Volumes :

uploads
redis-data
logs

Réseaux :

frontend
backend

Politique :

restart: unless-stopped

---

# 8. Architecture Applicative

L'application est découpée en modules métiers.

Modules :

Auth
Members
Plans
KYC
Broker Verification
Signals
Notifications
Administration
Settings
Audit

Chaque module contient :

pages
components
services
repositories
validations
types

---

# 9. Module Authentification

Fonctionnalités :

* Inscription
* Connexion
* Déconnexion
* Vérification email
* Réinitialisation mot de passe
* Sessions multiples
* Gestion des appareils
* 2FA administrateur
* Gestion des rôles

Rôles :

SUPER_ADMIN
ADMIN
KYC_AGENT
SUPPORT_AGENT
MEMBER

---

# 10. Module Membres

Fonctionnalités :

* Tableau de bord personnel
* Profil utilisateur
* Gestion du compte
* Statut de vérification
* Historique des signaux
* Notifications

---

# 11. Module KYC

Fonctionnalités :

* Upload pièce d'identité
* Validation format
* Réupload après refus
* Consultation administrateur

Formats :

JPG
PNG
PDF

Taille maximale :

10 Mo

---

# 12. Module Vérification Broker

Fonctionnalités :

* Upload vidéo
* ID Broker
* Soumission dossier
* Validation administrateur

Formats :

MP4
MOV

Taille maximale :

30 Mo

Durée recommandée :

2 minutes maximum

---

# 13. Gestion des Fichiers Temporaires

Stockage :

uploads/
├── kyc/
└── videos/

Les fichiers sont conservés uniquement le temps de la validation.

Processus :

Upload
↓
Validation
↓
Suppression automatique
↓
Audit

Objectifs :

* réduire les coûts ;
* réduire la consommation disque ;
* limiter les risques de sécurité.

---

# 14. Workflow Utilisateur

Inscription
↓
Création compte
↓
Soumission KYC
↓
Soumission Broker
↓
Dossier en attente
↓
Validation Administrateur
↓
Compte Actif

---

# 15. Centre de Diffusion

Le Centre de Diffusion constitue le cœur opérationnel de NBA.

L'administrateur crée des signaux.

Le système détermine automatiquement les destinataires éligibles.

---

# 16. Gestion des Abonnements

Plans :

Signaux X Forex
Signaux X Deriv
Signaux X Forex + Deriv
Signaux X Pro Forex
Signaux X Pro Deriv
Signaux X Pro Forex + Deriv

Les plans ne doivent jamais être codés en dur.

Ils doivent être administrables.

---

# 17. Moteur de Permissions

Exemple :

FOREX
↓
Forex
Forex + Deriv
Pro Forex
Pro Forex + Deriv

DERIV
↓
Deriv
Forex + Deriv
Pro Deriv
Pro Forex + Deriv

---

# 18. Diffusion des Signaux

Architecture :

Administrateur
↓
Création Signal
↓
Enregistrement PostgreSQL
↓
Création Job
↓
Redis Queue
↓
BullMQ Workers
↓
Création Notifications
↓
Publication Espace Membre

La diffusion est asynchrone.

L'interface administrateur reste instantanée.

---

# 19. Notifications

Canaux :

Notifications internes
Email
Telegram (optionnel)
Push (future version)

---

# 20. Administration

Fonctionnalités :

Dashboard
Gestion Membres
Gestion Plans
Validation KYC
Validation Broker
Centre de Diffusion
Notifications
Statistiques
Audit
Paramètres

---

# 21. Journalisation

Toutes les opérations sont historisées.

Exemples :

Connexion
Validation KYC
Publication signal
Modification utilisateur
Suppression fichier
Suspension compte

---

# 22. Modèle Conceptuel de Données

Principales entités :

users
sessions
accounts
verifications

plans
user_plans

kyc_documents
broker_submissions

signals
signal_audiences
notifications

audit_logs
settings

---

# 23. Sécurité

HTTPS obligatoire.

Mesures :

* mots de passe hashés ;
* validation des fichiers ;
* protection CSRF ;
* headers sécurisés ;
* rate limiting ;
* contrôle RBAC ;
* journalisation ;
* expiration des sessions ;
* authentification à deux facteurs administrateur.

---

# 24. Sauvegardes

Neon :

* sauvegardes automatiques ;
* snapshots ;
* restauration.

VPS :

* sauvegarde volumes Docker ;
* sauvegarde configuration ;
* sauvegarde logs.

---

# 25. Estimation de Charge

Phase de lancement :

0 à 10 000 membres

Infrastructure actuelle suffisante.

Phase de croissance :

10 000 à 50 000 membres

Ajout éventuel :

* VPS Worker dédié ;
* Redis managé ;
* monitoring avancé.

Phase de maturité :

50 000+ membres

Architecture distribuée :

* plusieurs instances applicatives ;
* workers dédiés ;
* bases répliquées ;
* observabilité complète.

---

# 26. Vision d'Évolution

Application mobile
Notifications Push
Signaux Crypto
Signaux Indices
Programme d'affiliation
Statistiques avancées
Recommandations IA
Multi-langue
API publique

---

# Conclusion

NeverBrokeAgain est conçu comme un monolithe modulaire moderne :

Frontend :
Next.js 16

Authentification :
Better Auth

Base de données :
Neon PostgreSQL

ORM :
Prisma

Queue :
Redis + BullMQ

Déploiement :
Docker sur Hostinger VPS KVM2

Cette architecture privilégie :

* la rapidité de développement ;
* la simplicité opérationnelle ;
* la maîtrise des coûts ;
* la sécurité ;
* l'évolutivité progressive ;
* la compatibilité avec un développement fortement assisté par l'intelligence artificielle.

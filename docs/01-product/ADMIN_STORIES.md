# Admin Stories — NeverBrokeAgain (NBA)

> Version: 1.0
> Status: Draft
> Last Updated: June 2026

---

## ADM-001 : Visualiser le tableau de bord administrateur
**En tant que** administrateur, je veux visualiser les statistiques clés du tableau de bord afin de superviser l'activité de la plateforme.
**Domaine** : Dashboard
**Dépendances** : Aucune
**Règles métier** : BUSINESS_RULES.md # Audit Rules (consultation des stats implique des logs)
**Hors périmètre V1** : Non

---

## ADM-002 : Rechercher des membres
**En tant que** administrateur, je veux rechercher des membres par différents critères afin de trouver rapidement un utilisateur.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-001
**Règles métier** : BUSINESS_RULES.md # Dashboard Rules (accès limité aux données membres)
**Hors périmètre V1** : Non

---

## ADM-003 : Filtrer la liste des membres
**En tant que** administrateur, je veux filtrer les membres par statut, plan, date d'inscription afin d'analyser les segments d'utilisateurs.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-002
**Règles métier** : FUNCTIONAL_SPECIFICATION.md # Filters, BUSINESS_RULES.md # Role Rules
**Hors périmètre V1** : Non

---

## ADM-004 : Paginer la liste des membres
**En tant que** administrateur, je veux paginer la liste des membres afin de naviguer efficacement parmi des milliers d'utilisateurs.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-002, ADM-003
**Règles métier** : FUNCTIONAL_SPECIFICATION.md # Pagination
**Hors périmètre V1** : Non

---

## ADM-005 : Voir le profil détaillé d'un membre
**En tant que** administrateur, je veux voir le profil complet d'un membre afin d'évaluer son statut et son historique.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-002
**Règles métier** : BUSINESS_RULES.md # Administration Rules, BUSINESS_RULES.md # Dashboard Rules
**Hors périmètre V1** : Non

---

## ADM-006 : Suspendre un membre
**En tant que** administrateur, je veux suspendre un compte membre afin de bloquer l'accès en cas de violation.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Administration Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-007 : Réactiver un membre suspendu
**En tant que** administrateur, je veux réactiver un compte membre suspendu afin de restaurer l'accès.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-006
**Règles métier** : BUSINESS_RULES.md # Administration Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-008 : Supprimer définitive un membre
**En tant que** administrateur, je veux supprimer définitivement un compte membre (soft delete) afin de retirer un utilisateur problématique.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Administration Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-009 : Approuver une soumission KYC
**En tant que** agent KYC, je veux approuver une soumission KYC afin de valider l'identité d'un membre.
**Domaine** : KYC
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # KYC Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-010 : Rejeter une soumission KYC
**En tant que** agent KYC, je veux rejeter une soumission KYC avec motif afin de demander une nouvelle soumission.
**Domaine** : KYC
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # KYC Rules, BUSINESS_RULES.md # Verification Rules
**Hors périmètre V1** : Non

---

## ADM-011 : Demander une correction KYC
**En tant que** agent KYC, je veux demander une correction pour une soumission KYC afin d'obtenir des documents conformes.
**Domaine** : KYC
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Verification Rules
**Hors périmètre V1** : Non

---

## ADM-012 : Approuver une vérification broker
**En tant que** administrateur, je veux approuver une vérification broker afin de valider le compte trading d'un membre.
**Domaine** : Broker
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Broker Verification Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-013 : Rejeter une vérification broker
**En tant que** administrateur, je veux rejeter une vérification broker avec motif afin de demander une nouvelle soumission.
**Domaine** : Broker
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Verification Rules
**Hors périmètre V1** : Non

---
## ADM-014 : Demander une correction broker
**En tant que** administrateur, je veux demander une correction pour une vérification broker afin d'obtenir une vidéo conforme.
**Domaine** : Broker
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Verification Rules
**Hors périmètre V1** : Non

---

## ADM-015 : Créer un signal de trading
**En tant que** administrateur, je veux créer un nouveau signal de trading afin de le préparer pour publication.
**Domaine** : Signaux
**Dépendances** : Aucune
**Règles métier** : BUSINESS_RULES.md # Signal Publication Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-016 : Éditer un signal de trading
**En tant que** administrateur, je veux éditer un signal existant afin de le corriger avant publication.
**Domaine** : Signaux
**Dépendances** : ADM-015
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-017 : Dupliquer un signal de trading
**En tant que** administrateur, je veux dupliquer un signal existant afin de gagner du temps sur les créations similaires.
**Domaine** : Signaux
**Dépendances** : ADM-015
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-018 : Archiver un signal publié
**En tant que** administrateur, je veux archiver un signal publié afin de le retirer de la liste active.
**Domaine** : Signaux
**Dépendances** : ADM-015
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-019 : Programmer la publication d'un signal
**En tant que** administrateur, je veux programmer la publication d'un signal afin de le publier à une date future.
**Domaine** : Signaux
**Dépendances** : ADM-015
**Règles métier** : BUSINESS_RULES.md # Signal Publication Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-020 : Publier immédiatement un signal
**En tant que** administrateur, je veux publier immédiatement un signal afin de le rendre disponible aux membres.
**Domaine** : Signaux
**Dépendances** : ADM-015, ADM-016
**Règles métier** : BUSINESS_RULES.md # Signal Publication Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---
## ADM-021 : Supprimer un brouillon de signal
**En tant que** administrateur, je veux supprimer un brouillon de signal afin de nettoyer les créations abandonnées.
**Domaine** : Signaux
**Dépendances** : ADM-015
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-022 : Voir les détails d'une souscription
**En tant que** administrateur, je veux voir les détails d'une souscription membre afin d'auditer son statut.
**Domaine** : Gestion des abonnements
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Subscription Rules, BUSINESS_RULES.md # Administration Rules
**Hors périmètre V1** : Non

---

## ADM-023 : Assigner un plan d'abonnement à un membre
**En tant que** administrateur, je veux assigner un plan d'abonnement à un membre afin de lui accorder l'accès approprié.
**Domaine** : Gestion des abonnements
**Dépendances** : ADM-022
**Règles métier** : BUSINESS_RULES.md # Subscription Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---
## ADM-024 : Suspendre une souscription
**En tant que** administrateur, je veux suspendre une souscription afin de retirer temporairement l'accès premium.
**Domaine** : Gestion des abonnements
**Dépendances** : ADM-023
**Règles métier** : BUSINESS_RULES.md # Subscription Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-025 : Expirer une souscription
**En tant que** administrateur, je veux expirer une souscription afin de retirer définitivement l'accès premium.
**Domaine** : Gestion des abonnements
**Dépendances** : ADM-023
**Règles métier** : BUSINESS_RULES.md # Subscription Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-026 : Renouveler une souscription
**En tant que** administrateur, je veux renouveler une souscription expirée afin de restaurer l'accès premium.
**Domaine** : Gestion des abonnements
**Dépendances** : ADM-023, ADM-025
**Règles métier** : BUSINESS_RULES.md # Subscription Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-027 : Approuver une demande d'accès groupe
**En tant que** administrateur, je veux approuver une demande d'accès à un groupe spécialisé afin de donner accès à du contenu restreint.
**Domaine** : Gestion des accès
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Role Rules
**Hors périmètre V1** : Non

---

## ADM-028 : Consulter les logs d'audit
**En tant que** administrateur, je veux consulter les logs d'audit afin de tracer les actions effectuées sur la plateforme.
**Domaine** : Audit
**Dépendances** : Aucune
**Règles métier** : BUSINESS_RULES.md # Audit Rules, ADR-014-Audit-Logging.md
**Hors périmètre V1** : Non

---

## ADM-029 : Filtrer les logs d'audit
**En tant que** administrateur, je veux filtrer les logs d'audit par date, action, acteur afin d'investiguer rapidement un incident.
**Domaine** : Audit
**Dépendances** : ADM-028
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Non

---

## ADM-030 : Configurer les paramètres plateforme
**En tant que** super-administrateur, je veux configurer les paramètres généraux de la plateforme afin de personnaliser le fonctionnement.
**Domaine** : Paramètres
**Dépendances** : Aucune
**Règles métier** : BUSINESS_RULES.md # Administration Rules
**Hors périmètre V1** : Oui

---

## ADM-031 : Gérer les paramètres sécurité
**En tant que** super-administrateur, je veux gérer les paramètres de sécurité afin de renforcer la protection de la plateforme.
**Domaine** : Sécurité
**Dépendances** : Aucune
**Règles métier** : BUSINESS_RULES.md # Security Rules
**Hors périmètre V1** : Oui

---

## ADM-032 : Exporter les logs d'audit
**En tant que** super-administrateur, je veux exporter les logs d'audit au format CSV/STIX afin de les partager avec l'équipe sécurité.
**Domaine** : Audit
**Dépendances** : ADM-028, ADM-029
**Règles métier** : BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Oui

---

## ADM-033 : Révoquer les sessions actives multiples
**En tant que** administrateur, je veux révoquer toutes les sessions actives d'un membre afin de forcer une nouvelle authentification.
**Domaine** : Gestion des utilisateurs
**Dépendances** : ADM-005, ADM-006
**Règles métier** : FUNCTIONAL_SPECIFICATION.md # Session Management
**Hors périmètre V1** : Oui

---

## ADM-034 : Modifier le rôle d'un utilisateur
**En tant que** super-administrateur, je veux modifier le rôle d'un utilisateur afin de révoquer ou accorder des permissions.
**Domaine** : Administration
**Dépendances** : ADM-005
**Règles métier** : BUSINESS_RULES.md # Role Rules, BUSINESS_RULES.md # Audit Rules
**Hors périmètre V1** : Oui

---

## ADM-035 : Voir les statistiques de performance signals
**En tant que** administrateur, je veux voir les statistiques de performance des signals publiés afin d'analyser l'efficacité.
**Domaine** : Statistiques
**Dépendances** : ADM-020
**Règles métier** : BUSINESS_RULES.md # Administration Rules
**Hors périmètre V1** : Oui
---

## Résumé

| Domaine | Stories V1 | Stories Hors Périmètre |
|---------|-----------|----------------------|
| Dashboard | 1 | - |
| Gestion des utilisateurs | 8 | 2 (ADM-033, ADM-034) |
| KYC | 3 | - |
| Broker | 3 | - |
| Signaux | 7 | - |
| Abonnements | 4 | - |
| Gestion des accès | 1 | - |
| Audit | 3 | 2 (ADM-032, ADM-035) |
| Paramètres | 1 | - |
| Sécurité | 1 | - |
| Statistiques | 1 | - |
| **Total** | **29** | **9** |
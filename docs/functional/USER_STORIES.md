# NeverBrokeAgain — Référentiel User Stories Enterprise

| Métadonnée | Valeur |
|---|---|
| Version | 1.0.0 |
| Dernière mise à jour | 2026-06-28 |
| Statut | DRAFT |
| Auteur | Product & Engineering Team |
| Approbation requise | Oui |

---

## Structure du document

| Module | ID Range | Pages |
|--------|----------|-------|
| 1. Visiteur | US-VIS-001 → US-VIS-035 | 1–35 |
| 2. Authentification | US-AUTH-001 → US-AUTH-035 | 36–70 |
| 3. Profil utilisateur | US-PRO-001 → US-PRO-025 | 71–95 |
| 4. Onboarding | US-ONB-001 → US-ONB-025 | 96–120 |
| 5. KYC | US-KYC-001 → US-KYC-035 | 121–155 |
| 6. Vérification Broker | US-BRK-001 → US-BRK-025 | 156–180 |
| 7. Gestion des accès | US-ACC-001 → US-ACC-020 | 181–200 |
| 8. Trading Signals | US-SIG-001 → US-SIG-050 | 201–250 |
| 9. Notifications | US-NOT-001 → US-NOT-035 | 251–285 |
| 10. Tableau de bord | US-DSH-001 → US-DSH-025 | 286–310 |
| 11. Administration | US-ADM-001 → US-ADM-060 | 311–370 |
| 12. Paramètres | US-SET-001 → US-SET-025 | 371–395 |
| 13. Sécurité | US-SEC-001 → US-SEC-040 | 396–435 |
| 14. Audit | US-AUD-001 → US-AUD-020 | 436–455 |
| 15. Support | US-SUP-001 → US-SUP-015 | 456–470 |

**Total : ~470 User Stories**

---

## Convention de rédaction

Chaque User Story respecte la structure suivante :

```yaml
US-XXX-001:
  module: "..."
  epic: "..."
  title: "..."
  description: "En tant que ..., je souhaite ..., afin de ..."
  value: "..."
  preconditions: []
  trigger: "..."
  scenario:
    - "..."
  alternatives: []
  exceptions: []
  rules: []
  permissions: []
  data: []
  notifications: { email: false, in_app: false, audit: false, queue: "" }
  security: { rbac: "", validation: "", rate_limit: "" }
  acceptance:
    given: ""
    when: ""
    then: ""
  priority: "Must" | "Should" | "Could" | "Won't"
  complexity: "XS" | "S" | "M" | "L" | "XL"
  dependencies: []
  tests: []
```

---

# Module 1 : Visiteur (US-VIS-001 → US-VIS-035)

## US-VIS-001 — Page d'accueil

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter la page d'accueil |
| **Description** | En tant que **visiteur non connecté**, je souhaite **accéder à la page d'accueil du site** afin de **comprendre le service proposé et décider de m'inscrire** |
| **Valeur métier** | Première impression du produit, acquisition de nouveaux utilisateurs |
| **Préconditions** | Aucune |
| **Déclencheur** | L'utilisateur saisit l'URL du site dans son navigateur |
| **Scénario principal** | 1. L'utilisateur accède à `https://signauxx.com` 2. La page d'accueil s'affiche avec le branding, une description du service et un appel à l'action |
| **Exceptions** | 1. L'utilisateur est déjà connecté → redirection vers `/dashboard` (via middleware) |
| **Règles métier** | Si l'utilisateur possède une session valide, il est redirigé |
| **Permissions** | Aucune (public) |
| **Notifications** | Aucune |
| **Sécurité** | Redirection automatique via middleware |
| **Critères d'acceptation** | Given un visiteur non connecté, When il accède à `/`, Then il voit la page d'accueil |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-002 — Consultation des offres

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter la liste des offres d'abonnement |
| **Description** | En tant que **visiteur**, je souhaite **consulter la liste des plans d'abonnement disponibles avec leurs prix et fonctionnalités** afin de **choisir l'offre adaptée à mes besoins de trading** |
| **Valeur métier** | Transparence des prix, aide à la décision d'achat |
| **Préconditions** | L'utilisateur navigue sur la page d'accueil ou `/plans` |
| **Déclencheur** | L'utilisateur clique sur "Voir les offres" ou "Nos services" |
| **Scénario principal** | 1. L'utilisateur clique sur "Voir les offres" 2. Le système affiche les plans actifs triés par ordre d'affichage 3. Chaque plan montre : nom, description, prix, devise, durée, fonctionnalités incluses |
| **Règles métier** | BR-PLAN-001 : Seuls les plans avec `isActive = true` sont affichés BR-PLAN-002 : Les plans sont triés par `sortOrder` |
| **Données** | `SubscriptionPlan` (name, description, price, currency, durationDays, features) |
| **Sécurité** | Fallback sur liste hardcodée si la DB est inaccessible |
| **Critères d'acceptation** | Given un visiteur, When il consulte les offres, Then il voit tous les plans actifs avec prix et fonctionnalités |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-003 — Page de fonctionnalités détaillées

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter les fonctionnalités détaillées |
| **Description** | En tant que **visiteur**, je souhaite **consulter une page dédiée aux fonctionnalités de la plateforme** afin de **comprendre la valeur ajoutée du service** |
| **Valeur métier** | Conversion des visiteurs en leads |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-004 — Page de témoignages

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter les témoignages clients |
| **Description** | En tant que **visiteur**, je souhaite **lire des témoignages de membres existants** afin de **renforcer ma confiance dans le service** |
| **Priorité** | Could |
| **Complexité** | M |

## US-VIS-005 — Page de FAQ

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter la FAQ |
| **Description** | En tant que **visiteur**, je souhaite **accéder à une foire aux questions** afin de **trouver rapidement des réponses à mes interrogations sans contacter le support** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-006 — Page de contact

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Contacter l'équipe |
| **Description** | En tant que **visiteur**, je souhaite **envoyer un message via un formulaire de contact** afin de **poser une question avant de m'inscrire** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-007 — Page de mentions légales

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter les mentions légales |
| **Description** | En tant que **visiteur**, je souhaite **accéder aux mentions légales et à la politique de confidentialité** afin de **vérifier la conformité légale du service** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-008 — Page des CGV/CGU

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Consulter les conditions générales |
| **Description** | En tant que **visiteur**, je souhaite **lire les conditions générales de vente et d'utilisation** afin de **connaître mes droits et obligations avant de souscrire** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-009 — Inscription depuis une offre

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Démarrer l'inscription depuis une offre |
| **Description** | En tant que **visiteur ayant choisi une offre**, je souhaite **cliquer sur "Souscrire" et être redirigé vers le formulaire d'inscription** afin de **créer mon compte** |
| **Valeur métier** | Tunnel de conversion direct offre → inscription |
| **Préconditions** | Le visiteur a consulté les offres |
| **Scénario principal** | 1. Le visiteur clique "Souscrire" sur un plan 2. Le système redirige vers `/register` avec le planId en paramètre 3. Le formulaire d'inscription pré-sélectionne le plan choisi |
| **Critères d'acceptation** | Given un visiteur sur une offre, When il clique "Souscrire", Then il est redirigé vers `/register` avec l'offre pré-sélectionnée |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-010 — Inscription en 5 étapes

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Suivre le formulaire d'inscription multi-étapes |
| **Description** | En tant que **visiteur**, je souhaite **suivre un formulaire d'inscription en 5 étapes (Service → Identité → Contact → Sécurité → Confirmation)** afin de **créer mon compte de manière guidée et progressive** |
| **Valeur métier** | Réduction du taux d'abandon, UX optimisée |
| **Préconditions** | Le visiteur a cliqué sur "S'inscrire" |
| **Scénario principal** | 1. Étape 1 : Sélection du service (plan) 2. Étape 2 : Prénom et Nom 3. Étape 3 : Email et WhatsApp 4. Étape 4 : Mot de passe avec indicateur de force 5. Étape 5 : Récapitulatif et confirmation 6. Soumission du formulaire |
| **Règles métier** | BR-REG-001 : Tous les champs obligatoires doivent être remplis BR-REG-002 : Le mot de passe doit respecter les règles de sécurité |
| **Données** | `User`, `Account`, `AccessRequest`, `SubscriptionPlan` |
| **Notifications** | Email de vérification après inscription |
| **Sécurité** | Rate limiting : 3 inscriptions/heure |
| **Critères d'acceptation** | Given un visiteur, When il complète les 5 étapes, Then son compte est créé et il est redirigé vers `/onboarding` |
| **Priorité** | Must |
| **Complexité** | L |

## US-VIS-011 — Sélection d'un plan d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Sélectionner un plan d'abonnement |
| **Description** | En tant que **visiteur en inscription**, je souhaite **choisir parmi une liste de plans disponibles** afin de **sélectionner celui qui correspond à mes besoins** |
| **Valeur métier** | Choix éclairé du service |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-012 — Validation des champs d'identité

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Renseigner son identité |
| **Description** | En tant que **visiteur en inscription**, je souhaite **saisir mon prénom et mon nom** afin de **créer mon identité sur la plateforme** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-013 — Saisie des coordonnées

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Renseigner email et WhatsApp |
| **Description** | En tant que **visiteur en inscription**, je souhaite **fournir mon adresse email et mon numéro WhatsApp** afin de **permettre à la plateforme de me contacter** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-014 — Création du mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Créer un mot de passe sécurisé |
| **Description** | En tant que **visiteur en inscription**, je souhaite **créer un mot de passe avec un indicateur de force visuel** afin de **garantir la sécurité de mon compte** |
| **Valeur métier** | Sécurité des comptes utilisateurs |
| **Règles métier** | BR-SEC-001 : Minimum 8 caractères BR-SEC-002 : Doit contenir majuscule, minuscule, chiffre et caractère spécial |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-015 — Confirmation des données

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Confirmer les données avant soumission |
| **Description** | En tant que **visiteur en inscription**, je souhaite **voir un récapitulatif de toutes mes données avant de valider** afin de **vérifier qu'il n'y a pas d'erreur** |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-016 — Acceptation des CGV

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Accepter les conditions générales |
| **Description** | En tant que **visiteur en inscription**, je souhaite **accepter les CGV et la politique de confidentialité** afin de **finaliser mon inscription** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-017 — Redirection vers l'onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Être redirigé vers l'onboarding après inscription |
| **Description** | En tant que **nouveau membre**, je souhaite **être redirigé vers le parcours d'onboarding** afin de **commencer les étapes de vérification** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-018 — Navigation vers la page de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Accéder à la page de connexion |
| **Description** | En tant que **visiteur déjà inscrit**, je souhaite **cliquer sur "Se connecter"** afin de **me connecter à mon compte** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-019 — Page de confirmation d'inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Parcours d'inscription |
| **Titre** | Voir la confirmation d'inscription |
| **Description** | En tant que **nouveau membre**, je souhaite **voir une page de confirmation après mon inscription** afin de **savoir que mon compte est créé et quelles sont les prochaines étapes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-020 — Landing page SEO

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | SEO |
| **Titre** | Être référencé sur les moteurs de recherche |
| **Description** | En tant que **visiteur**, je souhaite **trouver le site via Google** afin de **découvrir le service** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-021 — Page blog / actualités

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Contenu |
| **Titre** | Consulter le blog |
| **Description** | En tant que **visiteur**, je souhaite **lire des articles de blog sur le trading** afin de **découvrir l'expertise de l'équipe** |
| **Priorité** | Could |
| **Complexité** | M |

## US-VIS-022 — Newsletter

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Contenu |
| **Titre** | S'inscrire à la newsletter |
| **Description** | En tant que **visiteur**, je souhaite **m'inscrire à la newsletter** afin de **recevoir des actualités trading et des offres promotionnelles** |
| **Priorité** | Could |
| **Complexité** | S |

## US-VIS-023 — Page tarifs dédiée

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Accéder à une page tarifs dédiée |
| **Description** | En tant que **visiteur**, je souhaite **accéder à une page `/pricing` dédiée** afin de **comparer tous les plans sur une seule page** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-024 — Comparateur d'offres

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Comparer les offres |
| **Description** | En tant que **visiteur**, je souhaite **comparer les fonctionnalités des différents plans côte à côte** afin de **choisir le plus adapté** |
| **Priorité** | Could |
| **Complexité** | M |

## US-VIS-025 — Mode démo / aperçu

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Présentation du service |
| **Titre** | Voir un aperçu des signaux |
| **Description** | En tant que **visiteur**, je souhaite **voir un exemple de signal de trading** afin de **comprendre le format et la qualité des informations** |
| **Priorité** | Could |
| **Complexité** | M |

## US-VIS-026 — Partage de lien d'invitation

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Viralité |
| **Titre** | Être invité par un membre |
| **Description** | En tant que **visiteur**, je souhaite **accéder au site via un lien de parrainage** afin de **bénéficier d'une offre spéciale** |
| **Priorité** | Won't |
| **Complexité** | L |

## US-VIS-027 — Page d'erreur 404

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Navigation |
| **Titre** | Voir une page 404 |
| **Description** | En tant que **visiteur**, je souhaite **voir une page 404 stylée lorsque j'accède à une URL inexistante** afin de **pouvoir revenir à la navigation** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-VIS-028 — Page de maintenance

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Navigation |
| **Titre** | Voir une page de maintenance |
| **Description** | En tant que **visiteur**, je souhaite **voir une page de maintenance lorsque le site est indisponible** afin de **savoir que le service revient bientôt** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-029 -- Cookies banner

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Conformité |
| **Titre** | Accepter ou refuser les cookies |
| **Description** | En tant que **visiteur**, je souhaite **voir une bannière de consentement aux cookies** afin de **choisir mes préférences de suivi** |
| **Priorité** | Must |
| **Complexité** | S |

## US-VIS-030 — Accessibilité

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Conformité |
| **Titre** | Naviguer avec un lecteur d'écran |
| **Description** | En tant que **visiteur en situation de handicap**, je souhaite **que le site soit navigable avec un lecteur d'écran** afin de **pouvoir utiliser le service** |
| **Priorité** | Should |
| **Complexité** | M |

## US-VIS-031 — Internationalisation

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Conformité |
| **Titre** | Changer la langue du site |
| **Description** | En tant que **visiteur non francophone**, je souhaite **pouvoir afficher le site en anglais** afin de **comprendre le service** |
| **Priorité** | Could |
| **Complexité** | L |

## US-VIS-032 — Performance de chargement

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Performance |
| **Titre** | Chargement rapide de la page d'accueil |
| **Description** | En tant que **visiteur**, je souhaite **que la page d'accueil se charge en moins de 3 secondes** afin de **ne pas quitter le site par impatience** |
| **Priorité** | Must |
| **Complexité** | M |

## US-VIS-033 — Responsive mobile

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Performance |
| **Titre** | Naviguer sur mobile |
| **Description** | En tant que **visiteur sur smartphone**, je souhaite **que le site soit parfaitement responsive** afin de **pouvoir m'inscrire depuis mon téléphone** |
| **Priorité** | Must |
| **Complexité** | M |

## US-VIS-034 — Dark mode

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | UX |
| **Titre** | Utiliser le mode sombre |
| **Description** | En tant que **visiteur**, je souhaite **que le site respecte mes préférences de thème système** afin de **ne pas être ébloui** |
| **Priorité** | Should |
| **Complexité** | S |

## US-VIS-035 — Plan du site

| Champ | Valeur |
|-------|--------|
| **Module** | Visiteur |
| **Epic** | Navigation |
| **Titre** | Accéder au plan du site |
| **Description** | En tant que **visiteur**, je souhaite **avoir un plan du site en pied de page** afin de **trouver rapidement toutes les pages disponibles** |
| **Priorité** | Could |
| **Complexité** | S |

---

# Module 2 : Authentification (US-AUTH-001 → US-AUTH-035)

## US-AUTH-001 — Connexion par email et mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Se connecter avec email et mot de passe |
| **Description** | En tant que **membre**, je souhaite **me connecter avec mon adresse email et mon mot de passe** afin de **d'accéder à mon espace membre sécurisé** |
| **Valeur métier** | Accès sécurisé à la plateforme, point d'entrée unique |
| **Préconditions** | Le membre possède un compte actif |
| **Déclencheur** | L'utilisateur clique sur "Se connecter" |
| **Scénario principal** | 1. L'utilisateur saisit email + mot de passe 2. Le système valide les identifiants via Better Auth 3. Une session est créée (valable 7 jours) 4. Redirection vers `/dashboard` |
| **Alternatives** | 1. L'utilisateur clique "Mot de passe oublié" → redirection vers `/forgot-password` |
| **Exceptions** | 1. Email incorrect → message "Email ou mot de passe incorrect" 2. Mot de passe incorrect → message générique 3. Compte inactif (`isActive = false`) → message "Compte désactivé" 4. Rate limit dépassé (5 tentatives/minute) → blocage temporaire |
| **Règles métier** | BR-AUTH-001 : Session expire après 7 jours d'inactivité BR-AUTH-002 : Rate limiting : 5 tentatives/min par email BR-AUTH-003 : Message d'erreur générique (ne pas divulguer si l'email existe) |
| **Permissions** | Aucune (public) |
| **Données** | `Session`, `User`, `Account` |
| **Notifications** | Audit : connexion réussie/échouée |
| **Sécurité** | Rate limiting : 5/min ; Message générique ; Session HttpOnly/Secure/SameSite |
| **Critères d'acceptation** | Given un membre avec un compte valide, When il se connecte avec email+mot de passe, Then une session est créée et il est redirigé vers `/dashboard` |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-002 — Visualisation du mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Afficher/masquer le mot de passe |
| **Description** | En tant que **membre**, je souhaite **pouvoir afficher ou masquer mon mot de passe en cliquant sur une icône œil** afin de **vérifier ma saisie** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-AUTH-003 — Lien mot de passe oublié

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Accéder à la réinitialisation du mot de passe |
| **Description** | En tant que **membre**, je souhaite **cliquer sur "Mot de passe oublié"** afin de **lancer le processus de réinitialisation** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-004 — Lien d'inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Accéder à l'inscription depuis la connexion |
| **Description** | En tant que **visiteur**, je souhaite **cliquer sur "Créer un compte" depuis la page de connexion** afin de **m'inscrire** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-005 — Demande de réinitialisation de mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Réinitialisation mot de passe |
| **Titre** | Demander la réinitialisation du mot de passe |
| **Description** | En tant que **membre ayant oublié mon mot de passe**, je souhaite **saisir mon email et recevoir un lien de réinitialisation** afin de **créer un nouveau mot de passe** |
| **Valeur métier** | Récupération d'accès, réduction des tickets support |
| **Préconditions** | Le membre possède un compte avec un email valide |
| **Scénario principal** | 1. L'utilisateur saisit son email 2. Le système vérifie que l'email existe 3. Un email de réinitialisation est envoyé (synchrone, via `sendResetPasswordEmail`) 4. Message de confirmation affiché "Si un compte existe, un email a été envoyé" |
| **Exceptions** | 1. Email inexistant → message générique (même que succès) 2. Rate limit dépassé (3/heure) → blocage temporaire |
| **Règles métier** | BR-AUTH-004 : Ne pas divulguer si l'email existe BR-AUTH-005 : Rate limiting : 3 demandes/heure BR-AUTH-006 : Lien de réinitialisation expire en 1 heure |
| **Notifications** | Email : template `resetPasswordEmail` (synchrone) ; Audit : `password.reset.requested` |
| **Sécurité** | Rate limiting ; Lien à usage unique ; Expiration 1h |
| **Critères d'acceptation** | Given un membre, When il demande la réinitialisation, Then un email est envoyé avec un lien valide 1 heure |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-006 — Réinitialisation du mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Réinitialisation mot de passe |
| **Titre** | Réinitialiser le mot de passe |
| **Description** | En tant que **membre**, je souhaite **saisir un nouveau mot de passe depuis le lien de réinitialisation** afin de **récupérer l'accès à mon compte** |
| **Scénario principal** | 1. L'utilisateur clique sur le lien reçu par email 2. Le formulaire de nouveau mot de passe s'affiche 3. L'utilisateur saisit et confirme son nouveau mot de passe 4. Le mot de passe est mis à jour 5. Redirection vers `/login` avec message de confirmation |
| **Exceptions** | 1. Token expiré → message "Lien expiré, veuillez refaire une demande" 2. Token déjà utilisé → message "Lien déjà utilisé" |
| **Critères d'acceptation** | Given un membre avec un token valide, When il réinitialise son mot de passe, Then son mot de passe est mis à jour et il peut se connecter |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-007 — Déconnexion

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Se déconnecter |
| **Description** | En tant que **membre connecté**, je souhaite **cliquer sur "Déconnexion"** afin de **mettre fin à ma session** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-008 — Session persistante

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Session persistante 7 jours |
| **Description** | En tant que **membre**, je souhaite **rester connecté pendant 7 jours** afin de **ne pas avoir à me reconnecter à chaque visite** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-009 — Expiration de session

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Session expirée |
| **Description** | En tant que **membre inactif depuis 7 jours**, je souhaite **être déconnecté automatiquement** afin de **protéger mon compte** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-010 — Redirection après connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Redirection après connexion |
| **Description** | En tant que **membre**, je souhaite **être redirigé vers la page que je voulais visiter avant la connexion** afin de **ne pas perdre mon contexte** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUTH-011 — Consultation des sessions actives

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Voir mes sessions actives |
| **Description** | En tant que **membre**, je souhaite **consulter la liste de mes sessions actives** afin de **savoir où je suis connecté** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUTH-012 — Révocation de session

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Révoquer une session |
| **Description** | En tant que **membre**, je souhaite **révoquer une session spécifique** afin de **déconnecter un appareil que je n'utilise plus** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUTH-013 — Détection de nouvel appareil

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Notification de nouvel appareil |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification lors de la connexion depuis un nouvel appareil** afin de **détecter une éventuelle intrusion** |
| **Priorité** | Should |
| **Complexité** | M |

## US-AUTH-014 — Vérification en deux étapes (2FA)

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Activer la 2FA |
| **Description** | En tant que **membre**, je souhaite **activer la vérification en deux étapes via une application d'authentification** afin de **renforcer la sécurité de mon compte** |
| **Priorité** | Should |
| **Complexité** | L |

## US-AUTH-015 — Codes de récupération 2FA

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Utiliser un code de récupération 2FA |
| **Description** | En tant que **membre ayant perdu l'accès à mon application 2FA**, je souhaite **utiliser un code de récupération** afin de **ne pas être bloqué** |
| **Priorité** | Should |
| **Complexité** | M |

## US-AUTH-016 -- Connexion via magic link

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Se connecter via magic link |
| **Description** | En tant que **membre**, je souhaite **recevoir un lien de connexion par email** afin de **me connecter sans mot de passe** |
| **Priorité** | Could |
| **Complexité** | M |

## US-AUTH-017 — Blocage après tentatives échouées

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Blocage temporaire après échecs |
| **Description** | En tant que **membre**, je souhaite **être temporairement bloqué après 5 tentatives de connexion échouées** afin de **protéger mon compte contre le brute-force** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-018 — Rate limiting inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Limitation des inscriptions |
| **Description** | En tant que **système**, je souhaite **limiter les inscriptions à 3 par heure par IP** afin de **prévenir les créations de comptes en masse** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-019 — Rate limiting reset password

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Limitation des demandes de reset |
| **Description** | En tant que **système**, je souhaite **limiter les demandes de reset de mot de passe à 3 par heure** afin de **prévenir le spam** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-020 — Protection CSRF

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Protection contre les attaques CSRF |
| **Description** | En tant que **système**, je souhaite **protéger les formulaires contre les attaques CSRF** afin de **garantir que les actions viennent bien de l'utilisateur** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-021 — Headers de sécurité

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Appliquer les headers de sécurité |
| **Description** | En tant que **système**, je souhaite **appliquer les headers Content-Security-Policy, X-Frame-Options, X-Content-Type-Options** afin de **protéger contre les attaques XSS et clickjacking** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUTH-022 — Session hijacking prevention

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Protéger les cookies de session |
| **Description** | En tant que **système**, je souhaite **configurer les cookies de session avec les flags HttpOnly, Secure, SameSite=Lax** afin de **prévenir le vol de session** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-023 — Connexion après réinitialisation

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Réinitialisation mot de passe |
| **Titre** | Se connecter après réinitialisation |
| **Description** | En tant que **membre ayant réinitialisé mon mot de passe**, je souhaite **être redirigé vers la page de connexion avec un message de confirmation** afin de **me connecter avec mon nouveau mot de passe** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-024 — Force du mot de passe

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Valider la force du mot de passe |
| **Description** | En tant que **système**, je souhaite **valider que le mot de passe respecte les règles de sécurité (8+ caractères, majuscule, minuscule, chiffre, spécial)** afin de **garantir des comptes sécurisés** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-025 — Vérification email après inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Vérification email |
| **Titre** | Vérifier son email après inscription |
| **Description** | En tant que **nouveau membre**, je souhaite **recevoir un email de vérification après mon inscription** afin de **confirmer mon adresse email** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-026 — Lien de vérification valable 24h

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Vérification email |
| **Titre** | Lien de vérification avec expiration |
| **Description** | En tant que **système**, je souhaite **que le lien de vérification expire après 24 heures** afin de **garantir la sécurité** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-027 — Renvoi de l'email de vérification

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Vérification email |
| **Titre** | Renvoyer l'email de vérification |
| **Description** | En tant que **membre n'ayant pas reçu l'email de vérification**, je souhaite **cliquer sur "Renvoyer l'email"** afin de **recevoir un nouveau lien** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUTH-028 — Authentification via OAuth Google

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | OAuth |
| **Titre** | Se connecter avec Google |
| **Description** | En tant que **visiteur**, je souhaite **me connecter ou m'inscrire avec mon compte Google** afin de **gagner du temps** |
| **Priorité** | Could |
| **Complexité** | M |

## US-AUTH-029 — Lien vers l'inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Connexion |
| **Titre** | Lien vers l'inscription |
| **Description** | En tant que **visiteur sur la page de connexion**, je souhaite **voir un lien "Créer un compte"** afin de **m'inscrire si je n'ai pas encore de compte** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-030 — Page de connexion responsive

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | UX |
| **Titre** | Page de connexion adaptée mobile |
| **Description** | En tant que **membre sur mobile**, je souhaite **que la page de connexion s'affiche correctement sur mon écran** afin de **me connecter depuis mon téléphone** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-031 — États de chargement connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | UX |
| **Titre** | Voir un état de chargement pendant la connexion |
| **Description** | En tant que **membre**, je souhaite **voir un indicateur de chargement pendant la validation** afin de **savoir que la requête est en cours** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-AUTH-032 — Message d'erreur de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | UX |
| **Titre** | Voir un message d'erreur explicite |
| **Description** | En tant que **membre**, je souhaite **voir un message d'erreur clair en cas d'échec de connexion** afin de **comprendre quoi faire** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-033 — Protection contre l'énumération d'emails

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Sécurité |
| **Titre** | Message générique pour email inconnu |
| **Description** | En tant que **système**, je souhaite **afficher un message générique "Email ou mot de passe incorrect"** afin de **ne pas divulguer si l'email existe** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUTH-034 — Session API uniquement

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Authentification des requêtes API |
| **Description** | En tant que **système**, je souhaite **vérifier la session sur chaque requête API nécessitant une authentification** afin de **protéger les données** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUTH-035 — Middleware de protection des routes

| Champ | Valeur |
|-------|--------|
| **Module** | Authentification |
| **Epic** | Session |
| **Titre** | Middleware de protection des routes |
| **Description** | En tant que **système**, je souhaite **vérifier l'authentification et le statut onboarding via le middleware Next.js** afin de **protéger toutes les routes** |
| **Priorité** | Must |
| **Complexité** | M |

---

# Module 3 : Profil utilisateur (US-PRO-001 → US-PRO-025)

## US-PRO-001 — Consultation du profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Consulter mon profil |
| **Description** | En tant que **membre connecté**, je souhaite **accéder à mon profil** afin de **voir mes informations personnelles** |
| **Valeur métier** | Gestion des données personnelles |
| **Préconditions** | Session active |
| **Scénario principal** | 1. L'utilisateur clique sur "Profil" dans la navigation 2. Le système affiche nom, email, téléphone, WhatsApp, pays, fuseau horaire, langue et statut onboarding |
| **Permissions** | Authentification requise |
| **Données** | `User` (name, email, phone, whatsapp, country, language, timezone, onboardingStatus) |
| **Critères d'acceptation** | Given un membre connecté, When il accède à son profil, Then ses informations sont affichées |
| **Priorité** | Must |
| **Complexité** | XS |

## US-PRO-002 — Modification du nom

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Modifier mon nom |
| **Description** | En tant que **membre**, je souhaite **modifier mon prénom et mon nom** afin de **mettre à jour mon identité** |
| **Priorité** | Must |
| **Complexité** | S |

## US-PRO-003 — Modification du téléphone

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Modifier mon numéro de téléphone |
| **Description** | En tant que **membre**, je souhaite **mettre à jour mon numéro de téléphone** afin de **rester joignable** |
| **Priorité** | Should |
| **Complexité** | S |

## US-PRO-004 — Modification du WhatsApp

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Modifier mon WhatsApp |
| **Description** | En tant que **membre**, je souhaite **mettre à jour mon numéro WhatsApp** afin de **recevoir les communications** |
| **Priorité** | Should |
| **Complexité** | S |

## US-PRO-005 — Modification du pays

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Changer mon pays |
| **Description** | En tant que **membre**, je souhaite **modifier mon pays de résidence** afin de **mettre à jour ma localisation** |
| **Priorité** | Should |
| **Complexité** | S |

## US-PRO-006 — Modification du fuseau horaire

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Changer mon fuseau horaire |
| **Description** | En tant que **membre**, je souhaite **modifier mon fuseau horaire** afin de **recevoir les notifications aux heures adaptées** |
| **Priorité** | Should |
| **Complexité** | S |

## US-PRO-007 — Modification de la langue

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Changer la langue de l'interface |
| **Description** | En tant que **membre**, je souhaite **modifier la langue de l'interface** afin de **naviguer dans ma langue** |
| **Priorité** | Could |
| **Complexité** | S |

## US-PRO-008 — Avatar par défaut

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir mon avatar avec initiales |
| **Description** | En tant que **membre**, je souhaite **voir un avatar avec mes initiales** afin de **personnaliser mon compte** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-PRO-009 — Upload d'avatar

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Uploader une photo de profil |
| **Description** | En tant que **membre**, je souhaite **uploader une photo de profil** afin de **personnaliser mon compte** |
| **Priorité** | Could |
| **Complexité** | M |

## US-PRO-010 — Badge de rôle

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir mon rôle |
| **Description** | En tant que **membre**, je souhaite **voir mon rôle affiché (Membre, Admin)** afin de **connaître mes permissions** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-PRO-011 — Statut onboarding dans le profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir mon statut d'onboarding |
| **Description** | En tant que **membre**, je souhaite **voir mon statut d'onboarding dans mon profil** afin de **savoir où j'en suis** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-PRO-012 — Sauvegarde du profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Sauvegarder les modifications du profil |
| **Description** | En tant que **membre**, je souhaite **sauvegarder mes modifications** afin de **les appliquer** |
| **Priorité** | Must |
| **Complexité** | S |

## US-PRO-013 — Message de confirmation de sauvegarde

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir une confirmation après sauvegarde |
| **Description** | En tant que **membre**, je souhaite **voir un message de confirmation après la sauvegarde** afin de **savoir que c'est pris en compte** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-PRO-014 — Validation des champs du profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Valider les champs avant sauvegarde |
| **Description** | En tant que **système**, je souhaite **valider les champs avec Zod avant la sauvegarde** afin de **garantir l'intégrité des données** |
| **Priorité** | Must |
| **Complexité** | S |

## US-PRO-015 — Email en lecture seule

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir mon email en lecture seule |
| **Description** | En tant que **membre**, je souhaite **voir mon email sans pouvoir le modifier** afin de **protéger mon identifiant de connexion** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-PRO-016 — Indicateur de vérification email

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir si mon email est vérifié |
| **Description** | En tant que **membre**, je souhaite **voir un indicateur de vérification de mon email** afin de **savoir si je dois encore le vérifier** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-PRO-017 — Changement de mot de passe depuis le profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Changer mon mot de passe |
| **Description** | En tant que **membre**, je souhaite **changer mon mot de passe depuis mon profil** afin de **mettre à jour régulièrement** |
| **Priorité** | Should |
| **Complexité** | M |

## US-PRO-018 — Suppression de compte

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Supprimer mon compte |
| **Description** | En tant que **membre**, je souhaite **demander la suppression de mon compte** afin de **ne plus utiliser le service** |
| **Priorité** | Should |
| **Complexité** | M |

## US-PRO-019 — Export de mes données

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Exporter mes données |
| **Description** | En tant que **membre**, je souhaite **exporter toutes mes données personnelles** afin de **respecter mon droit à la portabilité** |
| **Priorité** | Should |
| **Complexité** | L |

## US-PRO-020 — Activité récente

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Voir mon activité récente |
| **Description** | En tant que **membre**, je souhaite **voir mon activité récente (connexions, actions)** afin de **surveiller mon compte** |
| **Priorité** | Could |
| **Complexité** | M |

## US-PRO-021 — Confidentialité du profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Mes données sont protégées |
| **Description** | En tant que **membre**, je souhaite **que mes données personnelles ne soient accessibles qu'à moi et aux administrateurs** afin de **protéger ma vie privée** |
| **Priorité** | Must |
| **Complexité** | S |

## US-PRO-022 — Page profil responsive

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | UX |
| **Titre** | Profil adapté mobile |
| **Description** | En tant que **membre sur mobile**, je souhaite **que la page profil soit utilisable sur petit écran** afin de **modifier mes informations depuis mon téléphone** |
| **Priorité** | Must |
| **Complexité** | S |

## US-PRO-023 — États de chargement profil

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | UX |
| **Titre** | Voir un état de chargement |
| **Description** | En tant que **membre**, je souhaite **voir un indicateur de chargement pendant le chargement du profil** afin de **savoir que les données arrivent** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-PRO-024 — Gestion des préférences WhatsApp

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Activer/désactiver WhatsApp |
| **Description** | En tant que **membre**, je souhaite **activer ou désactiver la réception de messages WhatsApp** afin de **choisir mon canal de communication** |
| **Priorité** | Could |
| **Complexité** | S |

## US-PRO-025 — Préférences de notification

| Champ | Valeur |
|-------|--------|
| **Module** | Profil |
| **Epic** | Gestion du profil |
| **Titre** | Gérer mes préférences de notification |
| **Description** | En tant que **membre**, je souhaite **choisir les types de notifications que je reçois** afin de **ne pas être dérangé inutilement** |
| **Priorité** | Could |
| **Complexité** | M |

---

# Module 4 : Onboarding (US-ONB-001 → US-ONB-025)

## US-ONB-001 — Accès au parcours onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Parcours onboarding |
| **Titre** | Accéder au parcours onboarding |
| **Description** | En tant que **nouveau membre**, je souhaite **être redirigé vers le parcours onboarding après inscription** afin de **compléter les étapes requises** |
| **Valeur métier** | Activation des nouveaux membres, conformité KYC/AML |
| **Préconditions** | Inscription réussie, email non vérifié |
| **Déclencheur** | Redirection après inscription |
| **Scénario principal** | 1. L'utilisateur arrive sur `/onboarding` 2. Le système détecte son statut (`PENDING_EMAIL`) 3. La première étape (vérification email) s'affiche |
| **Exceptions** | 1. L'utilisateur est déjà ACTIF → redirection vers `/dashboard` |
| **Règles métier** | BR-ONB-001 : L'ordre des étapes est obligatoire BR-ONB-002 : Le statut progresse séquentiellement |
| **Données** | `User.onboardingStatus` |
| **Critères d'acceptation** | Given un nouveau membre, When il accède à `/onboarding`, Then la première étape non complétée s'affiche |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-002 — Visualisation de la progression

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Parcours onboarding |
| **Titre** | Voir ma progression onboarding |
| **Description** | En tant que **membre en onboarding**, je souhaite **voir une barre de progression avec les étapes restantes** afin de **savoir où j'en suis** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-003 — Réception du code OTP

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Vérification email |
| **Titre** | Recevoir un code OTP par email |
| **Description** | En tant que **membre en onboarding**, je souhaite **recevoir un code OTP à 6 chiffres par email** afin de **vérifier mon adresse email** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-004 — Saisie du code OTP

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Vérification email |
| **Titre** | Saisir le code OTP |
| **Description** | En tant que **membre**, je souhaite **saisir le code OTP à 6 chiffres** afin de **valider mon email** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-005 — Expiration du code OTP

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Vérification email |
| **Titre** | Code OTP expiré |
| **Description** | En tant que **membre**, je souhaite **voir un message si mon code OTP a expiré (>15min)** afin de **demander un nouveau code** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-006 — Renvoi du code OTP

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Vérification email |
| **Titre** | Demander un nouveau code OTP |
| **Description** | En tant que **membre**, je souhaite **cliquer sur "Renvoyer le code"** afin de **recevoir un nouvel OTP** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-007 — Complétion profil onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Profil |
| **Titre** | Compléter mon profil onboarding |
| **Description** | En tant que **membre**, je souhaite **saisir mon pays, ma langue et mon fuseau horaire** afin de **personnaliser mon expérience** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-008 — Passage au statut KYC_PENDING

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Transition |
| **Titre** | Passer à l'étape KYC |
| **Description** | En tant que **système**, je souhaite **mettre à jour le statut onboarding vers KYC_PENDING après validation de l'email** afin de **débloquer l'étape suivante** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-009 — Passage au statut BROKER_PENDING

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Transition |
| **Titre** | Passer à l'étape Broker |
| **Description** | En tant que **système**, je souhaite **mettre à jour le statut vers BROKER_PENDING après soumission KYC** afin de **débloquer l'étape broker** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-010 — Passage au statut REVIEW_PENDING

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Transition |
| **Titre** | Passer en revue |
| **Description** | En tant que **système**, je souhaite **mettre à jour le statut vers REVIEW_PENDING après soumission broker** afin de **notifier les admins** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-011 — Passage au statut ACTIVE

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Transition |
| **Titre** | Devenir membre actif |
| **Description** | En tant que **système**, je souhaite **mettre à jour le statut vers ACTIVE après approbation admin** afin de **donner accès aux signaux** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-012 — Checklist onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | UX |
| **Titre** | Voir la checklist onboarding |
| **Description** | En tant que **membre en onboarding**, je souhaite **voir une checklist des étapes complétées et restantes** afin de **visualiser mon avancement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ONB-013 — Sauvegarde de progression

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | UX |
| **Titre** | Sauvegarder ma progression |
| **Description** | En tant que **membre**, je souhaite **que ma progression soit sauvegardée** afin de **pouvoir quitter et reprendre plus tard** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-014 — Redirection après onboarding complété

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | UX |
| **Titre** | Accéder au dashboard après onboarding |
| **Description** | En tant que **membre actif**, je souhaite **être redirigé vers le dashboard** afin de **commencer à utiliser le service** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ONB-015 — Blocage d'accès au dashboard

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Sécurité |
| **Titre** | Blocage d'accès sans onboarding complet |
| **Description** | En tant que **système**, je souhaite **bloquer l'accès au dashboard si l'onboarding n'est pas terminé** afin de **garantir la conformité** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ONB-016 — Email onboarding bienvenue

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Notifications |
| **Titre** | Recevoir email de bienvenue |
| **Description** | En tant que **membre ayant vérifié son email**, je souhaite **recevoir un email de bienvenue avec la checklist** afin de **savoir quelles sont les prochaines étapes** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ONB-017 — Email progression onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Notifications |
| **Titre** | Recevoir email à chaque étape |
| **Description** | En tant que **membre**, je souhaite **recevoir un email après chaque étape complétée** afin de **rester informé** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ONB-018 — Annulation d'inscription

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Parcours onboarding |
| **Titre** | Annuler mon inscription |
| **Description** | En tant que **membre en onboarding**, je souhaite **pouvoir annuler mon processus d'inscription** afin de **ne pas continuer** |
| **Priorité** | Could |
| **Complexité** | S |

## US-ONB-019 — Reprise après déconnexion

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Parcours onboarding |
| **Titre** | Reprendre l'onboarding après déconnexion |
| **Description** | En tant que **membre**, je souhaite **retrouver ma progression onboardings après m'être reconnecté** afin de **continuer où j'en étais** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-020 — Email de relance onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Notifications |
| **Titre** | Recevoir un email de relance |
| **Description** | En tant que **membre n'ayant pas complété l'onboarding depuis 48h**, je souhaite **recevoir un email de relance** afin de **ne pas oublier de finaliser** |
| **Priorité** | Could |
| **Complexité** | M |

## US-ONB-021 — Conservation des drafts KYC

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | UX |
| **Titre** | Sauvegarder les documents KYC en brouillon |
| **Description** | En tant que **membre**, je souhaite **sauvegarder mes documents KYC en brouillon (IndexedDB)** afin de **ne pas tout re-uploader si je quitte** |
| **Priorité** | Could |
| **Complexité** | M |

## US-ONB-022 — Consultation du statut onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | API |
| **Titre** | Récupérer le statut onboarding |
| **Description** | En tant que **système**, je souhaite **exposer une API GET /api/onboarding/state** afin de **permettre au frontend et au middleware de connaître le statut** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-023 — Calcul de la progression

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | API |
| **Titre** | Calculer le pourcentage de progression |
| **Description** | En tant que **système**, je souhaite **calculer le pourcentage de progression basé sur les étapes complétées** afin de **l'afficher dans l'UI** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ONB-024 — Passage du middleware onboarding

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | Sécurité |
| **Titre** | Vérifier l'onboarding dans le middleware |
| **Description** | En tant que **système**, je souhaite **vérifier le statut onboarding via une API dédiée dans le middleware** afin de **ne pas utiliser la session (qui manque les champs customs)** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ONB-025 — Page de statut en attente

| Champ | Valeur |
|-------|--------|
| **Module** | Onboarding |
| **Epic** | UX |
| **Titre** | Voir l'écran d'attente de validation |
| **Description** | En tant que **membre en REVIEW_PENDING**, je souhaite **voir un écran "En attente de validation"** afin de **savoir que mon dossier est en cours de traitement** |
| **Priorité** | Must |
| **Complexité** | S |

---

# Module 5 : KYC (US-KYC-001 → US-KYC-035)

## US-KYC-001 — Soumission d'un document d'identité

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Soumettre un document d'identité |
| **Description** | En tant que **membre en onboarding**, je souhaite **uploader une photo recto de ma pièce d'identité (carte d'identité, passeport ou permis)** afin de **prouver mon identité** |
| **Valeur métier** | Conformité réglementaire KYC/AML, prévention de la fraude |
| **Préconditions** | `onboardingStatus = KYC_PENDING` |
| **Scénario principal** | 1. L'utilisateur sélectionne le type de document 2. Il uploade la photo recto 3. Le système stocke le fichier et crée un `KycDocument` avec status `PENDING` 4. Le statut onboarding passe à `BROKER_PENDING` |
| **Exceptions** | 1. Fichier trop volumineux (>10MB) → rejet 2. Format non supporté → rejet 3. Rate limit dépassé (5/heure) → blocage |
| **Règles métier** | BR-KYC-001 : Formats acceptés : jpg, png, webp BR-KYC-002 : Taille max : 10MB BR-KYC-003 : Rate limiting : 5 uploads/heure |
| **Données** | `KycDocument` (documentType, frontFilePath, status), `User.onboardingStatus` |
| **Sécurité** | Validation de type MIME ; Rate limiting ; Stockage hors du répertoire web |
| **Critères d'acceptation** | Given un membre en KYC_PENDING, When il soumet un document valide, Then le document est stocké et le statut passe à BROKER_PENDING |
| **Priorité** | Must |
| **Complexité** | M |

## US-KYC-002 — Upload recto/verso

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Uploader recto et verso |
| **Description** | En tant que **membre**, je souhaite **uploader le recto ET le verso de ma pièce d'identité** afin de **fournir toutes les faces** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-003 — Upload selfie

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Uploader un selfie |
| **Description** | En tant que **membre**, je souhaite **uploader un selfie avec ma pièce d'identité** afin de **prouver que je suis bien le titulaire** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-004 — Types de documents acceptés

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Choisir le type de document |
| **Description** | En tant que **membre**, je souhaite **choisir entre Carte d'identité, Passeport ou Permis de conduire** afin de **soumettre le document dont je dispose** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-KYC-005 — Preview des fichiers uploadés

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Voir un aperçu des fichiers uploadés |
| **Description** | En tant que **membre**, je souhaite **voir un aperçu visuel des fichiers que j'ai uploadés** afin de **vérifier qu'ils sont lisibles** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-006 — Ré-upload après rejet

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Soumettre à nouveau après rejet |
| **Description** | En tant que **membre dont le KYC a été rejeté**, je souhaite **soumettre de nouveaux documents** afin de **corriger les problèmes signalés** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-007 — Conservation des fichiers KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Cycle de vie |
| **Titre** | Conservation limitée des fichiers KYC |
| **Description** | En tant que **système**, je souhaite **supprimer les fichiers KYC 7 jours après la décision (approbation/rejet)** afin de **libérer de l'espace** |
| **Priorité** | Should |
| **Complexité** | M |

## US-KYC-008 — Upload par glisser-déposer

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Uploader par glisser-déposer |
| **Description** | En tant que **membre**, je souhaite **glisser-déposer mes fichiers** afin de **faciliter l'upload** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-009 — Barre de progression upload

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Voir la progression de l'upload |
| **Description** | En tant que **membre**, je souhaite **voir une barre de progression pendant l'upload** afin de **savoir où ça en est** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-010 — Notification de soumission KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Notifications |
| **Titre** | Notifier l'admin de la soumission KYC |
| **Description** | En tant que **système**, je souhaite **créer une notification pour les admins quand un KYC est soumis** afin de **les alerter** |
| **Priorité** | Should |
| **Complexité** | M |

## US-KYC-011 — Notification de décision KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Notifications |
| **Titre** | Notifier le membre de la décision KYC |
| **Description** | En tant que **système**, je souhaite **notifier le membre (in-app + email) quand son KYC est approuvé ou rejeté** afin de **l'informer** |
| **Priorité** | Must |
| **Complexité** | M |

## US-KYC-012 — Audit KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Audit |
| **Titre** | Journaliser les actions KYC |
| **Description** | En tant que **système**, je souhaite **journaliser dans AuditLog les actions de soumission et de review KYC** afin de **garder une trace** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-013 — Consultation KYC par admin

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Administration |
| **Titre** | Consulter les documents KYC soumis |
| **Description** | En tant qu'**administrateur**, je souhaite **voir les documents KYC soumis par les membres** afin de **les vérifier** |
| **Priorité** | Must |
| **Complexité** | M |

## US-KYC-014 — Approbation KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Administration |
| **Titre** | Approuver un document KYC |
| **Description** | En tant qu'**administrateur**, je souhaite **approuver un document KYC** afin de **valider l'identité du membre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-015 — Rejet KYC avec motif

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Administration |
| **Titre** | Rejeter un document KYC avec motif |
| **Description** | En tant qu'**administrateur**, je souhaite **rejeter un document KYC avec un motif obligatoire** afin de **permettre au membre de corrigerses documents** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-016 — Affichage des documents KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Administration |
| **Titre** | Afficher les documents KYC dans l'admin |
| **Description** | En tant qu'**administrateur**, je souhaite **afficher les images des documents KYC** afin de **les vérifier visuellement** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-017 — Protection des fichiers KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Sécurité |
| **Titre** | Protéger l'accès aux fichiers KYC |
| **Description** | En tant que **système**, je souhaite **restreindre l'accès aux fichiers KYC : admin ou propriétaire uniquement** afin de **protéger les données sensibles** |
| **Priorité** | Must |
| **Complexité** | M |

## US-KYC-018 — Anti-path traversal

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Sécurité |
| **Titre** | Bloquer les tentatives de path traversal |
| **Description** | En tant que **système**, je souhaite **bloquer les tentatives d'accès aux fichiers via path traversal (../)** afin de **sécuriser le système de fichiers** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-019 — Types MIME validation

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Sécurité |
| **Titre** | Valider le type MIME des fichiers uploadés |
| **Description** | En tant que **système**, je souhaite **valider le type MIME des fichiers uploadés** afin de **prévenir l'upload de fichiers exécutables** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-020 — Limite de taille de fichier KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Sécurité |
| **Titre** | Limiter la taille des fichiers KYC |
| **Description** | En tant que **système**, je souhaite **limiter la taille des fichiers KYC à 10MB** afin de **prévenir la saturation du stockage** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-KYC-021 — Validation du type de document

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Validation |
| **Titre** | Valider le type de document |
| **Description** | En tant que **système**, je souhaite **valider que le type de document est parmi ID_CARD, PASSPORT, DRIVERS_LICENSE** afin de **garantir l'intégrité des données** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-KYC-022 — Soumission KYC depuis le dashboard

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Accéder à la soumission KYC depuis le dashboard |
| **Description** | En tant que **membre en onboarding**, je souhaite **accéder à la soumission KYC depuis le dashboard si mon statut le permet** afin de **continuer mon onboarding** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-023 — Guide de qualité photo

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Voir les consignes de qualité photo |
| **Description** | En tant que **membre**, je souhaite **voir un guide illustré des consignes de qualité photo** afin de **prendre une photo acceptable** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-024 — Prise de photo via caméra

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Prendre une photo avec la caméra |
| **Description** | En tant que **membre sur mobile**, je souhaite **prendre une photo directement avec la caméra** afin de **faciliter la soumission** |
| **Priorité** | Could |
| **Complexité** | M |

## US-KYC-025 — Re-soumission après correction

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Soumettre à nouveau avec les corrections demandées |
| **Description** | En tant que **membre dont le KYC a été rejeté**, je souhaite **voir le motif du rejet et pouvoir soumettre de nouveaux documents** afin de **corriger** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-026 — Suppression automatique des fichiers KYC rejetés

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Cycle de vie |
| **Titre** | Nettoyage automatique KYC |
| **Description** | En tant que **système**, je souhaite **supprimer les fichiers KYC rejetés après un délai** afin de **libérer de l'espace** |
| **Priorité** | Should |
| **Complexité** | M |

## US-KYC-027 — Indicateur de vérification KYC dans le profil

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Voir le statut KYC dans le profil |
| **Description** | En tant que **membre**, je souhaite **voir le statut de ma vérification KYC dans mon profil** afin de **savoir si je suis vérifié** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-KYC-028 — Upload de plusieurs documents

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Soumission KYC |
| **Titre** | Uploader plusieurs documents à la fois |
| **Description** | En tant que **membre**, je souhaite **uploader le recto et le verso en une seule fois** afin de **gagner du temps** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-029 — Email de confirmation KYC soumis

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Notifications |
| **Titre** | Recevoir un email de confirmation de soumission |
| **Description** | En tant que **membre**, je souhaite **recevoir un email confirmant que mes documents KYC ont été reçus** afin de **savoir que la demande est en cours** |
| **Priorité** | Should |
| **Complexité** | S |

## US-KYC-030 — Email d'approbation KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Notifications |
| **Titre** | Recevoir un email d'approbation KYC |
| **Description** | En tant que **membre**, je souhaite **recevoir un email lorsque mon KYC est approuvé** afin de **passer à l'étape suivante** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-031 — Email de rejet KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Notifications |
| **Titre** | Recevoir un email de rejet KYC |
| **Description** | En tant que **membre**, je souhaite **recevoir un email avec le motif du rejet KYC** afin de **corriger mes documents** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-032 — Permission de review KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Administration |
| **Titre** | Permission spécifique pour la review KYC |
| **Description** | En tant que **système**, je souhaite **nécessiter la permission `kyc.review` pour approuver/rejeter un KYC** afin de **contrôler les accès** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-033 — Délai de traitement KYC

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Métier |
| **Titre** | Traitement KYC sous 24-48h |
| **Description** | En tant que **membre**, je souhaite **que mon KYC soit traité sous 24-48h ouvrées** afin de **ne pas attendre trop longtemps** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-KYC-034 — Upload depuis mobile

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | UX |
| **Titre** | Uploader depuis un mobile |
| **Description** | En tant que **membre sur mobile**, je souhaite **uploader mes documents KYC depuis mon téléphone** afin de **pouvoir le faire n'importe où** |
| **Priorité** | Must |
| **Complexité** | S |

## US-KYC-035 — Résolution d'image minimale

| Champ | Valeur |
|-------|--------|
| **Module** | KYC |
| **Epic** | Validation |
| **Titre** | Valider la résolution de l'image |
| **Description** | En tant que **système**, je souhaite **vérifier que l'image a une résolution minimale** afin de **garantir que le document est lisible** |
| **Priorité** | Could |
| **Complexité** | M |


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
| **Titre** | Gérer la rotation automatique des tokens |
| **Description** | En tant que **système**, je souhaite **gérer la rotation automatique des tokens API** afin de **renouveler les accès expirés** |
| **Priorité** | Should |
| **Complexité** | M |

## US-BRK-018 — Journalisation des accès broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Journaliser tous les accès aux données broker |
| **Description** | En tant que **système**, je souhaite **journaliser tous les accès aux données broker** afin de **tracer les actions suspectes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-BRK-019 — Masquage des identifiants dans l'UI

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Masquer les clés API dans l'interface |
| **Description** | En tant que **système**, je souhaite **masquer les clés API dans l'interface utilisateur** afin de **ne pas exposer les secrets** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-020 — Révocation d'accès broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | Sécurité |
| **Titre** | Révoquer l'accès au broker suspect |
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

## US-BRK-022 — Notification de perte de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Recevoir une alerte de perte de connexion |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification si la connexion broker est perdue** afin de **réagir rapidement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-023 — Guide de connexion broker

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Consulter un guide de connexion pas-à-pas |
| **Description** | En tant que **membre**, je souhaite **consulter un guide pas-à-pas pour connecter mon broker** afin de **faciliter la configuration** |
| **Priorité** | Should |
| **Complexité** | S |

## US-BRK-024 — Résultat du test de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Voir le résultat du test de connexion |
| **Description** | En tant que **membre**, je souhaite **voir le résultat du test de connexion (succès/échec)** afin de **savoir si la configuration est correcte** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-BRK-025 — Réassurance sécurité

| Champ | Valeur |
|-------|--------|
| **Module** | Vérification Broker |
| **Epic** | UX |
| **Titre** | Voir un récapitulatif des mesures de sécurité |
| **Description** | En tant que **membre**, je souhaite **voir un récapitulatif des mesures de sécurité appliquées** afin de **connecter mon broker en confiance** |
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
| **Titre** | Sélectionner un niveau d'abonnement |
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
| **Titre** | Suivre l'état de ma demande d'accès |
| **Description** | En tant que **membre**, je souhaite **voir le statut de ma demande d'accès (PENDING, APPROVED, REJECTED)** afin de **savoir où j'en suis** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-006 — Approbation manuelle

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Approbation |
| **Titre** | Approuver manuellement une demande |
| **Description** | En tant que **admin**, je souhaite **approuver manuellement une demande d'accès** afin de **valider le membre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-007 — Rejet avec motif

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
| **Titre** | Approuver automatiquement les demandes |
| **Description** | En tant que **système**, je souhaite **approuver automatiquement les demandes des membres éligibles** afin de **réduire le temps d'attente** |
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
| **Description** | En tant que **membre**, je souhaite **recevoir une notification avec le motif de rejet** afin de **comprendre pourquoi** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ACC-011 — Création d'abonnement

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Abonnement |
| **Titre** | Créer un abonnement actif après approbation |
| **Description** | En tant que **système**, je souhaite **créer un abonnement actif après approbation de la demande** afin de **donner accès aux signaux** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ACC-012 — Détails de l'abonnement

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
| **Description** | En tant que **membre**, je souhaite **renouveler mon abonnement avant son expiration** afin de **ne pas perdre l'accès aux signaux** |
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

## US-ACC-016 — Accès à la liste des signaux

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

## US-ACC-018 — Restrictions par niveau

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Restreindre les signaux par niveau |
| **Description** | En tant que **système**, je souhaite **restreindre certains signaux selon le niveau d'abonnement** afin de **réserver les signaux premium** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ACC-019 — Vérification d'accès en temps réel

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Vérifier l'accès avant affichage |
| **Description** | En tant que **système**, je souhaite **vérifier l'accès du membre avant chaque affichage de signal** afin de **garantir la sécurité** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ACC-020 — Page d'accès restreint

| Champ | Valeur |
|-------|--------|
| **Module** | Gestion des accès |
| **Epic** | Accès signaux |
| **Titre** | Voir la page d'accès restreint |
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

## US-SIG-002 — Paire de trading affichée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la paire de trading sur chaque signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir la paire de trading (ex: BTC/USDT) sur chaque signal** afin de **savoir quel actif est concerné** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-003 — Direction du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la direction du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir la direction du signal (BUY/SELL)** afin de **connaître le sens de la recommandation** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-004 — Prix d'entrée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir le prix d'entrée recommandé |
| **Description** | En tant que **membre abonné**, je souhaite **voir le prix d'entrée recommandé** afin de **savoir à quel niveau ouvrir la position** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-005 — Statut du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir le statut du signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir le statut du signal (ACTIVE, TARGET_HIT, STOPPED, EXPIRED)** afin de **suivre son évolution** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-006 — Écart prix actuel/entrée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir l'écart entre prix actuel et entrée |
| **Description** | En tant que **membre abonné**, je souhaite **voir la différence entre le prix actuel et le prix d'entrée** afin de **mesurer la performance en temps réel** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-007 — Date de publication

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Voir la date de publication |
| **Description** | En tant que **membre abonné**, je souhaite **voir la date et l'heure de publication du signal** afin de **connaître son ancienneté** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-008 — Scroll infini

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Parcourir les signaux par scroll infini |
| **Description** | En tant que **membre abonné**, je souhaite **faire défiler la liste avec une pagination infinie** afin de **naviguer sans interruption** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-009 — Rafraîchissement automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Affichage liste |
| **Titre** | Rafraîchir automatiquement la liste |
| **Description** | En tant que **membre abonné**, je souhaite **que la liste se rafraîchisse automatiquement toutes les 30s** afin de **voir les nouveaux signaux en temps réel** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-010 — Badge de signaux non lus

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
| **Description** | En tant que **membre abonné**, je souhaite **ouvrir la vue détaillée d'un signal** afin de **voir toutes les informations (analyse, niveaux)** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-012 — Objectifs de take profit

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir les niveaux de take profit |
| **Description** | En tant que **membre abonné**, je souhaite **voir les niveaux de take profit (TP1, TP2, TP3)** afin de **planifier mes sorties** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-013 — Stop Loss affiché

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir le stop loss recommandé |
| **Description** | En tant que **membre abonné**, je souhaite **voir le niveau de stop loss recommandé** afin de **gérer mon risque** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-014 — Analyse détaillée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Lire l'analyse détaillée |
| **Description** | En tant que **membre abonné**, je souhaite **lire l'analyse détaillée accompagnant le signal** afin de **comprendre la recommandation** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-015 — Graphique intégré

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Détail signal |
| **Titre** | Voir un graphique de prix intégré |
| **Description** | En tant que **membre abonné**, je souhaite **voir un graphique de prix intégré dans le détail** afin de **visualiser l'analyse technique** |
| **Priorité** | Could |
| **Complexité** | L |

## US-SIG-016 — Recherche par mot-clé

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Rechercher un signal par mot-clé |
| **Description** | En tant que **membre abonné**, je souhaite **rechercher un signal par mot-clé dans le titre ou l'analyse** afin de **trouver rapidement un signal spécifique** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-017 — Filtre par paire

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
| **Titre** | Filtrer par direction BUY/SELL |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par direction** afin de **cibler un type de trade** |
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

## US-SIG-020 — Filtre par période

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Recherche & Filtres |
| **Titre** | Filtrer les signaux par date |
| **Description** | En tant que **membre abonné**, je souhaite **filtrer les signaux par période (aujourd'hui, semaine, mois)** afin de **consulter les signaux récents** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-021 — Regroupement par jour

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Grouper les signaux par jour |
| **Description** | En tant que **membre abonné**, je souhaite **voir les signaux groupés par jour avec séparateur "Aujourd'hui", "Hier", date** afin de **naviguer chronologiquement** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-022 — Section "Aujourd'hui"

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Voir un en-tête "Aujourd'hui" |
| **Description** | En tant que **membre abonné**, je souhaite **voir un en-tête "Aujourd'hui" pour les signaux du jour** afin de **repérer les plus récents** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SIG-023 — Section "Hier"

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Voir un en-tête "Hier" |
| **Description** | En tant que **membre abonné**, je souhaite **voir un en-tête "Hier" pour les signaux de la veille** afin de **distinguer les jours** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-024 — Indicateur de premier signal du jour

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Groupement par date |
| **Titre** | Marquer le premier signal du jour |
| **Description** | En tant que **membre abonné**, je souhaite **qu'un indicateur visuel signale le premier signal d'aujourd'hui** afin de **repérer le début de journée** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SIG-025 — Collapse/Expand par groupe

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
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge coloré (vert=TP, rouge=stop, bleu=actif)** afin de **comprendre le statut d'un coup d'œil** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SIG-027 — Badge BUY/SELL

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
| **Titre** | Voir un badge "Nouveau" |
| **Description** | En tant que **membre abonné**, je souhaite **voir un badge "Nouveau" sur les signaux de moins d'1h** afin de **repérer les signaux frais** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-029 — Icône TP atteint

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Voir une icône quand un TP est touché |
| **Description** | En tant que **membre abonné**, je souhaite **voir une coche quand un take profit est atteint** afin de **célébrer le gain** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-030 — Indicateur de signal copié

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Badges & Statuts |
| **Titre** | Savoir si j'ai déjà copié un signal |
| **Description** | En tant que **membre abonné**, je souhaite **voir une indication si j'ai déjà exécuté ce signal** afin de **ne pas le refaire** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-031 — Notification push nouveau signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Recevoir une notification push |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification push dès qu'un signal est publié** afin de **réagir rapidement** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SIG-032 — Notification email

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Recevoir un email récapitulatif |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir un email des nouveaux signaux** afin de **ne rien manquer même hors ligne** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-033 — Notification take profit

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Être notifié quand un TP est atteint |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification quand un take profit est atteint** afin de **clôturer ma position** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-034 — Notification stop loss

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Être notifié quand le SL est touché |
| **Description** | En tant que **membre abonné**, je souhaite **recevoir une notification quand le stop loss est atteint** afin de **limiter mes pertes** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-035 — Paramètres de notification

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Notifications signaux |
| **Titre** | Configurer les notifications par événement |
| **Description** | En tant que **membre abonné**, je souhaite **choisir pour quels événements recevoir des notifications** afin de **personnaliser mon expérience** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-036 — Ajout aux favoris

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Ajouter un signal aux favoris |
| **Description** | En tant que **membre abonné**, je souhaite **ajouter un signal à mes favoris** afin de **le retrouver facilement** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-037 — Vue des favoris

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

## US-SIG-039 — Étoile de favori

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Voir une étoile sur les signaux favoris |
| **Description** | En tant que **membre abonné**, je souhaite **voir une étoile remplie sur les signaux en favoris** afin de **les identifier dans la liste** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SIG-040 — Favoris multi-sessions

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Favoris |
| **Titre** | Sauvegarder les favoris sur le compte |
| **Description** | En tant que **membre abonné**, je souhaite **que mes favoris soient liés à mon compte** afin de **les retrouver sur tous mes appareils** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-041 — Export PDF

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Exporter un signal en PDF |
| **Description** | En tant que **membre abonné**, je souhaite **exporter un signal en PDF** afin de **le consulter hors ligne** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-042 — Export CSV

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Exporter la liste en CSV |
| **Description** | En tant que **membre abonné**, je souhaite **exporter la liste filtrée des signaux en CSV** afin de **l'analyser dans un tableur** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-043 — Partage par lien

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Partager un signal par lien |
| **Description** | En tant que **membre abonné**, je souhaite **copier un lien de partage pour un signal** afin de **le partager avec d'autres membres** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SIG-044 — Copie rapide des infos

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Copier les détails du signal |
| **Description** | En tant que **membre abonné**, je souhaite **copier les infos clés (paire, prix, TP, SL)** afin de **les coller dans ma plateforme de trading** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SIG-045 — Image du signal

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Export |
| **Titre** | Générer une image stylisée du signal |
| **Description** | En tant que **membre abonné**, je souhaite **générer une image stylisée du signal** afin de **la partager sur les réseaux sociaux** |
| **Priorité** | Could |
| **Complexité** | L |

## US-SIG-046 — Ratio de réussite global

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le ratio de réussite global |
| **Description** | En tant que **membre abonné**, je souhaite **voir le % de signaux ayant atteint au moins un TP** afin de **mesurer la performance** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SIG-047 — Performance par paire

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir la performance par paire |
| **Description** | En tant que **membre abonné**, je souhaite **voir le taux de réussite par paire de trading** afin de **savoir quels actifs performent** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SIG-048 — Graphique performance cumulée

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le graphique de performance cumulée |
| **Description** | En tant que **membre abonné**, je souhaite **voir un graphique de la performance cumulée dans le temps** afin de **visualiser la tendance** |
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

## US-SIG-050 — Temps moyen avant TP

| Champ | Valeur |
|-------|--------|
| **Module** | Trading Signals |
| **Epic** | Performance |
| **Titre** | Voir le délai moyen avant take profit |
| **Description** | En tant que **membre abonné**, je souhaite **voir le temps moyen entre publication et atteinte du TP** afin de **gérer mes attentes temporelles** |
| **Priorité** | Could |
| **Complexité** | M |

---

# Module 9 : Notifications (US-NOT-001 → US-NOT-035)

## US-NOT-001 — Centre de notifications

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Centre de notifications |
| **Titre** | Accéder au centre de notifications |
| **Description** | En tant que **membre connecté**, je souhaite **accéder à un centre de notifications centralisé** afin de **consulter l'historique de toutes mes notifications** |
| **Valeur métier** | Amélioration de l'engagement, suivi des événements importants |
| **Préconditions** | Session active, au moins une notification existante |
| **Déclencheur** | L'utilisateur clique sur l'icône cloche dans la barre de navigation |
| **Scénario principal** | 1. L'utilisateur clique sur l'icône de notifications 2. Le système affiche le panneau des notifications 3. Les notifications sont listées par date décroissante 4. Chaque notification affiche : icône, titre, message, date relative, statut (lue/non lue) |
| **Alternatives** | 1. Aucune notification → message "Aucune notification" avec illustration |
| **Exceptions** | 1. Erreur réseau → message "Impossible de charger les notifications" avec bouton réessayer |
| **Règles métier** | BR-NOT-001 : Les notifications sont conservées 90 jours BR-NOT-002 : Les notifications non lues apparaissent en gras |
| **Permissions** | Authentification requise |
| **Données** | `Notification` (id, userId, type, title, message, read, createdAt) |
| **Notifications** | Audit : consultation du centre de notifications |
| **Sécurité** | RBAC : seul le propriétaire voit ses notifications |
| **Critères d'acceptation** | Given un membre connecté avec des notifications, When il ouvre le centre, Then il voit ses notifications triées par date |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-002 — Marquer comme lue

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Centre de notifications |
| **Titre** | Marquer une notification comme lue |
| **Description** | En tant que **membre**, je souhaite **cliquer sur une notification pour la marquer comme lue** afin de **suivre ce que j'ai déjà consulté** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-NOT-003 — Marquer tout comme lu

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Centre de notifications |
| **Titre** | Marquer toutes les notifications comme lues |
| **Description** | En tant que **membre**, je souhaite **cliquer sur "Tout marquer comme lu"** afin de **vider rapidement le badge de notifications** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-NOT-004 — Badge de notifications

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Centre de notifications |
| **Titre** | Voir le badge de notifications non lues |
| **Description** | En tant que **membre**, je souhaite **voir un badge avec le nombre de notifications non lues sur l'icône cloche** afin de **savoir si j'ai des alertes sans ouvrir le centre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-005 — Supprimer une notification

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Centre de notifications |
| **Titre** | Supprimer une notification |
| **Description** | En tant que **membre**, je souhaite **supprimer une notification individuellement** afin de **nettoyer mon historique** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-NOT-006 — Notification in-app

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Canaux |
| **Titre** | Recevoir une notification in-app en temps réel |
| **Description** | En tant que **membre connecté**, je souhaite **recevoir les notifications en temps réel dans l'application** afin de **ne rien manquer sans recharger la page** |
| **Priorité** | Must |
| **Complexité** | L |

## US-NOT-007 — Notification par email

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Canaux |
| **Titre** | Recevoir une notification par email |
| **Description** | En tant que **membre**, je souhaite **recevoir certaines notifications par email** afin de **rester informé même hors ligne** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-008 — Notification push mobile

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Canaux |
| **Titre** | Recevoir une notification push mobile |
| **Description** | En tant que **membre sur mobile**, je souhaite **recevoir des notifications push** afin de **rester informé même sans ouvrir l'application** |
| **Priorité** | Should |
| **Complexité** | L |

## US-NOT-009 — Notification WhatsApp

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Canaux |
| **Titre** | Recevoir une notification WhatsApp |
| **Description** | En tant que **membre**, je souhaite **recevoir certaines notifications via WhatsApp** afin de **bénéficier d'un canal instantané et familier** |
| **Priorité** | Could |
| **Complexité** | XL |

## US-NOT-010 — Notification SMS

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Canaux |
| **Titre** | Recevoir une notification par SMS |
| **Description** | En tant que **membre**, je souhaite **recevoir des notifications critiques par SMS** afin de **garantir la réception des alertes importantes** |
| **Priorité** | Should |
| **Complexité** | L |

## US-NOT-011 — Template de notification

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Templates |
| **Titre** | Définir un template de notification |
| **Description** | En tant qu'**administrateur**, je souhaite **créer des templates de notification avec variables dynamiques** afin de **standardiser les messages envoyés** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-012 — Variables dynamiques dans les templates

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Templates |
| **Titre** | Utiliser des variables dynamiques dans les templates |
| **Description** | En tant qu'**administrateur**, je souhaite **utiliser des variables comme {{user.name}} ou {{signal.type}} dans les templates** afin de **personnaliser chaque notification** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-013 — Template multilingue

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Templates |
| **Titre** | Gérer des templates multilingues |
| **Description** | En tant qu'**administrateur**, je souhaite **définir des templates dans plusieurs langues** afin de **respecter la langue préférée du membre** |
| **Priorité** | Should |
| **Complexité** | M |

## US-NOT-014 — Aperçu du template

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Templates |
| **Titre** | Prévisualiser un template |
| **Description** | En tant qu'**administrateur**, je souhaite **prévisualiser un template avant de l'enregistrer** afin de **vérifier le rendu final** |
| **Priorité** | Should |
| **Complexité** | S |

## US-NOT-015 — Template par canal

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Templates |
| **Titre** | Associer un template à un canal |
| **Description** | En tant qu'**administrateur**, je souhaite **définir un template différent selon le canal (email, push, in-app)** afin de **optimiser le message pour chaque support** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-016 — File d'attente de notifications

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | File d'attente |
| **Titre** | Mettre une notification en file d'attente |
| **Description** | En tant que **système**, je souhaite **placer les notifications dans une file d'attente asynchrone** afin de **ne pas bloquer le thread principal** |
| **Priorité** | Must |
| **Complexité** | L |

## US-NOT-017 — Priorité dans la file d'attente

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | File d'attente |
| **Titre** | Définir une priorité dans la file d'attente |
| **Description** | En tant que **système**, je souhaite **attribuer une priorité (haute, normale, basse) à chaque notification** afin de **traiter les alertes critiques en premier** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-018 — File d'attente par canal

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | File d'attente |
| **Titre** | File d'attente séparée par canal |
| **Description** | En tant que **système**, je souhaite **avoir une file d'attente distincte par canal (email, push, SMS)** afin de **gérer indépendamment les débits de chaque canal** |
| **Priorité** | Should |
| **Complexité** | L |

## US-NOT-019 — Retry automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | File d'attente |
| **Titre** | Réessayer automatiquement l'envoi |
| **Description** | En tant que **système**, je souhaite **réessayer automatiquement l'envoi d'une notification en cas d'échec** afin de **garantir la délivrance** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-020 — Dead letter queue

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | File d'attente |
| **Titre** | Gérer les notifications en échec |
| **Description** | En tant qu'**administrateur**, je souhaite **consulter les notifications en dead letter queue** afin de **diagnostiquer les problèmes d'envoi** |
| **Priorité** | Should |
| **Complexité** | M |

## US-NOT-021 — Préférences de notifications

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Préférences |
| **Titre** | Gérer mes préférences de notifications |
| **Description** | En tant que **membre**, je souhaite **choisir les types de notifications que je reçois et sur quel canal** afin de **contrôler ma réception d'alertes** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-022 — Activer/désactiver un canal

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Préférences |
| **Titre** | Activer ou désactiver un canal |
| **Description** | En tant que **membre**, je souhaite **activer ou désactiver complètement un canal (email, push, in-app)** afin de **choisir comment je suis notifié** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-023 — Préférences par type d'événement

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Préférences |
| **Titre** | Configurer les préférences par type d'événement |
| **Description** | En tant que **membre**, je souhaite **choisir pour chaque type d'événement (signal, KYC, compte) le canal de notification** afin de **recevoir uniquement ce qui m'intéresse** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-024 — Pause notifications

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Préférences |
| **Titre** | Mettre les notifications en pause |
| **Description** | En tant que **membre**, je souhaite **activer un mode "Ne pas déranger" temporaire** afin de **ne pas être dérangé pendant une période définie** |
| **Priorité** | Could |
| **Complexité** | S |

## US-NOT-025 — Plage horaire silencieuse

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Préférences |
| **Titre** | Définir une plage horaire silencieuse |
| **Description** | En tant que **membre**, je souhaite **définir une plage horaire sans notifications** afin de **ne pas être dérangé la nuit** |
| **Priorité** | Could |
| **Complexité** | S |

## US-NOT-026 — Envoi d'email transactionnel

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Envoi email |
| **Titre** | Envoyer un email transactionnel |
| **Description** | En tant que **système**, je souhaite **envoyer des emails transactionnels (confirmation, réinitialisation, bienvenue)** afin de **communiquer des informations critiques au membre** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-027 — Envoi d'email marketing

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Envoi email |
| **Titre** | Envoyer un email marketing |
| **Description** | En tant qu'**administrateur**, je souhaite **envoyer des emails marketing à une liste de membres** afin de **promouvoir les nouvelles offres** |
| **Priorité** | Should |
| **Complexité** | M |

## US-NOT-028 — Template d'email responsive

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Envoi email |
| **Titre** | Utiliser un template d'email responsive |
| **Description** | En tant que **système**, je souhaite **utiliser des templates d'email responsives** afin de **garantir un affichage correct sur mobile et desktop** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-029 — Suivi des ouvertures d'email

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Envoi email |
| **Titre** | Suivre les ouvertures d'email |
| **Description** | En tant qu'**administrateur**, je souhaite **suivre les taux d'ouverture des emails envoyés** afin de **mesurer l'efficacité des campagnes** |
| **Priorité** | Could |
| **Complexité** | M |

## US-NOT-030 — Désabonnement email

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Envoi email |
| **Titre** | Se désabonner des emails marketing |
| **Description** | En tant que **membre**, je souhaite **me désabonner des emails marketing via un lien en bas de chaque email** afin de **ne plus recevoir de promotions** |
| **Priorité** | Must |
| **Complexité** | S |

## US-NOT-031 — Webhook de notification

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Webhooks |
| **Titre** | Configurer un webhook sortant |
| **Description** | En tant qu'**administrateur**, je souhaite **configurer un webhook pour être notifié des événements** afin de **intégrer la plateforme avec des systèmes externes** |
| **Priorité** | Should |
| **Complexité** | L |

## US-NOT-032 — Signature de webhook

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Webhooks |
| **Titre** | Signer les payloads de webhook |
| **Description** | En tant que **système**, je souhaite **signer chaque payload de webhook avec une clé secrète** afin de **garantir l'authenticité des notifications** |
| **Priorité** | Must |
| **Complexité** | M |

## US-NOT-033 — Logs de webhook

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Webhooks |
| **Titre** | Consulter les logs d'envoi de webhook |
| **Description** | En tant qu'**administrateur**, je souhaite **consulter l'historique des envois de webhook avec statut (succès/échec)** afin de **diagnostiquer les pannes d'intégration** |
| **Priorité** | Should |
| **Complexité** | M |

## US-NOT-034 — Retry webhook

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Webhooks |
| **Titre** | Réessayer un webhook en échec |
| **Description** | En tant qu'**administrateur**, je souhaite **déclencher manuellement un réessai de webhook** afin de **rejouer un événement après correction** |
| **Priorité** | Could |
| **Complexité** | S |

## US-NOT-035 — Filtrage par événement

| Champ | Valeur |
|-------|--------|
| **Module** | Notifications |
| **Epic** | Webhooks |
| **Titre** | Filtrer les webhooks par type d'événement |
| **Description** | En tant qu'**administrateur**, je souhaite **choisir quels types d'événements déclenchent un webhook** afin de **recevoir uniquement les notifications pertinentes** |
| **Priorité** | Must |
| **Complexité** | M |

# Module 10 : Tableau de bord (US-DSH-001 → US-DSH-025)

## US-DSH-001 — Vue d'ensemble du tableau de bord

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Vue d'ensemble |
| **Titre** | Accéder à la vue d'ensemble du tableau de bord |
| **Description** | En tant que **membre connecté**, je souhaite **accéder à mon tableau de bord après connexion** afin de **voir en un coup d'œil les informations clés de mon activité de trading** |
| **Valeur métier** | Point d'entrée principal, rétention et engagement quotidien |
| **Préconditions** | Session active, abonnement actif |
| **Déclencheur** | Connexion réussie ou clic sur "Dashboard" dans la navigation |
| **Scénario principal** | 1. L'utilisateur se connecte ou clique sur "Dashboard" 2. Le système affiche la page `/dashboard` 3. La vue d'ensemble contient : KPIs en haut, graphiques récents, dernières notifications, derniers signaux 4. Les données sont mises à jour en temps réel via WebSocket |
| **Alternatives** | 1. Aucun signal reçu → section "Bienvenue, vos premiers signaux arriveront bientôt" |
| **Exceptions** | 1. Erreur API → message "Données temporairement indisponibles" avec fallback sur données mises en cache 2. Abonnement expiré → redirection vers `/plans` avec message |
| **Règles métier** | BR-DSH-001 : Les KPIs sont calculés sur les 30 derniers jours glissants BR-DSH-002 : Le cache dashboard expire toutes les 5 minutes |
| **Permissions** | Authentification requise, abonnement actif |
| **Données** | `DashboardStats`, `Signal[]`, `Notification[]`, `Account` |
| **Notifications** | WebSocket pour mise à jour temps réel |
| **Sécurité** | RBAC : données limitées au membre connecté ; Rate limiting : 30 requêtes/min |
| **Critères d'acceptation** | Given un membre connecté avec abonnement actif, When il accède à `/dashboard`, Then il voit les KPIs, les signaux récents et les notifications |
| **Priorité** | Must |
| **Complexité** | L |

## US-DSH-002 — Consultation des KPIs principaux

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Vue d'ensemble |
| **Titre** | Consulter les KPIs principaux |
| **Description** | En tant que **membre**, je souhaite **voir les KPIs principaux en haut du dashboard** afin de **connaître rapidement mon nombre de signaux, taux de réussite et trades pris** |
| **Priorité** | Must |
| **Complexité** | S |

## US-DSH-003 — Graphique de performance

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Vue d'ensemble |
| **Titre** | Visualiser un graphique de performance |
| **Description** | En tant que **membre**, je souhaite **voir un graphique d'évolution de ma performance sur 30 jours** afin de **visualiser ma progression** |
| **Priorité** | Must |
| **Complexité** | M |

## US-DSH-004 — Derniers signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Vue d'ensemble |
| **Titre** | Voir les derniers signaux |
| **Description** | En tant que **membre**, je souhaite **voir les 5 derniers signaux reçus sur le dashboard** afin de **réagir rapidement aux dernières opportunités** |
| **Priorité** | Must |
| **Complexité** | S |

## US-DSH-005 — Bouton d'action rapide

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Vue d'ensemble |
| **Titre** | Accéder aux actions rapides |
| **Description** | En tant que **membre**, je souhaite **avoir des boutons d'action rapide (voir signaux, profil, support)** afin de **naviguer efficacement** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-DSH-006 — KPI taux de réussite

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | KPIs & Stats |
| **Titre** | Consulter le taux de réussite des signaux |
| **Description** | En tant que **membre**, je souhaite **voir mon taux de réussite global sur les signaux suivis** afin de **mesurer ma performance** |
| **Priorité** | Must |
| **Complexité** | M |

## US-DSH-007 — KPI nombre de trades

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | KPIs & Stats |
| **Titre** | Consulter le nombre de trades pris |
| **Description** | En tant que **membre**, je souhaite **voir le nombre total de trades que j'ai réalisés** afin de **mesurer mon activité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-DSH-008 — KPI P&L estimé

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | KPIs & Stats |
| **Titre** | Consulter le P&L estimé |
| **Description** | En tant que **membre**, je souhaite **voir mon profit and loss estimé sur la période** afin de **connaître ma rentabilité** |
| **Priorité** | Must |
| **Complexité** | M |

## US-DSH-009 — Filtre de période

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | KPIs & Stats |
| **Titre** | Filtrer les KPIs par période |
| **Description** | En tant que **membre**, je souhaite **filtrer les KPIs par période (7j, 30j, 90j, 1 an)** afin de **voir mes stats sur différentes échelles** |
| **Priorité** | Should |
| **Complexité** | S |

## US-DSH-010 — Export des statistiques

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | KPIs & Stats |
| **Titre** | Exporter mes statistiques |
| **Description** | En tant que **membre**, je souhaite **exporter mes statistiques en CSV ou PDF** afin de **les partager ou les analyser en dehors de la plateforme** |
| **Priorité** | Could |
| **Complexité** | S |

## US-DSH-011 — Fil d'activité récente

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Activité récente |
| **Titre** | Consulter le fil d'activité récente |
| **Description** | En tant que **membre**, je souhaite **voir un fil chronologique de mon activité récente** afin de **suivre mes actions et événements** |
| **Priorité** | Must |
| **Complexité** | M |

## US-DSH-012 — Types d'événements dans l'activité

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Activité récente |
| **Titre** | Voir les différents types d'événements |
| **Description** | En tant que **membre**, je souhaite **voir des événements de types variés (signal reçu, trade pris, modification profil)** afin de **avoir une vue complète de mon activité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-DSH-013 — Pagination de l'activité

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Activité récente |
| **Titre** | Paginer l'historique d'activité |
| **Description** | En tant que **membre**, je souhaite **charger plus d'activités via un bouton "Voir plus"** afin de **consulter l'historique complet sans surcharger la page** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-DSH-014 — Filtre par type d'événement

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Activité récente |
| **Titre** | Filtrer l'activité par type |
| **Description** | En tant que **membre**, je souhaite **filtrer le fil d'activité par type d'événement** afin de **ne voir que ce qui m'intéresse** |
| **Priorité** | Could |
| **Complexité** | S |

## US-DSH-015 — Clic sur activité

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Activité récente |
| **Titre** | Accéder au détail depuis l'activité |
| **Description** | En tant que **membre**, je souhaite **cliquer sur un événement du fil d'activité** afin de **voir le détail complet (signal, document, etc.)** |
| **Priorité** | Should |
| **Complexité** | S |

## US-DSH-016 — Widget KPIs

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Widgets |
| **Titre** | Afficher un widget KPIs |
| **Description** | En tant que **membre**, je souhaite **avoir un widget récapitulatif des KPIs** afin de **consulter rapidement mes indicateurs clés** |
| **Priorité** | Must |
| **Complexité** | S |

## US-DSH-017 — Widget signaux récents

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Widgets |
| **Titre** | Afficher un widget des derniers signaux |
| **Description** | En tant que **membre**, je souhaite **avoir un widget listant les derniers signaux** afin de **voir les opportunités récentes** |
| **Priorité** | Must |
| **Complexité** | S |

## US-DSH-018 — Widget calendrier

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Widgets |
| **Titre** | Afficher un widget calendrier économique |
| **Description** | En tant que **membre**, je souhaite **avoir un widget calendrier des événements économiques** afin de **anticiper les mouvements de marché** |
| **Priorité** | Could |
| **Complexité** | M |

## US-DSH-019 — Widget graphique

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Widgets |
| **Titre** | Afficher un widget graphique de performance |
| **Description** | En tant que **membre**, je souhaite **avoir un widget graphique de ma performance** afin de **visualiser ma courbe de progression** |
| **Priorité** | Should |
| **Complexité** | M |

## US-DSH-020 — Widget actualités

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Widgets |
| **Titre** | Afficher un widget actualités financières |
| **Description** | En tant que **membre**, je souhaite **avoir un widget d'actualités financières en direct** afin de **rester informé des marchés** |
| **Priorité** | Could |
| **Complexité** | M |

## US-DSH-021 — Personnalisation de la disposition

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Personnalisation |
| **Titre** | Personnaliser la disposition des widgets |
| **Description** | En tant que **membre**, je souhaite **réorganiser les widgets par glisser-déposer** afin de **personnaliser mon tableau de bord** |
| **Priorité** | Should |
| **Complexité** | L |

## US-DSH-022 — Activer/désactiver des widgets

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Personnalisation |
| **Titre** | Afficher ou masquer des widgets |
| **Description** | En tant que **membre**, je souhaite **choisir quels widgets sont visibles sur mon dashboard** afin de **garder uniquement ce qui m'est utile** |
| **Priorité** | Should |
| **Complexité** | M |

## US-DSH-023 — Sauvegarde des préférences

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Personnalisation |
| **Titre** | Sauvegarder mes préférences de dashboard |
| **Description** | En tant que **membre**, je souhaite **que ma disposition personnalisée soit sauvegardée** afin de **retrouver mon dashboard à chaque connexion** |
| **Priorité** | Must |
| **Complexité** | S |

## US-DSH-024 — Mode sombre

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Personnalisation |
| **Titre** | Basculer le dashboard en mode sombre |
| **Description** | En tant que **membre**, je souhaite **basculer le dashboard en mode sombre** afin de **réduire la fatigue oculaire** |
| **Priorité** | Should |
| **Complexité** | S |

## US-DSH-025 — Réinitialisation par défaut

| Champ | Valeur |
|-------|--------|
| **Module** | Tableau de bord |
| **Epic** | Personnalisation |
| **Titre** | Réinitialiser la personnalisation |
| **Description** | En tant que **membre**, je souhaite **réinitialiser mon dashboard à la disposition par défaut** afin de **repartir sur une base standard** |
| **Priorité** | Could |
| **Complexité** | XS |

# Module 11 : Administration (US-ADM-001 → US-ADM-060)

## US-ADM-001 — Connexion admin

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Authentification admin |
| **Titre** | Me connecter à l'interface d'administration |
| **Description** | En tant qu'**administrateur**, je souhaite **accéder à `/admin/login` avec mes identifiants** afin de **gérer la plateforme** |
| **Valeur métier** | Accès sécurisé au back-office, gouvernance de la plateforme |
| **Préconditions** | Le compte admin existe et est actif ; l'utilisateur n'est pas connecté |
| **Déclencheur** | L'administrateur accède à `/admin/login` |
| **Scénario principal** | 1. L'admin saisit email + mot de passe 2. Le système vérifie le rôle `ADMIN` sur le compte 3. Si valide, une session admin est créée avec durée limitée 4. Redirection vers `/admin/dashboard` |
| **Alternatives** | 1. L'admin clique "Mot de passe oublié" → redirection vers `/admin/forgot-password` |
| **Exceptions** | 1. Compte non admin → message "Accès refusé" 2. Identifiants incorrects → message générique 3. Compte désactivé → message "Compte désactivé, contactez le super-admin" 4. Rate limit (10 tentatives/min, 30/min global) → blocage temporaire |
| **Règles métier** | BR-ADM-001 : Session admin expire après 4h d'inactivité BR-ADM-002 : Connexion admin logguée dans le journal d'audit BR-ADM-003 : Seuls les comptes avec `role = ADMIN` ou `SUPER_ADMIN` peuvent accéder |
| **Permissions** | Rôle `ADMIN` ou `SUPER_ADMIN` requis |
| **Données** | `Session`, `User` (avec filtre role) |
| **Notifications** | Journal d'audit : connexion admin réussie/échouée |
| **Sécurité** | Rate limiting : 10/min par IP, 30/min global ; Session HttpOnly/Secure/SameSite ; MFA obligatoire |
| **Critères d'acceptation** | Given un administrateur avec un compte valide, When il se connecte via `/admin/login`, Then une session admin est créée et il est redirigé vers `/admin/dashboard` |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-002 — MFA admin obligatoire

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Authentification admin |
| **Titre** | Authentifier avec MFA |
| **Description** | En tant qu'**administrateur**, je souhaite **saisir un code MFA après ma connexion** afin de **renforcer la sécurité du back-office** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-003 — Session admin limitée

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Authentification admin |
| **Titre** | Avoir une session admin à durée limitée |
| **Description** | En tant que **système**, je souhaite **limiter la durée de session admin à 4 heures** afin de **réduire les risques de session volée** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-004 — Déconnexion admin

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Authentification admin |
| **Titre** | Me déconnecter de l'admin |
| **Description** | En tant qu'**administrateur**, je souhaite **cliquer sur "Déconnexion"** afin de **terminer ma session admin** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-005 — Journalisation des connexions admin

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Authentification admin |
| **Titre** | Journaliser toutes les connexions admin |
| **Description** | En tant que **système**, je souhaite **journaliser chaque connexion et déconnexion admin** afin de **assurer la traçabilité** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-006 — Dashboard admin

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Dashboard admin |
| **Titre** | Accéder au dashboard admin |
| **Description** | En tant qu'**administrateur**, je souhaite **accéder à `/admin/dashboard`** afin de **voir les statistiques globales de la plateforme** |
| **Priorité** | Must |
| **Complexité** | L |

## US-ADM-007 — Statistiques globales

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Dashboard admin |
| **Titre** | Consulter les statistiques globales |
| **Description** | En tant qu'**administrateur**, je souhaite **voir le nombre total de membres, signaux envoyés, revenus, taux de conversion** afin de **piloter la plateforme** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-008 — Graphiques d'évolution

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Dashboard admin |
| **Titre** | Visualiser des graphiques d'évolution |
| **Description** | En tant qu'**administrateur**, je souhaite **voir des graphiques d'évolution (membres, signaux, revenus) sur 30 jours** afin de **suivre les tendances** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ADM-009 — Alertes système

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Dashboard admin |
| **Titre** | Voir les alertes système |
| **Description** | En tant qu'**administrateur**, je souhaite **voir les alertes système (file d'attente, échecs d'envoi)** afin de **réagir rapidement aux incidents** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-010 — Export du dashboard

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Dashboard admin |
| **Titre** | Exporter les données du dashboard |
| **Description** | En tant qu'**administrateur**, je souhaite **exporter les données du dashboard en PDF** afin de **les partager en réunion** |
| **Priorité** | Could |
| **Complexité** | S |

## US-ADM-011 — Liste des membres

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Gestion membres |
| **Titre** | Consulter la liste des membres |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste complète des membres avec pagination** afin de **gérer les utilisateurs** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-012 — Rechercher un membre

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Gestion membres |
| **Titre** | Rechercher un membre |
| **Description** | En tant qu'**administrateur**, je souhaite **rechercher un membre par nom, email ou téléphone** afin de **trouver rapidement un compte** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-013 — Filtrer les membres

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Gestion membres |
| **Titre** | Filtrer les membres par statut |
| **Description** | En tant qu'**administrateur**, je souhaite **filtrer les membres par statut (actif, inactif, KYC, onboarding)** afin de **cibler un segment** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-014 — Activer/désactiver un membre

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Gestion membres |
| **Titre** | Activer ou désactiver un membre |
| **Description** | En tant qu'**administrateur**, je souhaite **activer ou désactiver un membre** afin de **suspendre un accès si nécessaire** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-015 — Voir le détail d'un membre

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Gestion membres |
| **Titre** | Consulter le profil complet d'un membre |
| **Description** | En tant qu'**administrateur**, je souhaite **voir le profil complet d'un membre (informations, abonnement, historique)** afin de **avoir une vue 360°** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-016 — Liste des demandes d'accès

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Demandes d'accès |
| **Titre** | Consulter les demandes d'accès |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des demandes d'accès en attente** afin de **traiter les nouvelles inscriptions** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-017 — Approuver une demande d'accès

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Demandes d'accès |
| **Titre** | Approuver une demande d'accès |
| **Description** | En tant qu'**administrateur**, je souhaite **approuver une demande d'accès** afin de **valider l'entrée d'un nouveau membre** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-018 — Rejeter une demande d'accès

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Demandes d'accès |
| **Titre** | Rejeter une demande avec motif |
| **Description** | En tant qu'**administrateur**, je souhaite **rejeter une demande d'accès avec un motif** afin de **tenir le demandeur informé** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-019 — Notification de décision

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Demandes d'accès |
| **Titre** | Notifier le membre de la décision |
| **Description** | En tant que **système**, je souhaite **envoyer un email au membre lors de l'approbation ou du rejet** afin de **l'informer du statut de sa demande** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-020 — Filtre des demandes

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Demandes d'accès |
| **Titre** | Filtrer les demandes par statut |
| **Description** | En tant qu'**administrateur**, je souhaite **filtrer les demandes par statut (en attente, approuvée, rejetée)** afin de **prioriser mon travail** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-ADM-021 — Liste des KYC en attente

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review KYC |
| **Titre** | Consulter les KYC en attente de review |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des soumissions KYC en attente** afin de **les traiter** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-022 — Visualiser les documents KYC

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review KYC |
| **Titre** | Visualiser les documents KYC soumis |
| **Description** | En tant qu'**administrateur**, je souhaite **visualiser les documents uploadés par le membre** afin de **vérifier leur authenticité** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-023 — Approuver un KYC

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review KYC |
| **Titre** | Approuver une soumission KYC |
| **Description** | En tant qu'**administrateur**, je souhaite **approuver un KYC** afin de **valider l'identité du membre** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-024 — Rejeter un KYC avec motif

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review KYC |
| **Titre** | Rejeter un KYC avec motif détaillé |
| **Description** | En tant qu'**administrateur**, je souhaite **rejeter un KYC en précisant le motif** afin de **permettre au membre de corriger** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-025 — Historique KYC

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review KYC |
| **Titre** | Consulter l'historique KYC d'un membre |
| **Description** | En tant qu'**administrateur**, je souhaite **voir l'historique complet des soumissions KYC d'un membre** afin de **suivre les tentatives** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-026 — Liste des brokers en attente

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review Broker |
| **Titre** | Consulter les vérifications broker en attente |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des vérifications broker en attente** afin de **traiter les validations** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-027 — Visualiser les documents broker

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review Broker |
| **Titre** | Visualiser les documents broker |
| **Description** | En tant qu'**administrateur**, je souhaite **visualiser les justificatifs de compte broker** afin de **vérifier leur validité** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-028 — Approuver un broker

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review Broker |
| **Titre** | Approuver une vérification broker |
| **Description** | En tant qu'**administrateur**, je souhaite **approuver une vérification broker** afin de **permettre au membre de trader** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-029 — Rejeter un broker avec motif

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review Broker |
| **Titre** | Rejeter un broker avec motif |
| **Description** | En tant qu'**administrateur**, je souhaite **rejeter une vérification broker avec explication** afin de **guider le membre** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-030 — Recherche broker

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Review Broker |
| **Titre** | Rechercher une soumission broker |
| **Description** | En tant qu'**administrateur**, je souhaite **rechercher une vérification broker par nom ou email** afin de **retrouver un dossier spécifique** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-031 — Liste des signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Signaux |
| **Titre** | Consulter tous les signaux |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste complète des signaux émis** afin de **superviser l'activité** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-032 — Créer un signal

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Signaux |
| **Titre** | Créer un signal manuellement |
| **Description** | En tant qu'**administrateur**, je souhaite **créer un signal manuellement depuis l'admin** afin de **diffuser une alerte urgente** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-033 — Modifier un signal

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Signaux |
| **Titre** | Modifier un signal existant |
| **Description** | En tant qu'**administrateur**, je souhaite **modifier un signal (prix, commentaire)** afin de **corriger une erreur avant envoi** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-034 — Supprimer un signal

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Signaux |
| **Titre** | Supprimer un signal |
| **Description** | En tant qu'**administrateur**, je souhaite **supprimer un signal** afin de **retirer un signal erroné** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-ADM-035 — Filtrer les signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Signaux |
| **Titre** | Filtrer les signaux par statut et date |
| **Description** | En tant qu'**administrateur**, je souhaite **filtrer les signaux par type, statut ou période** afin de **retrouver un signal spécifique** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-036 — Liste des templates

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Templates |
| **Titre** | Consulter les templates de notification |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des templates de notification** afin de **les gérer** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-037 — Créer un template

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Templates |
| **Titre** | Créer un nouveau template |
| **Description** | En tant qu'**administrateur**, je souhaite **créer un template avec contenu et variables** afin de **standardiser les messages** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-038 — Modifier un template

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Templates |
| **Titre** | Modifier un template existant |
| **Description** | En tant qu'**administrateur**, je souhaite **modifier un template** afin de **mettre à jour son contenu** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-039 — Dupliquer un template

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Templates |
| **Titre** | Dupliquer un template |
| **Description** | En tant qu'**administrateur**, je souhaite **dupliquer un template existant** afin de **créer une variante rapidement** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-ADM-040 — Versioning des templates

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Templates |
| **Titre** | Consulter l'historique des versions |
| **Description** | En tant qu'**administrateur**, je souhaite **voir l'historique des modifications d'un template** afin de **revenir à une version antérieure** |
| **Priorité** | Could |
| **Complexité** | M |

## US-ADM-041 — Liste des plans

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Plans abonnement |
| **Titre** | Consulter les plans d'abonnement |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des plans d'abonnement** afin de **gérer l'offre** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-042 — Créer un plan

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Plans abonnement |
| **Titre** | Créer un plan d'abonnement |
| **Description** | En tant qu'**administrateur**, je souhaite **créer un plan avec nom, prix, durée, fonctionnalités** afin de **lancer une nouvelle offre** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-043 — Modifier un plan

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Plans abonnement |
| **Titre** | Modifier un plan existant |
| **Description** | En tant qu'**administrateur**, je souhaite **modifier les attributs d'un plan** afin de **mettre à jour l'offre** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-044 — Activer/désactiver un plan

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Plans abonnement |
| **Titre** | Activer ou désactiver un plan |
| **Description** | En tant qu'**administrateur**, je souhaite **activer ou désactiver un plan** afin de **le masquer sans le supprimer** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-ADM-045 — Ordre d'affichage des plans

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Plans abonnement |
| **Titre** | Définir l'ordre d'affichage des plans |
| **Description** | En tant qu'**administrateur**, je souhaite **définir l'ordre d'affichage des plans sur la page publique** afin de **mettre en avant certaines offres** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-ADM-046 — Liste des rôles

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Rôles & Permissions |
| **Titre** | Consulter les rôles et permissions |
| **Description** | En tant qu'**administrateur**, je souhaite **voir la liste des rôles avec leurs permissions** afin de **gérer les accès** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-047 — Créer un rôle

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Rôles & Permissions |
| **Titre** | Créer un rôle personnalisé |
| **Description** | En tant qu'**administrateur**, je souhaite **créer un rôle avec un ensemble de permissions** afin de **définir des profils d'accès** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-048 — Assigner un rôle à un membre

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Rôles & Permissions |
| **Titre** | Assigner un rôle à un membre |
| **Description** | En tant qu'**administrateur**, je souhaite **assigner un rôle à un membre** afin de **lui donner les droits appropriés** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-049 — Modifier les permissions d'un rôle

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Rôles & Permissions |
| **Titre** | Modifier les permissions d'un rôle |
| **Description** | En tant qu'**administrateur**, je souhaite **ajouter ou retirer des permissions à un rôle** afin de **l'adapter aux besoins** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ADM-050 — Supprimer un rôle

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Rôles & Permissions |
| **Titre** | Supprimer un rôle |
| **Description** | En tant qu'**administrateur**, je souhaite **supprimer un rôle** afin de **nettoyer ceux qui ne sont plus utilisés** |
| **Priorité** | Could |
| **Complexité** | S |

## US-ADM-051 — Configuration générale

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Configuration |
| **Titre** | Accéder à la configuration générale |
| **Description** | En tant qu'**administrateur**, je souhaite **accéder à une page de configuration générale** afin de **paramétrer la plateforme** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-052 — Configuration des emails

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Configuration |
| **Titre** | Configurer les paramètres SMTP |
| **Description** | En tant qu'**administrateur**, je souhaite **configurer les paramètres SMTP (hôte, port, credentials)** afin de **gérer l'envoi d'emails** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-053 — Configuration des signatures

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Configuration |
| **Titre** | Configurer les signatures de webhook |
| **Description** | En tant qu'**administrateur**, je souhaite **configurer les clés secrètes pour les webhooks** afin de **sécuriser les intégrations** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-054 — Configuration des limites

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Configuration |
| **Titre** | Configurer les limites système |
| **Description** | En tant qu'**administrateur**, je souhaite **configurer les limites (rate limiting, taille fichiers, délais)** afin de **protéger la plateforme** |
| **Priorité** | Should |
| **Complexité** | M |

## US-ADM-055 — Réinitialisation configuration

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Configuration |
| **Titre** | Réinitialiser un paramètre par défaut |
| **Description** | En tant qu'**administrateur**, je souhaite **réinitialiser un paramètre à sa valeur par défaut** afin de **corriger une erreur de configuration** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-ADM-056 — Consultation du journal d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Journal d'audit |
| **Titre** | Consulter le journal d'audit |
| **Description** | En tant qu'**administrateur**, je souhaite **consulter le journal d'audit complet** afin de **tracer toutes les actions sensibles** |
| **Priorité** | Must |
| **Complexité** | M |

## US-ADM-057 — Filtres du journal d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Journal d'audit |
| **Titre** | Filtrer le journal d'audit |
| **Description** | En tant qu'**administrateur**, je souhaite **filtrer le journal par type d'action, utilisateur et période** afin de **trouver des événements spécifiques** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-058 — Détail d'une entrée d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Journal d'audit |
| **Titre** | Voir le détail d'une entrée d'audit |
| **Description** | En tant qu'**administrateur**, je souhaite **cliquer sur une entrée pour voir les métadonnées complètes** afin de **comprendre ce qui s'est passé** |
| **Priorité** | Must |
| **Complexité** | S |

## US-ADM-059 — Export du journal d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Journal d'audit |
| **Titre** | Exporter le journal d'audit |
| **Description** | En tant qu'**administrateur**, je souhaite **exporter le journal d'audit en CSV** afin de **l'analyser en dehors de la plateforme** |
| **Priorité** | Should |
| **Complexité** | S |

## US-ADM-060 — Rétention du journal d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Administration |
| **Epic** | Journal d'audit |
| **Titre** | Configurer la rétention du journal d'audit |
| **Description** | En tant qu'**administrateur**, je souhaite **configurer la durée de rétention du journal d'audit** afin de **respecter les obligations légales** |
| **Priorité** | Should |
| **Complexité** | S |

---

# Module 12 : Paramètres (US-SET-001 → US-SET-025)

## US-SET-001 — Page des paramètres

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Général |
| **Titre** | Accéder à une page centralisée des paramètres |
| **Description** | En tant que **membre**, je souhaite **accéder à une page centralisée des paramètres** afin de **gérer l'ensemble des réglages de mon compte** |
| **Valeur métier** | Autonomie de l'utilisateur, réduction des tickets support |
| **Préconditions** | Le membre est connecté et possède une session active |
| **Déclencheur** | L'utilisateur clique sur "Paramètres" dans le menu utilisateur |
| **Scénario principal** | 1. L'utilisateur clique sur son avatar 2. Il sélectionne "Paramètres" 3. Le système affiche la page avec les onglets : Général, Notifications, Confidentialité, Apparence, Limites & Sécurité |
| **Exceptions** | 1. Session expirée → redirection vers la connexion 2. Permission insuffisante → message d'erreur |
| **Règles métier** | BR-SET-001 : Les onglets sont affichés selon les permissions du membre |
| **Données** | `User`, `UserSettings` |
| **Notifications** | Audit : accès à la page des paramètres |
| **Sécurité** | RBAC : authenticated users only |
| **Critères d'acceptation** | Given un membre connecté, When il accède aux paramètres, Then il voit les onglets disponibles selon ses permissions |
| **Priorité** | Must |
| **Complexité** | S |

## US-SET-002 — Modification du nom d'affichage

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Général |
| **Titre** | Modifier son nom d'affichage |
| **Description** | En tant que **membre**, je souhaite **modifier mon nom d'affichage** afin de **personnaliser mon profil** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SET-003 — Modification de la bio

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Général |
| **Titre** | Ajouter ou modifier sa biographie |
| **Description** | En tant que **membre**, je souhaite **ajouter ou modifier ma biographie** afin de **me présenter aux autres membres** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SET-004 — Modification de la langue

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Général |
| **Titre** | Changer la langue de l'interface |
| **Description** | En tant que **membre**, je souhaite **changer la langue de l'interface** afin de **utiliser la plateforme dans ma langue préférée** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-005 — Modification du fuseau horaire

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Général |
| **Titre** | Changer le fuseau horaire |
| **Description** | En tant que **membre**, je souhaite **définir mon fuseau horaire** afin de **voir les heures des signaux dans mon fuseau local** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SET-006 — Réglages des notifications push

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Notifications |
| **Titre** | Activer/désactiver les notifications push |
| **Description** | En tant que **membre**, je souhaite **activer ou désactiver les notifications push** afin de **ne pas être dérangé** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SET-007 — Réglages des notifications email

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Notifications |
| **Titre** | Choisir les notifications reçues par email |
| **Description** | En tant que **membre**, je souhaite **choisir quelles notifications je reçois par email** afin de **contrôler ma boîte de réception** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SET-008 — Réglages des notifications in-app

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Notifications |
| **Titre** | Choisir les notifications in-app |
| **Description** | En tant que **membre**, je souhaite **choisir quelles notifications in-app je reçois** afin de **personnaliser mon expérience** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-009 — Fréquence des emails récapitulatifs

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Notifications |
| **Titre** | Définir la fréquence des emails récapitulatifs |
| **Description** | En tant que **membre**, je souhaite **définir la fréquence des emails récapitulatifs (quotidien/hebdomadaire/jamais)** afin de **rester informé sans être submergé** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-010 — Notification pour les signaux importants

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Notifications |
| **Titre** | Notifications pour signaux à haute probabilité |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification uniquement pour les signaux avec probabilité ≥ 80%** afin de **me concentrer sur les meilleures opportunités** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SET-011 — Visibilité du profil

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Confidentialité |
| **Titre** | Définir la visibilité de mon profil |
| **Description** | En tant que **membre**, je souhaite **définir si mon profil est visible par tous ou par mes abonnés uniquement** afin de **contrôler ma visibilité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-012 — Masquer le portfolio

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Confidentialité |
| **Titre** | Masquer mon portfolio et performances |
| **Description** | En tant que **membre**, je souhaite **masquer mon portfolio et mes performances publiques** afin de **garder mes résultats privés** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SET-013 — Masquer mes signaux

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Confidentialité |
| **Titre** | Masquer l'historique de mes signaux |
| **Description** | En tant que **membre**, je souhaite **masquer l'historique de mes signaux reçus** afin de **ne pas dévoiler ma stratégie** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SET-014 — Refuser le partage de données

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Confidentialité |
| **Titre** | Refuser le partage de données d'analyse |
| **Description** | En tant que **membre**, je souhaite **refuser le partage de mes données d'utilisation** afin de **protéger ma vie privée** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SET-015 — Demander l'export de mes données

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Confidentialité |
| **Titre** | Demander l'export de mes données personnelles |
| **Description** | En tant que **membre**, je souhaite **demander l'export de toutes mes données personnelles** afin de **les consulter ou les transférer (RGPD)** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SET-016 — Mode sombre

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Apparence |
| **Titre** | Activer le mode sombre |
| **Description** | En tant que **membre**, je souhaite **activer le mode sombre** afin de **réduire la fatigue oculaire lors des sessions de trading nocturnes** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-017 — Mode clair

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Apparence |
| **Titre** | Activer le mode clair |
| **Description** | En tant que **membre**, je souhaite **activer le mode clair** afin de **préférer un affichage lumineux** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SET-018 — Mode automatique (système)

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Apparence |
| **Titre** | Suivre le thème du système |
| **Description** | En tant que **membre**, je souhaite **que l'interface suive le thème de mon système d'exploitation** afin de **ne pas avoir à changer manuellement** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SET-019 — Taille de la police

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Apparence |
| **Titre** | Modifier la taille de la police |
| **Description** | En tant que **membre**, je souhaite **augmenter ou diminuer la taille de la police** afin de **lire confortablement** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SET-020 — Disposition du dashboard

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Apparence |
| **Titre** | Personnaliser la disposition du tableau de bord |
| **Description** | En tant que **membre**, je souhaite **réorganiser les widgets de mon tableau de bord** afin de **voir mes informations préférées en premier** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SET-021 — Plafond de dépôt mensuel

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Limites & Sécurité |
| **Titre** | Définir un plafond de dépôt mensuel |
| **Description** | En tant que **membre**, je souhaite **définir un plafond de dépôt mensuel** afin de **contrôler mes investissements** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SET-022 — Limite de pertes quotidienne

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Limites & Sécurité |
| **Titre** | Définir une limite de pertes quotidienne |
| **Description** | En tant que **membre**, je souhaite **définir une limite de pertes quotidienne** afin de **ne pas dépasser un montant prédéfini** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SET-023 — Blacklist de brokers

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Limites & Sécurité |
| **Titre** | Blacklister des brokers |
| **Description** | En tant que **membre**, je souhaite **blacklister certains brokers** afin de **ne jamais recevoir de signaux pour ceux-ci** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SET-024 — Blacklist de paires

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Limites & Sécurité |
| **Titre** | Blacklister des paires de trading |
| **Description** | En tant que **membre**, je souhaite **blacklister certaines paires de trading** afin de **filtrer les signaux qui ne m'intéressent pas** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SET-025 — Réinitialisation des paramètres

| Champ | Valeur |
|-------|--------|
| **Module** | Paramètres |
| **Epic** | Limites & Sécurité |
| **Titre** | Réinitialiser tous les paramètres par défaut |
| **Description** | En tant que **membre**, je souhaite **réinitialiser tous mes paramètres aux valeurs par défaut** afin de **repartir d'une configuration vierge** |
| **Priorité** | Could |
| **Complexité** | S |

---

# Module 13 : Sécurité (US-SEC-001 → US-SEC-040)

## US-SEC-001 — Activation 2FA

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | 2FA |
| **Titre** | Activer l'authentification à deux facteurs |
| **Description** | En tant que **membre**, je souhaite **activer l'authentification à deux facteurs (2FA)** afin de **renforcer la sécurité de mon compte** |
| **Valeur métier** | Sécurité renforcée des comptes, conformité réglementaire |
| **Préconditions** | Le membre est connecté, mot de passe confirmé |
| **Déclencheur** | L'utilisateur clique sur "Activer la 2FA" dans les paramètres de sécurité |
| **Scénario principal** | 1. L'utilisateur clique sur "Activer la 2FA" 2. Le système génère une clé secrète et affiche un QR code 3. L'utilisateur scanne le QR code avec Google Authenticator 4. L'utilisateur saisit le code à 6 chiffres 5. Le système vérifie le code et active la 2FA 6. Des codes de récupération sont générés |
| **Exceptions** | 1. Code invalide → message d'erreur 2. QR code non scannable → saisie manuelle de la clé |
| **Règles métier** | BR-SEC-001 : TOTP (RFC 6238) BR-SEC-002 : 10 codes de récupération à usage unique |
| **Données** | `TwoFactorSecret`, `BackupCode` |
| **Notifications** | Email de confirmation d'activation ; Audit : activation 2FA |
| **Sécurité** | Clé secrète chiffrée ; Rate limiting : 3 tentatives |
| **Critères d'acceptation** | Given un membre connecté, When il active la 2FA avec un code valide, Then la 2FA est active et les codes de récupération sont affichés |
| **Priorité** | Must |
| **Complexité** | M |

## US-SEC-002 — Désactivation 2FA

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | 2FA |
| **Titre** | Désactiver la 2FA |
| **Description** | En tant que **membre**, je souhaite **désactiver la 2FA après confirmation** afin de **pouvoir désactiver la sécurité si nécessaire** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-003 — Connexion avec 2FA

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | 2FA |
| **Titre** | Se connecter avec 2FA |
| **Description** | En tant que **membre 2FA activé**, je souhaite **saisir un code TOTP après mon mot de passe** afin de **compléter la connexion sécurisée** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-004 — Codes de récupération 2FA

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | 2FA |
| **Titre** | Utiliser un code de récupération |
| **Description** | En tant que **membre sans accès à l'authenticator**, je souhaite **utiliser un code de récupération** afin de **me connecter et réinitialiser ma 2FA** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-005 — Régénérer les codes de récupération

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | 2FA |
| **Titre** | Régénérer les codes de récupération |
| **Description** | En tant que **membre**, je souhaite **régénérer mes codes de récupération 2FA** afin de **remplacer des codes compromis** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-006 — Liste des sessions actives

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Sessions |
| **Titre** | Consulter les sessions actives |
| **Description** | En tant que **membre**, je souhaite **voir la liste de mes sessions actives (appareil, navigateur, IP, date)** afin de **vérifier qu'aucune session inconnue n'est ouverte** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-007 — Déconnexion d'une session distante

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Sessions |
| **Titre** | Mettre fin à une session distante |
| **Description** | En tant que **membre**, je souhaite **mettre fin à une session spécifique** afin de **déconnecter un appareil inconnu** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-008 — Déconnexion de toutes les sessions

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Sessions |
| **Titre** | Mettre fin à toutes les sessions sauf la mienne |
| **Description** | En tant que **membre**, je souhaite **déconnecter toutes mes sessions sauf celle en cours** afin de **sécuriser mon compte** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-009 — Durée maximale de session

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Sessions |
| **Titre** | Définir la durée maximale de session |
| **Description** | En tant que **membre**, je souhaite **définir une durée max de session (24h/7j/30j)** afin de **contrôler la reconnexion** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SEC-010 — Session à usage unique

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Sessions |
| **Titre** | Créer une session à usage unique |
| **Description** | En tant que **membre**, je souhaite **créer une session qui expire après une utilisation** afin de **me connecter depuis un appareil public** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SEC-011 — Journal des connexions

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Journal de connexion |
| **Titre** | Consulter l'historique des connexions |
| **Description** | En tant que **membre**, je souhaite **consulter l'historique de mes connexions (date, IP, appareil)** afin de **détecter toute activité suspecte** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-012 — Filtrage du journal

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Journal de connexion |
| **Titre** | Filtrer le journal par date et type |
| **Description** | En tant que **membre**, je souhaite **filtrer mon journal par période et type (réussie/échouée)** afin de **trouver un événement spécifique** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-013 — Export du journal de connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Journal de connexion |
| **Titre** | Exporter le journal en CSV |
| **Description** | En tant que **membre**, je souhaite **exporter mon journal de connexion en CSV** afin de **le conserver ou l'analyser** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-014 — Alerte de nouvelle connexion

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Journal de connexion |
| **Titre** | Recevoir une alerte de nouvelle connexion |
| **Description** | En tant que **membre**, je souhaite **recevoir un email lors d'une connexion depuis un nouvel appareil/IP** afin de **réagir si ce n'est pas moi** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SEC-015 — Alerte de tentatives échouées

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Journal de connexion |
| **Titre** | Recevoir une alerte après 3 échecs |
| **Description** | En tant que **membre**, je souhaite **recevoir une notification après 3 échecs consécutifs** afin de **savoir si quelqu'un force mon compte** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SEC-016 — Liste des appareils autorisés

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Appareils |
| **Titre** | Consulter la liste des appareils connus |
| **Description** | En tant que **membre**, je souhaite **voir la liste des appareils connectés** afin de **gérer les appareils de confiance** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-017 — Retirer un appareil

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Appareils |
| **Titre** | Retirer un appareil de confiance |
| **Description** | En tant que **membre**, je souhaite **retirer un appareil de la liste de confiance** afin de **ne plus autoriser les connexions** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SEC-018 — Renommer un appareil

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Appareils |
| **Titre** | Renommer un appareil |
| **Description** | En tant que **membre**, je souhaite **renommer un appareil (ex: "Mon PC bureau")** afin de **le reconnaître facilement** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SEC-019 — Limite d'appareils simultanés

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Appareils |
| **Titre** | Définir une limite d'appareils simultanés |
| **Description** | En tant que **membre**, je souhaite **définir un nombre max d'appareils connectés** afin de **limiter les risques** |
| **Priorité** | Could |
| **Complexité** | M |

## US-SEC-020 — Appareil perdu ou volé

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Appareils |
| **Titre** | Signaler un appareil perdu ou volé |
| **Description** | En tant que **membre**, je souhaite **signaler un appareil perdu/volé** afin de **déconnecter immédiatement toutes les sessions** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-021 — Verrouillage automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Verrouillage |
| **Titre** | Verrouiller après 5 échecs de connexion |
| **Description** | En tant que **système**, je souhaite **verrouiller le compte après 5 tentatives échouées consécutives** afin de **prévenir le force brute** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-022 — Durée de verrouillage

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Verrouillage |
| **Titre** | Verrouiller pendant 15 minutes |
| **Description** | En tant que **système**, je souhaite **verrouiller le compte 15 minutes** afin de **décourager les attaques répétées** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SEC-023 — Déverrouillage du compte

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Verrouillage |
| **Titre** | Déverrouiller son compte |
| **Description** | En tant que **membre verrouillé**, je souhaite **recevoir un email de déverrouillage** afin de **réactiver mon compte** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-024 — Notification de verrouillage

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Verrouillage |
| **Titre** | Recevoir une notification de verrouillage |
| **Description** | En tant que **membre**, je souhaite **recevoir un email si mon compte est verrouillé** afin de **savoir qu'une tentative d'intrusion a eu lieu** |
| **Priorité** | Should |
| **Complexité** | XS |

## US-SEC-025 — Verrouillage manuel

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Verrouillage |
| **Titre** | Verrouiller manuellement son compte |
| **Description** | En tant que **membre**, je souhaite **verrouiller mon compte depuis les paramètres** afin de **le protéger en cas de suspicion** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SEC-026 — Chiffrement des données sensibles

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Chiffrement |
| **Titre** | Chiffrer les données sensibles au repos |
| **Description** | En tant que **système**, je souhaite **chiffrer toutes les données sensibles au repos** afin de **protéger les données en cas de fuite** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SEC-027 — Chiffrement du chat support

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Chiffrement |
| **Titre** | Chiffrer les messages du chat |
| **Description** | En tant que **système**, je souhaite **chiffrer les messages du chat en transit et au repos** afin de **garantir la confidentialité** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SEC-028 — Rotation des clés

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Chiffrement |
| **Titre** | Rotation périodique des clés |
| **Description** | En tant que **système**, je souhaite **effectuer une rotation des clés tous les 90 jours** afin de **limiter l'impact d'une clé compromise** |
| **Priorité** | Should |
| **Complexité** | L |

## US-SEC-029 — Chiffrement des logs

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Chiffrement |
| **Titre** | Chiffrer les logs d'audit |
| **Description** | En tant que **système**, je souhaite **chiffrer les logs d'audit au repos** afin de **garantir leur intégrité** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SEC-030 — Algorithme conforme

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Chiffrement |
| **Titre** | Utiliser AES-256-GCM |
| **Description** | En tant que **système**, je souhaite **utiliser AES-256-GCM pour le chiffrement** afin de **respecter les standards** |
| **Priorité** | Must |
| **Complexité** | M |

## US-SEC-031 — Génération de token API

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | API tokens |
| **Titre** | Générer un token API |
| **Description** | En tant que **membre**, je souhaite **générer un token API avec des permissions spécifiques** afin de **permettre à une app externe d'accéder à mon compte** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SEC-032 — Révocation de token

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | API tokens |
| **Titre** | Révoquer un token API |
| **Description** | En tant que **membre**, je souhaite **révoquer immédiatement un token API** afin de **couper l'accès d'une application compromise** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-033 — Expiration des tokens

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | API tokens |
| **Titre** | Définir une expiration pour les tokens |
| **Description** | En tant que **membre**, je souhaite **définir une date d'expiration pour mes tokens** afin de **limiter leur validité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SEC-034 — Scope des tokens

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | API tokens |
| **Titre** | Définir les permissions d'un token |
| **Description** | En tant que **membre**, je souhaite **sélectionner les permissions d'un token (lecture, signaux, profil)** afin de **limiter les accès** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SEC-035 — Journal des tokens

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | API tokens |
| **Titre** | Consulter l'utilisation des tokens |
| **Description** | En tant que **membre**, je souhaite **voir l'historique d'utilisation de mes tokens** afin de **détecter une utilisation anormale** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SEC-036 — Conformité RGPD

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Conformité |
| **Titre** | Afficher la politique de confidentialité |
| **Description** | En tant que **membre**, je souhaite **consulter la politique de confidentialité** afin de **comprendre le traitement de mes données** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SEC-037 — Consentement cookies

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Conformité |
| **Titre** | Gérer les préférences de cookies |
| **Description** | En tant que **visiteur**, je souhaite **accepter ou refuser les cookies non essentiels** afin de **respecter mes préférences** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SEC-038 — Droit à l'oubli

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Conformité |
| **Titre** | Supprimer mon compte et mes données |
| **Description** | En tant que **membre**, je souhaite **demander la suppression définitive de mon compte** afin de **faire valoir mon droit à l'oubli (RGPD)** |
| **Priorité** | Must |
| **Complexité** | L |

## US-SEC-039 — Rapport de transparence

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Conformité |
| **Titre** | Consulter le rapport de transparence |
| **Description** | En tant que **visiteur**, je souhaite **consulter le rapport de transparence** afin de **connaître les demandes gouvernementales reçues** |
| **Priorité** | Could |
| **Complexité** | S |

## US-SEC-040 — Délégation conformité

| Champ | Valeur |
|-------|--------|
| **Module** | Sécurité |
| **Epic** | Conformité |
| **Titre** | Déléguer la conformité |
| **Description** | En tant que **responsable conformité**, je souhaite **déléguer les actions de conformité** afin de **répartir la charge de travail** |
| **Priorité** | Should |
| **Complexité** | M |

---

# Module 14 : Audit (US-AUD-001 → US-AUD-020)

## US-AUD-001 — Journalisation des actions critiques

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Journalisation |
| **Titre** | Journaliser toutes les actions critiques |
| **Description** | En tant que **système**, je souhaite **journaliser automatiquement les actions critiques (connexion, KYC, paiement)** afin de **disposer d'une piste d'audit complète** |
| **Valeur métier** | Conformité réglementaire, traçabilité, résolution de litiges |
| **Préconditions** | Système opérationnel, base d'audit accessible |
| **Déclencheur** | Toute action critique exécutée |
| **Scénario principal** | 1. Un utilisateur effectue une action critique 2. Le système enregistre : timestamp, utilisateur, action, ressource, IP, payload 3. Le log est persisté dans `AuditLog` 4. Le log est signé numériquement |
| **Exceptions** | 1. Base indisponible → file mémoire avec retry 2. Payload trop volumineux → troncature |
| **Règles métier** | BR-AUD-001 : Insert-only, logs immuables BR-AUD-002 : Chaîne d'intégrité (hash du log précédent) |
| **Données** | `AuditLog` (timestamp, actorId, action, resource, ip, payload, signature) |
| **Sécurité** | RBAC admin seul ; Insert-only ; Signature numérique |
| **Critères d'acceptation** | Given une action critique, When elle est exécutée, Then un log d'audit est créé |
| **Priorité** | Must |
| **Complexité** | M |

## US-AUD-002 — Journalisation des permissions

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Journalisation |
| **Titre** | Journaliser les changements de permissions |
| **Description** | En tant que **système**, je souhaite **journaliser toute modification des rôles et permissions** afin de **tracer l'évolution des droits** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUD-003 — Journalisation des accès sensibles

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Journalisation |
| **Titre** | Journaliser les accès aux données sensibles |
| **Description** | En tant que **système**, je souhaite **journaliser toute consultation de documents KYC** afin de **détecter les accès non autorisés** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUD-004 — Journalisation des exports

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Journalisation |
| **Titre** | Journaliser les exports de données |
| **Description** | En tant que **système**, je souhaite **journaliser tout export (CSV, PDF, API)** afin de **tracer les fuites potentielles** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUD-005 — Horodatage UTC

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Journalisation |
| **Titre** | Horodater les logs en UTC |
| **Description** | En tant que **système**, je souhaite **horodater tous les logs en UTC avec précision ms** afin de **garantir une chronologie fiable** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-AUD-006 — Consultation de la piste d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Consultation |
| **Titre** | Consulter la piste d'audit |
| **Description** | En tant que **super-admin**, je souhaite **consulter la piste d'audit avec pagination et recherche** afin de **réaliser des investigations** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUD-007 — Filtres avancés

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Consultation |
| **Titre** | Filtrer par critères multiples |
| **Description** | En tant que **super-admin**, je souhaite **filtrer par utilisateur, action, période, ressource, IP** afin de **cibler une investigation** |
| **Priorité** | Must |
| **Complexité** | M |

## US-AUD-008 — Vue détaillée d'un log

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Consultation |
| **Titre** | Voir le détail d'un log |
| **Description** | En tant que **super-admin**, je souhaite **voir le payload et la signature d'un log** afin de **vérifier son intégrité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUD-009 — Vérification d'intégrité

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Consultation |
| **Titre** | Vérifier la chaîne d'audit |
| **Description** | En tant que **super-admin**, je souhaite **déclencher une vérification d'intégrité de la chaîne** afin de **détecter toute altération** |
| **Priorité** | Should |
| **Complexité** | L |

## US-AUD-010 — Tableau de bord d'audit

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Consultation |
| **Titre** | Voir les statistiques d'audit |
| **Description** | En tant que **super-admin**, je souhaite **voir un tableau de bord (logs/jour, actions fréquentes)** afin de **surveiller l'activité** |
| **Priorité** | Could |
| **Complexité** | M |

## US-AUD-011 — Export CSV

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Export |
| **Titre** | Exporter les logs en CSV |
| **Description** | En tant que **super-admin**, je souhaite **exporter les logs filtrés en CSV** afin de **les analyser dans un tableur** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUD-012 — Export PDF

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Export |
| **Titre** | Exporter les logs en PDF |
| **Description** | En tant que **super-admin**, je souhaite **exporter des logs en PDF** afin de **les joindre à un rapport de conformité** |
| **Priorité** | Should |
| **Complexité** | S |

## US-AUD-013 — Export automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Export |
| **Titre** | Programmer un export automatique |
| **Description** | En tant que **super-admin**, je souhaite **programmer un export hebdomadaire automatique** afin de **conserver une copie externe** |
| **Priorité** | Could |
| **Complexité** | M |

## US-AUD-014 — Export chiffré

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Export |
| **Titre** | Exporter avec chiffrement |
| **Description** | En tant que **super-admin**, je souhaite **que les exports soient chiffrés (AES-256)** afin de **les transférer en sécurité** |
| **Priorité** | Should |
| **Complexité** | M |

## US-AUD-015 — Notification d'export

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Export |
| **Titre** | Recevoir un lien de téléchargement |
| **Description** | En tant que **super-admin**, je souhaite **recevoir un email avec le lien une fois l'export prêt** afin de **ne pas bloquer mon navigateur** |
| **Priorité** | Could |
| **Complexité** | S |

## US-AUD-016 — Rétention des logs

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Rétention |
| **Titre** | Définir la durée de rétention |
| **Description** | En tant que **super-admin**, je souhaite **définir une durée de rétention (1 an par défaut)** afin de **respecter le RGPD** |
| **Priorité** | Must |
| **Complexité** | S |

## US-AUD-017 — Archivage automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Rétention |
| **Titre** | Archiver les logs de +6 mois |
| **Description** | En tant que **système**, je souhaite **archiver les logs de +6 mois en stockage froid** afin de **libérer la base principale** |
| **Priorité** | Must |
| **Complexité** | L |

## US-AUD-018 — Purge automatique

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Rétention |
| **Titre** | Purger après la durée de rétention |
| **Description** | En tant que **système**, je souhaite **supprimer les logs après leur rétention** afin de **respecter la politique** |
| **Priorité** | Must |
| **Complexité** | M |

## US-AUD-019 — Restauration des archives

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Rétention |
| **Titre** | Restaurer des logs archivés |
| **Description** | En tant que **super-admin**, je souhaite **restaurer des logs depuis l'archive froide** afin de **consulter des événements anciens** |
| **Priorité** | Should |
| **Complexité** | L |

## US-AUD-020 — Notification avant purge

| Champ | Valeur |
|-------|--------|
| **Module** | Audit |
| **Epic** | Rétention |
| **Titre** | Recevoir une alerte avant purge |
| **Description** | En tant que **super-admin**, je souhaite **recevoir un email 7 jours avant la purge** afin de **pouvoir exporter les logs** |
| **Priorité** | Should |
| **Complexité** | S |

---

# Module 15 : Support (US-SUP-001 → US-SUP-015)

## US-SUP-001 — Création d'un ticket support

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Tickets |
| **Titre** | Créer un ticket de support |
| **Description** | En tant que **membre**, je souhaite **créer un ticket avec titre, catégorie et description** afin de **signaler un problème** |
| **Valeur métier** | Satisfaction client, résolution structurée |
| **Préconditions** | Membre connecté avec abonnement actif |
| **Déclencheur** | L'utilisateur clique sur "Contacter le support" puis "Créer un ticket" |
| **Scénario principal** | 1. Sélection d'une catégorie 2. Saisie du titre et description 3. Jointure de fichiers 4. Soumission 5. Création du ticket statut "Ouvert" 6. Email de confirmation |
| **Exceptions** | 1. Pièce jointe >10 Mo → rejet 2. Catégorie manquante → validation |
| **Règles métier** | BR-SUP-001 : Priorité auto selon catégorie BR-SUP-002 : Numéro au format SUP-XXXXX |
| **Données** | `SupportTicket` (memberId, category, title, status, priority, attachments) |
| **Notifications** | Email de confirmation ; Notification in-app ; Audit |
| **Sécurité** | RBAC membres voient leurs tickets ; Rate limit : 5/h |
| **Critères d'acceptation** | Given un membre, When il crée un ticket valide, Then le ticket est créé avec statut "Ouvert" |
| **Priorité** | Must |
| **Complexité** | S |

## US-SUP-002 — Consultation de mes tickets

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Tickets |
| **Titre** | Voir la liste de mes tickets |
| **Description** | En tant que **membre**, je souhaite **voir mes tickets avec leur statut** afin de **suivre l'avancement** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SUP-003 — Répondre à un ticket

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Tickets |
| **Titre** | Ajouter un message à un ticket |
| **Description** | En tant que **membre**, je souhaite **répondre à un ticket existant** afin de **fournir des infos complémentaires** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SUP-004 — Clôture d'un ticket

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Tickets |
| **Titre** | Fermer un ticket résolu |
| **Description** | En tant que **membre**, je souhaite **fermer un ticket résolu** afin de **confirmer la résolution** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SUP-005 — Réouverture d'un ticket

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Tickets |
| **Titre** | Rouvrir un ticket fermé |
| **Description** | En tant que **membre**, je souhaite **rouvrir un ticket fermé sous 7 jours** afin de **signaler un problème persistant** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SUP-006 — Chat support en direct

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Chat |
| **Titre** | Démarrer un chat en direct |
| **Description** | En tant que **membre**, je souhaite **discuter en direct avec un agent** afin de **poser une question urgente** |
| **Priorité** | Should |
| **Complexité** | L |

## US-SUP-007 — Chatbot automatisé

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Chat |
| **Titre** | Interagir avec le chatbot |
| **Description** | En tant que **membre**, je souhaite **utiliser le chatbot pour les questions fréquentes** afin de **résoudre mon problème sans attendre** |
| **Priorité** | Should |
| **Complexité** | XL |

## US-SUP-008 — Transfert chat vers ticket

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Chat |
| **Titre** | Convertir un chat en ticket |
| **Description** | En tant que **membre**, je souhaite **que le chat devienne un ticket si non résolu** afin de **ne pas perdre le contexte** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SUP-009 — Historique des chats

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Chat |
| **Titre** | Consulter l'historique des chats |
| **Description** | En tant que **membre**, je souhaite **voir mes conversations passées** afin de **retrouver une information** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SUP-010 — Satisfaction après chat

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Chat |
| **Titre** | Noter le support après un chat |
| **Description** | En tant que **membre**, je souhaite **évaluer ma satisfaction (1-5)** afin de **donner mon avis** |
| **Priorité** | Should |
| **Complexité** | S |

## US-SUP-011 — Base de connaissances

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Base de connaissances |
| **Titre** | Consulter la base de connaissances |
| **Description** | En tant que **membre**, je souhaite **parcourir les articles classés par catégorie** afin de **trouver une réponse** |
| **Priorité** | Should |
| **Complexité** | M |

## US-SUP-012 — Recherche dans la base

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Base de connaissances |
| **Titre** | Rechercher par mot-clé |
| **Description** | En tant que **membre**, je souhaite **rechercher un article par mot-clé** afin de **trouver rapidement la réponse** |
| **Priorité** | Must |
| **Complexité** | S |

## US-SUP-013 — Article détaillé

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Base de connaissances |
| **Titre** | Lire un article complet |
| **Description** | En tant que **membre**, je souhaite **ouvrir un article en détail** afin de **suivre un guide pas à pas** |
| **Priorité** | Must |
| **Complexité** | XS |

## US-SUP-014 — Évaluation des articles

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Base de connaissances |
| **Titre** | Voter "utile/pas utile" |
| **Description** | En tant que **membre**, je souhaite **évaluer l'utilité d'un article** afin de **contribuer à l'amélioration** |
| **Priorité** | Could |
| **Complexité** | XS |

## US-SUP-015 — Suggestion d'article

| Champ | Valeur |
|-------|--------|
| **Module** | Support |
| **Epic** | Base de connaissances |
| **Titre** | Suggérer un nouvel article |
| **Description** | En tant que **membre**, je souhaite **suggérer un sujet d'article manquant** afin de **demander du contenu utile** |
| **Priorité** | Could |
| **Complexité** | S |
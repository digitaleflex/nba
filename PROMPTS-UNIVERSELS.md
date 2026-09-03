# 🤖 Prompts Universels — Analyse & Documentation de Projets

> **Boîte à outils réutilisable** pour diagnostiquer et documenter n'importe quel projet (code, business, technique).
> Chaque prompt est **autonome** : copier-coller suffit.

---

## 📋 Mode d'emploi

1. **Choisir le prompt adapté** à ton besoin (analyse, doc, valeur, etc.)
2. **Adapter les variables** entre `{{ }}` selon ton projet
3. **Coller dans l'agent** de ton choix (Claude, GPT, Cursor, etc.)
4. **Itérer** si besoin avec des précisions

### Variables typiques à remplacer

- `{{PROJECT_NAME}}` — nom du projet
- `{{REPO_URL}}` — URL du dépôt Git
- `{{START_DATE}}` — date de début
- `{{STACK}}` — stack technique principale
- `{{USER_COUNT}}` — nombre d'utilisateurs
- `{{BUSINESS_MODEL}}` — modèle économique

---

# 📊 PARTIE 1 — ANALYSE GIT

## Prompt 1 — Vue d'ensemble du projet (git analytics)

```markdown
Analyse le projet {{PROJECT_NAME}} situé dans le dossier courant.

Produis un rapport structuré avec :

## 1. Métriques globales
- Premier et dernier commit (avec hash, date, auteur)
- Durée totale du projet en jours calendaires
- Jours actifs (jours uniques avec commit)
- Total commits et ratio merge/non-merge
- Commits par contributeur

## 2. Activité par jour
- Top 20 jours les plus actifs (commits count)
- Pattern observé (jour de la semaine, heure)

## 3. Répartition
- Par auteur
- Par type (feat, fix, chore, etc.) via conventionnal commits
- Par dossier/fichier

## 4. Releases
- Liste tous les tags avec date et commit associé
- Cadence moyenne de release

Utilise UNIQUEMENT des commandes git :
- git log --reverse, git shortlog, git tag -l, etc.
- Pas besoin de cloner, utilise le repo courant

Format de sortie : Markdown avec tableaux.
```

---

## Prompt 2 — Timeline détaillée des évolutions

```markdown
Analyse le projet {{PROJECT_NAME}} et produis une TIMELINE COMPLÈTE.

## Pour chaque commit :
- Hash court
- Date
- Message
- Brève description (1 ligne) du changement

## Regroupe en PHASES logiques :
- Phase 0 : Bootstrap (scaffold initial)
- Phase 1 : MVP (1ère fonctionnalité cœur)
- Phase 2-X : Évolutions majeures (releases)
- Phase finale : État actuel

## Pour chaque phase, indique :
- Période (dates début/fin)
- Nombre de commits
- Releases associées (si applicable)
- Bilan / objectif

## Synthèse finale :
- Diagramme ASCII de l'évolution
- Tableau des modules métier construits au fil du temps
- Architecture : monolithe → distribué (si applicable)

Commandes à utiliser :
```bash
git log --reverse --format="%h|%ad|%s|%an" --date=short
git tag --sort=creatordate
git shortlog -sn --all
```

Limite le rapport à 800 lignes max.
```

---

## Prompt 3 — Volumétrie et qualité du code

```markdown
Analyse la VOLUMÉTRIE et la QUALITÉ du code du projet {{PROJECT_NAME}}.

## 1. Volumétrie
- Lignes de code par catégorie (src/, tests/, config, docs)
- Nombre de fichiers par extension
- Lignes ajoutées/supprimées (git log --shortstat)
- Ratio ajout/suppression (sain si > 3)

## 2. Structure
- Arborescence des dossiers principaux
- Modules les plus gros (top 10 par LOC)
- Couplage (fichiers importés par beaucoup d'autres)

## 3. Qualité
- Présence de tests (couverture approximative)
- Linters configurés (eslint, prettier)
- TypeScript strict ou non
- Audit de vulnérabilités (npm audit / pnpm audit)

## 4. Documentation
- README présent et complet ?
- Docs API (OpenAPI, etc.)
- Commentaires dans le code (%)

Commandes utiles :
```bash
find . -type f -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l
git log --shortstat --no-merges | awk '{ins+=$4; del+=$6} END {print ins, del}'
```

Présente les résultats en tableaux Markdown.
```

---

# 💰 PARTIE 2 — ESTIMATION DE VALEUR

## Prompt 4 — Estimation financière multi-scénarios

```markdown
Estime la VALEUR FINANCIÈRE du projet {{PROJECT_NAME}} pour 4 scénarios de marché.

## Données d'entrée (calcule-les via git) :
- Période de développement : {{START_DATE}} → {{END_DATE}}
- Jours-homme totaux estimés
- LOC total
- Nombre de releases
- Qualité production (sécurité, tests, etc.)

## Pour chaque scénario, calcule la valeur :

### Scénario A : Freelance Afrique senior
- Tarif : 120 000 FCFA/jour (~180 €/jour)
- Valeur = j-h × tarif

### Scénario B : Freelance Europe senior
- Tarif : 700 €/jour
- Valeur = j-h × tarif

### Scénario C : Agence Europe
- Tarif dev : 700 €/jour
- Marge agence × 1,8
- + Tests + maintenance 1 an

### Scénario D : Startup US
- Tarif : 1 200 $/jour
- Valeur = j-h × tarif

## Bonus qualité à appliquer :
- 0 vulnérabilité : +8 %
- Architecture multi-tier : +10 %
- Tests : +4 %
- Design premium : +6 %
- Documentation : +3 %
- Autres bonus pertinents (selon analyse)

## Bonus net = somme des bonus - somme des malus

## Synthèse :
- Fourchette par scénario
- Valeur médiane recommandée
- Valeur catalogue pour cession
- Tableau de comparaison

Présente tout en FCFA, EUR, USD.
```

---

## Prompt 5 — Inventaire valorisé des features

```markdown
Crée un INVENTAIRE VALORISÉ de toutes les fonctionnalités du projet {{PROJECT_NAME}}.

## Pour chaque feature :
- Nom et description courte
- Fichiers/chemins clés
- Complexité estimée :
  - XS (1h) | S (2h) | M (4h) | L (1j) | XL (2-3j) | XXL (5j+)
- Temps estimé en j-h
- Valeur = temps × 120 000 FCFA/j

## Méthode d'estimation de la complexité :
- Compte les fichiers impactés
- Vérifie si la feature a un commit dédié (chercher "feat:" dans git log)
- Considère la maturité (stable vs beta)

## Regroupe par catégorie (au minimum 8) :
1. Authentification
2. RBAC / permissions
3. Module cœur métier
4. Onboarding / KYC
5. Communication (messagerie, notifications)
6. Administration
7. Sécurité
8. Infrastructure / DevOps
9. Tests / qualité
10. Documentation
11. Design / UX

## Pour chaque catégorie :
- Nombre de features
- Temps total estimé
- Valeur totale
- % du total

## Synthèse :
- Tableau par catégorie
- Top 5 modules les plus chers
- 3 scénarios de monétisation
- Messages commerciaux prêts à l'emploi

Format : Markdown avec tableaux détaillés.
Limite : 600 lignes max.
```

---

# 🛡️ PARTIE 3 — JURIDIQUE

## Prompt 6 — CGU + Politique de confidentialité

```markdown
Génère les CGU (Conditions Générales d'Utilisation) et la Politique de confidentialité
pour le projet {{PROJECT_NAME}} édité par {{COMPANY_NAME}}.

## ⚠️ Ces documents doivent :

### CGU
1. Définir l'objet du service
2. Conditions d'inscription (âge, capacité juridique)
3. Description des services fournis
4. Obligations de l'utilisateur (10 règles minimum)
5. Tarification et modalités de paiement
6. Droit de rétractation (14j pour UE)
7. Suspension/résiliation
8. Propriété intellectuelle
9. **AVERTISSEMENT SPÉCIFIQUE TRADE/INVESTISSEMENT** si applicable :
   ⚠️ Signaux = recommandations générales, pas du conseil personnalisé
   Trading comporte des risques significatifs
10. Loi applicable et juridiction
11. Procédure de médiation

### Politique de confidentialité (RGPD)
1. Responsable du traitement + DPO
2. Données collectées (catégories)
3. Finalités et bases légales
4. Sous-traitants et transferts hors UE (avec SCC)
5. Durée de conservation
6. Cookies (types, durées, gestion consentement)
7. Mesures de sécurité (techniques + organisationnelles)
8. Droits des utilisateurs (8 droits RGPD)
9. Procédure de réclamation (CNIL)
10. Modifications et contact

## Style :
- Juridique clair, sans jargon excessif
- Adapté au public cible (consommateurs/professionnels)
- Compatible droit français + RGPD + mention si autre juridiction

Format de sortie : 2 fichiers Markdown distincts.
Avertir que la validation par un avocat est recommandée.
```

---

## Prompt 7 — NDA + Acte de cession

```markdown
Génère 2 modèles juridiques pour le projet {{PROJECT_NAME}} :

## Modèle 1 : NDA (Accord de Non-Divulgation)

### Sections obligatoires :
1. Identification des parties (placeholders)
2. Définition des informations confidentielles
3. Engagements du destinataire (8 minimum)
4. Exceptions (4 cas)
5. Durée (3 ans recommandés)
6. Propriété intellectuelle (rappel)
7. Absence d'engagement (pas d'obligation de transaction)
8. Non-sollicitation (12 mois)
9. Garanties et responsabilité
10. Loi applicable + juridiction
11. Dispositions générales (intégralité, modification, nullité)
12. Annexes (à cocher)

## Modèle 2 : Acte de cession de projet logiciel

### Sections obligatoires :
1. Identification cédant/cessionnaire
2. Périmètre (code, DB, infra, marques, domaines)
3. Prix et modalités (paiement acompte + solde, escrow possible)
4. Livraison (timeline : J0, J7, J14, J30)
5. Garanties du cédant (7 points)
6. Obligations du cessionnaire
7. Confidentialité
8. Responsabilité
9. Résiliation (non-paiement 30j)
10. Loi applicable
11. Checklist de livraison (à cocher)

## Format :
- 2 fichiers Markdown distincts
- Placeholders {{ }} pour adaptation
- Avertissement : "À valider par un avocat"
```

---

# 🛠️ PARTIE 4 — OPÉRATIONNEL

## Prompt 8 — Runbook opérationnel

```markdown
Crée un RUNBOOK OPÉRATIONNEL complet pour le projet {{PROJECT_NAME}}.

## Sections à inclure :

### Contacts d'urgence
- Lead tech
- Support infogérance
- Fournisseurs critiques
- Canaux (Slack/Discord, email, téléphone)

### Niveaux de sévérité
- P0 : service down (15 min réponse, 4h résolution)
- P1 : fonctionnalité majeure cassée (1h / 8h)
- P2 : bug isolé (4h / 24h)
- P3 : cosmétique (24h / 7j)

### Scénarios d'urgence (au moins 7)
1. Service totalement indisponible
2. Erreurs Sentry en cascade
3. Fuite de sécurité suspectée
4. Backup échoué
5. Cache ou Redis plein
6. Cache incohérent
7. Job bloqué dans la queue

Pour chaque scénario :
- Symptômes
- Diagnostic (commandes)
- Actions correctives (étapes numérotées)

### Maintenance préventive
- Hebdomadaire : checklist 30 min
- Mensuelle : checklist 1h

### Indicateurs à surveiller
- Métriques de santé (uptime, latence, erreurs)
- Alertes automatiques (config)

### Procédures de sécurité
- Reset password admin
- Révocation sessions
- Blocage IP

### Checklist post-incident (template)
- Date, niveau, durée
- Chronologie
- Cause racine
- Actions correctives
- Communication

Format : Markdown avec blocs de code bash.
```

---

## Prompt 9 — Matrice des dépendances tierces

```markdown
Analyse et documente toutes les DÉPENDANCES TIERCES du projet {{PROJECT_NAME}}.

## Pour chaque service externe :
- Nom et site
- Catégorie (DB, email, monitoring, etc.)
- Criticité (Critique / Important / Utile)
- SLA garanti
- Coût mensuel
- Date d'adoption
- Pourquoi ce choix (justification)
- Points faibles
- 3 alternatives
- Procédure de bascule

## Tableau récapitulatif
Tous les services avec colonnes :
Service | Catégorie | Criticité | SLA | Coût/mois | Depuis | Alternative

## Analyse des coûts
- Coût mensuel total
- Coût par utilisateur
- Break-even (combien d'utilisateurs payants pour couvrir)

## Stratégie de réduction de dépendance
- Court terme (6 mois)
- Moyen terme (1 an)
- Long terme (2 ans)

## Sécurité des secrets
- Liste tous les secrets (DATABASE_URL, API keys, etc.)
- Rotation recommandée pour chacun
- Procédure de rotation

## Checklist mensuelle
- Vérifier uptime de chaque service
- Vérifier coûts
- Vérifier expiration des clés API
- Vérifier quotas
```

---

# 🏗️ PARTIE 5 — ARCHITECTURE

## Prompt 10 — Schéma d'architecture

```markdown
Génère un SCHÉMA D'ARCHITECTURE complet du projet {{PROJECT_NAME}}.

## Contenu obligatoire :

### 1. Architecture globale (Production)
- Diagramme ASCII avec tous les composants
- VPS, services externes, base de données
- Flux de données entre les composants

### 2. Flux métier principaux (au moins 4)
Pour chaque flux, un diagramme avec :
- Acteurs
- Étapes numérotées
- Latence cible
- Technologies utilisées

Exemples de flux :
- Diffusion d'un signal (admin → queue → email + push + WS)
- Processus KYC (membre → upload → review)
- Inscription (form → validation → DB → email)
- WebSocket (membre A envoie → broadcast à B)
- CI/CD (commit → tests → build → deploy)

### 3. Couches de sécurité
Diagramme avec :
- Réseau (CDN, DDoS, TLS)
- Application (CSP, CSRF, headers)
- Authentification
- Autorisation (RBAC)
- Validation données
- Audit & monitoring
- Données (chiffrement, backups)

### 4. Inventaire des flux
Tableau avec :
- Flux | Latence cible | Fréquence | Technologie

## Format :
Markdown avec diagrammes ASCII clairs.
Utiliser des boîtes ASCII (┌─┐ │ └─┘) pour les composants.
```

---

## Prompt 11 — Architecture Decision Records

```markdown
Génère des ADR (Architecture Decision Records) pour le projet {{PROJECT_NAME}}.

Pour chaque décision technique majeure (au moins 6), crée un ADR avec :

## Format standard
- **Statut** : Accepté / Proposé / Refusé
- **Date** : date de la décision
- **Contexte** : quel problème on résolvait
- **Décision** : ce qu'on a choisi
- **Alternatives considérées** : tableau comparatif
- **Conséquences** : positives + négatives
- **Notes** : évolution depuis

## Décisions à documenter (adapter selon le projet)
1. Framework principal (Next.js, Remix, etc.)
2. ORM (Prisma, Drizzle, etc.)
3. Base de données (Postgres, MySQL, etc.)
4. Auth (Better Auth, NextAuth, Clerk)
5. Queue async (BullMQ, Inngest, etc.)
6. Hosting (Vercel, AWS, self-hosted)
7. CSS (Tailwind, styled-components)
8. State management (Redux, Zustand, Context)
9. Tests (Vitest, Jest, Playwright)
10. Monitoring (Sentry, Datadog)

## Pour chaque alternative dans le tableau :
- Avantages (2-3 points)
- Inconvénients (2-3 points)
- Verdict (✓ Choisi / ✗ Refusé)
```

---

# 📚 PARTIE 6 — DOCUMENTATION COMPLÈTE

## Prompt 12 — Dossier projet complet

```markdown
Crée un DOSSIER PROJET complet pour {{PROJECT_NAME}} structuré comme suit :

```
{{PROJECT_NAME}}-dossier/
├── 00_INDEX.md                       (point d'entrée)
├── 01_PRESENTATION/                  (executive summary, features)
├── 02_TECHNIQUE/                     (stack, archi, ADR, sécurité)
├── 03_METRIQUES_TRAVAIL/             (git analytics, burndown)
├── 04_FINANCES/                     (grille tarifaire, inventaire)
├── 05_JURIDIQUE/                    (NDA, cession, CGU, privacy)
├── 06_PRODUCTION/                   (runbook, matrice, monitoring)
├── 07_GRAPHIQUE_UI/                 (captures, design system)
├── 08_CONTACTS_HISTORIQUE/          (contributeurs, jalons)
└── 99_GENERATION_PDF/               (scripts pandoc)
```

## Pour chaque section, génère au minimum :
- 01 : executive_summary.md (1 page vitrine)
- 02 : stack_technique.md
- 03 : git_analytics.md
- 04 : grille_tarifaire.md
- 05 : preuve_anteriorite.md, modele_nda.md, modele_acte_cession.md
- 06 : dashboard_status.md
- 08 : contributeurs.md

## Sections vides (à compléter)
Pour les sections où tu n'as pas d'info, crée un fichier avec :
- Structure prévue
- Placeholders {{ }} à remplir
- Sections "À compléter"

## Génération PDF
À la fin, ajoute :
- Script bash `generer_pdfs.sh` qui utilise pandoc
- README avec instructions d'installation

Limite : 15-20 fichiers Markdown max.
```

---

## Prompt 13 — Executive summary (1 page vitrine)

```markdown
Génère un EXECUTIVE SUMMARY 1 page pour le projet {{PROJECT_NAME}}.

## Structure :
1. **Phrase d'accroche** (1 ligne qui résume le produit)
2. **Chiffres clés** (tableau de 8-10 métriques)
3. **Fonctionnalités livrées** (par catégorie, en puces)
4. **Sécurité & conformité** (5-8 points clés)
5. **UX / Design** (5-7 points différenciants)
6. **Valeur** (tableau 4 scénarios)
7. **Différenciateurs vs concurrents** (5 points)
8. **Contact**

## Style :
- Professionnel, factuel
- Adapté à un décideur non-technique
- Chiffres percutants
- Pas de jargon inutile

## Longueur : 1 page max (environ 100-130 lignes Markdown)

Ce document sera imprimé en PDF comme page de couverture.
```

---

# 🎯 PARTIE 7 — DIAGNOSTIC & AUDIT

## Prompt 14 — Audit de sécurité complet

```markdown
Effectue un AUDIT DE SÉCURITÉ du projet {{PROJECT_NAME}}.

## Vérifie les points suivants :

### 1. Dépendances
- npm audit / pnpm audit
- Vulnérabilités connues (CVEs)
- Dépendances obsolètes

### 2. Code source
- Secrets hardcodés (grep API_KEY, SECRET, PASSWORD)
- Requêtes SQL non paramétrées
- Validation des entrées (présence de Zod, Joi, etc.)
- Authentification (présence de bcrypt, hash passwords)
- CSRF protection
- XSS (échappement HTML)
- Path traversal (validation des chemins)

### 3. Configuration
- HTTPS forcé
- Headers de sécurité (HSTS, X-Frame-Options, CSP)
- Cookies sécurisés
- CORS restrictif

### 4. Base de données
- Mots de passe hashés
- Données sensibles chiffrées
- Backups automatisés

### 5. Infrastructure
- Firewall configuré
- SSH keys (pas de passwords)
- Updates automatiques

## Pour chaque problème trouvé :
- Criticité (Critique / Haute / Moyenne / Faible)
- Description
- Recommandation de fix

## Synthèse :
- Score global (/100)
- Top 5 actions prioritaires
- Roadmap de sécurisation
```

---

## Prompt 15 — Analyse de dette technique

```markdown
Analyse la DETTE TECHNIQUE du projet {{PROJECT_NAME}}.

## Identifie :

### 1. Code
- Fichiers trop longs (> 500 lignes)
- Fonctions trop longues (> 100 lignes)
- Duplication de code (DRY violations)
- TODOs / FIXMEs non résolus
- Commentaires obsolètes

### 2. Tests
- Couverture (estimée ou réelle)
- Tests flaky
- Tests skipped ou .skip()
- Tests d'intégration manquants

### 3. Architecture
- Couplage fort entre modules
- God classes / modules
- Configuration éparpillée
- Pas de types (any, @ts-ignore)

### 4. Documentation
- README incomplet
- Pas de doc API
- Pas de commentaires JSDoc
- Pas de diagrammes d'architecture

### 5. Performance
- Requêtes N+1
- Pas de cache
- Index DB manquants
- Bundle size trop gros

## Évalue l'impact :
- Coût de maintenance actuel
- Risque de bugs
- Difficulté d'onboarding nouveaux devs
- Vitesse d'évolution future

## Recommandations :
- Top 10 refactors prioritaires
- Effort estimé par refactor
- Quick wins (< 1 jour)
- Refactors lourds (> 1 semaine)
```

---

# 🚀 PARTIE 8 — BUSINESS

## Prompt 16 — Pitch commercial

```markdown
Génère un PITCH COMMERCIAL pour le projet {{PROJECT_NAME}} adapté à {{AUDIENCE}}.

## Structure (max 10 slides / pages) :

### Slide 1 : Problème
- 3 douleurs du marché cible
- Pourquoi c'est urgent maintenant

### Slide 2 : Solution
- Comment {{PROJECT_NAME}} résout ces problèmes
- USP (Unique Selling Point)

### Slide 3 : Produit
- 3 captures/screenshots clés
- Démo en 30 secondes

### Slide 4 : Marché
- TAM / SAM / SOM
- Tendance du marché

### Slide 5 : Traction
- Métriques actuelles
- Croissance

### Slide 6 : Business model
- Sources de revenus
- Pricing

### Slide 7 : Équipe / Auteur
- Background
- Compétences clés

### Slide 8 : Ask
- Ce que tu cherches (investissement, clients, partenaires)
- Montant si applicable

### Slide 9 : Roadmap
- Court terme (3 mois)
- Moyen terme (12 mois)
- Long terme (24 mois)

### Slide 10 : Contact
- CTA clair

## Style :
- 3 messages clés maximum par slide
- Chiffres parlants
- Storytelling + data
- Adapté au public (investisseur / client / partenaire)

## Longueur : 8-12 pages Markdown max
```

---

## Prompt 17 — Analyse de la valeur business

```markdown
Analyse la VALEUR BUSINESS du projet {{PROJECT_NAME}}.

## Sections :

### 1. Métriques produit
- MRR / ARR (si applicable)
- Nombre d'utilisateurs
- Taux de conversion
- Taux de rétention
- Churn rate
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)

### 2. Métriques techniques
- Uptime / disponibilité
- Latence moyenne
- Taux d'erreur
- NPS technique

### 3. Métriques de croissance
- Croissance MoM
- Sources d'acquisition
- Coût par utilisateur
- Viralité (K-factor)

### 4. Santé financière
- Coûts d'infrastructure
- Coûts de personnel
- Marge brute
- Burn rate
- Runway

### 5. Positionnement marché
- Concurrents directs
- Concurrents indirects
- Barrière à l'entrée
- Avantage compétitif

### 6. Risques
- Techniques
- Business
- Réglementaires
- Concurrentiels

## Pour chaque métrique :
- Valeur actuelle
- Benchmark secteur
- Tendance (3 mois)
- Objectif 6 mois

## Synthèse :
- Forces
- Faiblesses
- Opportunités
- Menaces (SWOT)
- Score global de santé business
```

---

# 🎨 PARTIE 9 — DESIGN & UX

## Prompt 18 — Documentation design system

```markdown
Documente le DESIGN SYSTEM du projet {{PROJECT_NAME}}.

## Sections :

### 1. Identité visuelle
- Logo (variantes : clair, sombre, favicon)
- Palette de couleurs (primaires, secondaires, sémantiques)
- Typographie (familles, hiérarchie)
- Iconographie

### 2. Tokens
- Spacing (échelle)
- Border radius
- Shadows (elevation matrix)
- Z-index
- Breakpoints responsive

### 3. Composants UI
Liste tous les composants avec :
- Nom
- Description
- Props principales
- États (default, hover, active, focus, disabled)
- Captures d'écran

### 4. Patterns
- Layout (header, sidebar, content)
- Navigation (tabs, menus)
- Forms (validation, errors)
- Modals
- Toasts/notifications

### 5. Accessibilité
- Conformité WCAG / RGAA
- Touch targets (40px+)
- Contraste couleurs
- ARIA patterns utilisés
- Keyboard navigation

### 6. Animations
- Durées standards
- Easing curves
- Reduced motion support

### 7. Bonnes pratiques
- Conventions de nommage
- Structure des fichiers
- Tests visuels

Format : Markdown avec captures d'écran (placeholders).
```

---

# ⚙️ PARTIE 10 — UTILISATION EFFICACE

## Conseils d'utilisation

### 1. Enchaîner les prompts

Tu peux combiner plusieurs prompts pour avoir un dossier complet :

```
Ordre optimal :
1. Prompt 1 (git analytics) → métriques brutes
2. Prompt 3 (volumétrie) → qualité code
3. Prompt 2 (timeline) → histoire
4. Prompt 4 (valeur) → financière
5. Prompt 5 (inventaire) → valorisation détaillée
6. Prompt 13 (executive summary) → synthèse
7. Prompt 12 (dossier complet) → mise en forme
8. Prompt 6 (CGU) + 7 (juridique) → légal
9. Prompt 10 (architecture) + 11 (ADR) → technique
10. Prompt 8 (runbook) + 9 (matrice) → opérationnel
```

### 2. Adapter selon le contexte

**Pour un projet commercialisable :**
- Ajouter Prompts 4, 5, 13, 16, 17
- Mettre l'accent sur la monétisation

**Pour un projet interne :**
- Ajouter Prompts 8, 9, 14, 15
- Mettre l'accent sur l'opérationnel

**Pour un projet open source :**
- Focus sur Prompt 18 (design system)
- Adapter Prompt 6 (CGU → Licence open source)

### 3. Itérer

Si le résultat n'est pas satisfaisant :
1. **Préciser** le contexte en début de prompt
2. **Demander** des sections spécifiques en plus
3. **Limiter** la longueur ("max X lignes")
4. **Reformater** ("sous forme de tableau")

### 4. Variables à toujours préciser

```
- Nom du projet
- Stack technique
- Date de début
- Modèle économique (B2B / B2C / SaaS / etc.)
- Public cible (investisseurs / clients / repreneur)
- Niveau de confidentialité (privé / public / sous NDA)
- Langue principale (FR / EN)
```

---

## 📦 FICHIERS GÉNÉRÉS

Avec ces 18 prompts, tu peux produire les 18 types de documents suivants :

1. ✅ Rapport git analytics
2. ✅ Timeline évolutions
3. ✅ Volumétrie & qualité code
4. ✅ Estimation financière
5. ✅ Inventaire valorisé
6. ✅ CGU + Politique de confidentialité
7. ✅ NDA + Acte de cession
8. ✅ Runbook opérationnel
9. ✅ Matrice dépendances
10. ✅ Schéma d'architecture
11. ✅ ADR (Architecture Decision Records)
12. ✅ Dossier projet complet
13. ✅ Executive summary
14. ✅ Audit de sécurité
15. ✅ Analyse dette technique
16. ✅ Pitch commercial
17. ✅ Analyse valeur business
18. ✅ Documentation design system

**Tous réutilisables sur n'importe quel projet.**

---

## 🔄 WORKFLOW TYPE POUR UN NOUVEAU PROJET

```bash
# 1. Cloner le projet
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# 2. Lancer le prompt 1 (git analytics)
# → avoir les chiffres brutes

# 3. Lancer le prompt 2 (timeline)
# → avoir l'histoire

# 4. Lancer le prompt 5 (inventaire valorisé)
# → avoir la valorisation

# 6. Compiler le tout via prompt 12
# → obtenir le dossier complet

# 7. Adapter les sections juridiques via prompt 6, 7
# → finaliser le dossier commercial
```

---

*Document à usage personnel — réutilisable sur tous les projets*
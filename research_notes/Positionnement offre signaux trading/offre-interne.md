# Offre interne SignauxX / NeverBrokeAgain — fiche identité

## Quels sont les plans tarifaires (noms, prix, périodes, différences entre plans) ?

### Takeaway
L'offre catalogue compte 6 plans configurables (Forex / Deriv / combinés / Pro), durée standard 30 jours, devise F CFA, prix en seed à 0 (à fixer en production) et accès validé manuellement par l'admin — pas de paiement en ligne intégré dans le code actuel.

### Cited Findings
- 6 plans seedés, prix à 0, durée 30 jours, tri 1-6 : "Signals X Forex", "Signals X Deriv", "Signals X Forex + Deriv", "Signals X Pro Forex", "Signals X Pro Deriv", "Signals X Pro Forex + Deriv" — [scripts/seed.ts:4-11](file:///home/audest/nba/scripts/seed.ts)
- Seed plans créés avec `currency: "F CFA", features: []` — [scripts/seed.ts:140-143](file:///home/audest/nba/scripts/seed.ts)
- Même liste en fallback API publique avec UUID stables et `price: "0"` — [src/app/api/public/plans/route.ts:5-12](file:///home/audest/nba/src/app/api/public/plans/route.ts)
- Schéma `SubscriptionPlan` : `name unique, price Decimal(10,2), currency, durationDays, features Json, isActive, sortOrder, maxSessions default 5, maxDevices default 3, require2fa default false` — [prisma/schema.prisma:275-299](file:///home/audest/nba/prisma/schema.prisma)
- API publique ne retourne que `isActive true, deletedAt null, orderBy sortOrder` avec compteur `accessRequests APPROVED` — [src/app/api/public/plans/route.ts:20-35](file:///home/audest/nba/src/app/api/public/plans/route.ts)
- Détail 6 plans confirmés côté produit : Signals X Forex / Deriv / Forex+Deriv / Pro Forex / Pro Deriv / Pro Forex+Deriv, durée 30 jours par défaut, prix configurable, features administrables — [EXPOSE-SIGNAUXX.md:251-264](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Segmentation : chaque signal cible une ou plusieurs plans ; le membre ne voit que les signaux de ses plans sauf override admin — [EXPOSE-SIGNAUXX.md:273-275](file:///home/audest/nba/EXPOSE-SIGNAUXX.md) ; [EXPOSE-SIGNAUXX.md:904-912](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Cycle d'accès : choix du plan → `AccessRequest PENDING` → APPROVED/REJECTED/SUSPENDED/REVOKED par admin, emails automatiques, calcul échéance depuis date de validation + durée plan — [EXPOSE-SIGNAUXX.md:249-264](file:///home/audest/nba/EXPOSE-SIGNAUXX.md) ; [EXPOSE-SIGNAUXX.md:353-366](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Recommandation interne : simplifier l'offre, "Trois cartes maximum" et "Six plans — Trop de choix" à ne pas mettre en avant tel quel — [FONCTIONNALITES-BONUS.md:84-85](file:///home/audest/nba/FONCTIONNALITES-BONUS.md) ; [FONCTIONNALITES-BONUS.md:111-117](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- Prix non fixés en code : "les prix sont configurables ; le seed initial est à 0. Utiliser la grille commerciale réelle" et "dans le code actuel, l'accès est validé manuellement (pas de passerelle de paiement en ligne intégrée)" — [EXPOSE-SIGNAUXX.md:1602-1604](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Hypothèse tarifaire break-even citée dans le dossier prod : 2 500 FCFA/mois, 34 payants pour couvrir ~140$/mois (~85 000 FCFA/mois), marge ~58% avec 81 utilisateurs — [dossier/06_PRODUCTION/matrice_dependances.md:188-198](file:///home/audest/nba/dossier/06_PRODUCTION/matrice_dependances.md)
- Différences entre plans = marché (Forex vs Deriv/indices vs les deux) + niveau (standard vs Pro), pas de différence fonctionnelle décrite dans le code (mêmes champs, seule l'audience change) — [EXPOSE-SIGNAUXX.md:1349-1359](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)

### Inferences
- La structure 6 plans est technique (matrice marché x niveau) mais jugée trop complexe pour la vente ; une simplification en 3 offres est déjà recommandée en interne.
- Le modèle économique actuel est en validation manuelle : l'opérateur encaisse hors plateforme puis approuve, ce qui bloque le scale sans passerelle de paiement.

### Gaps
- Aucun prix public réel trouvé dans le repo (tous à 0) ; grille commerciale réelle hors repo ou à définir.
- Aucune période autre que 30 jours trouvée (pas de mensuel/trimestriel/annuel différencié).
- Aucune différence de features par plan documentée (features = [] vide en seed).

## Quelle est la proposition de valeur centrale (signaux + journal + coach) ?

### Takeaway
SignauxX ne vend pas des signaux de plus mais un système "recevoir, comprendre, exécuter, mesurer" où le journal avec PnL automatique est le différenciateur et le coach automatique le garde-fou qui rend le journal actif.

### Cited Findings
- Titre et promesse : "Tes signaux ne te disent pas si tu gagnes. Ton journal, si." + "SignauxX réunit tes signaux Forex & Deriv, ton journal de trading et tes statistiques dans un seul espace." — [PAGE-VENTE-SIGNAUXX.md:1-3](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- Positionnement anti-volume : "Le problème n'est pas de recevoir un signal de plus. C'est de savoir ce que tu en fais." — [PAGE-VENTE-SIGNAUXX.md:22](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- 4 temps : 1. Recevoir (temps réel, push, email, choix), 2. Comprendre (fiche claire, SL/TP, contexte), 3. Exécuter (garde broker et décision, pas d'auto-trade), 4. Mesurer (saisie unique, PnL/R:R/win rate/drawdown/profit factor auto) — [PAGE-VENTE-SIGNAUXX.md:28-42](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- Journal : PnL net (spread/commission/swap inclus), win rate, profit factor, expectancy, drawdown max, perfs par paire et par émotion, courbe de progression ; "En 30 jours de journal, tu ne devines plus. Tu sais." — [PAGE-VENTE-SIGNAUXX.md:46-59](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- Coach automatique : réagit après chaque trade — 3 pertes d'affilée → pause anti-sur-trading, SL oublié, lot trop gros, trade sous stress, séries 3-5 wins ; "pas un robot qui trade, un garde-fou" — [PAGE-VENTE-SIGNAUXX.md:63-73](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- Ce que SignauxX n'est pas : pas un broker, pas du copy trading, pas de gains garantis ; disclaimers risque systématiques — [PAGE-VENTE-SIGNAUXX.md:106-112](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md) ; [SIGNAUXX-WHATSAPP.txt:75-81](file:///home/audest/nba/SIGNAUXX-WHATSAPP.txt)
- Synthèse WhatsApp : signaux (inbox filtrable Forex/Deriv/Pro, temps réel+push+email), journal (PnL/R:R/win rate/drawdown/profit factor), discipline (réflexion, série, missions, rapport hebdo), cadre vérifié (KYC/broker/modération), support — [SIGNAUXX-WHATSAPP-PRESENTATION.txt:21-47](file:///home/audest/nba/SIGNAUXX-WHATSAPP-PRESENTATION.txt)
- Ordre de vente recommandé : 1. Journal (différenciateur), 2. Coach (rend journal actif), 3. Discipline, 4. Signaux, 5. Confiance en une ligne, 6. CTA démo/plan — [FONCTIONNALITES-BONUS.md:88-96](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)

### Inferences
- Le moat revendiqué est la boucle signal → journal → stats → coaching, que Telegram/sites de signaux/Excel ne peuvent pas copier sans posséder les deux bouts de la chaîne.
- Le discours est défensif sur la conformité : insistance sur "pas de conseil en investissement, pas de bot, pas de gains faciles" pour limiter le risque réglementaire.

### Gaps
- Pas de preuve de performance (win rate des signaux eux-mêmes) dans la page de vente ; la promesse porte sur la mesure, pas sur la rentabilité.

## Quelles fonctionnalités bonus / outils existent ou sont prévus ?

### Takeaway
Le journal, le coach à règles, la discipline et l'inbox multi-canal sont en place ; 5 outils à fort impact (Signal-to-Trade, Broker Import, Risk Guard, Process Score, Weekly Review) sont spécifiés en roadmap mais non livrés à v2.5.

### Cited Findings
- En place — renforcent le journal : coach automatique (règles locales), réflexion quotidienne + série, rapport hebdo (cron lundi), sessions de trading (chrono, résumé), missions/paliers, stats avancées (PnL/win rate/drawdown/profit factor/expectancy/par paire/par émotion) — [FONCTIONNALITES-BONUS.md:9-16](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- Coach actuel : règles 3 pertes, 5 wins, SL manquant, lot>1, stress/anxiété, forte confiance + perte ; moteur côté navigateur localStorage, pas un LLM, pas synchronisé — [FONCTIONNALITES-BONUS.md:20-31](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- En place — usage quotidien : inbox filtrable/recherche/favoris/archives/non-lus, alertes temps réel/push/email/in-app, fiches structurées (contexte, graphiques, SL/TP, auteur, copie), dashboard KPIs, préférences + heures silencieuses, mobile/PWA — [FONCTIONNALITES-BONUS.md:39-46](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- En place — confiance : KYC + vérification broker, modération/anti-fraude, sécurité sessions/appareils/alertes, messagerie/tickets, abonnement clair — [FONCTIONNALITES-BONUS.md:54-60](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- À ne pas mettre en vente car gadgets : 17 sons, langue/fuseau, emoji/réponses/accusés, chrono session, missions, historique versions, export/RGPD, fingerprint, audit logs, PWA/accessibilité, guides, compteur vues, score confiance, six plans — [FONCTIONNALITES-BONUS.md:68-84](file:///home/audest/nba/FONCTIONNALITES-BONUS.md)
- 5 outils à fort impact spécifiés : 1. Signal-to-Trade Analytics (bouton "J'ai pris ce trade", pré-remplissage, délai publication→entrée, stats par délai/signal/plan/paire), 2. Risk Guard (formulaire avant trade, risque %/R:R/taille, règles max, blocage, journal violations), 3. Broker Import (CSV MT4/MT5/Deriv, mapping, preview, déduplication, PnL net), 4. Personal Playbook (3 meilleurs/pires setups, paires, sessions, émotions → playbook 1 page appliqué par Risk Guard), 5. Process Score (score par trade : SL/risque/session/setup/revenge/rapidité, Process vs PnL) — [IDEES-OUTILS-BONUS.md:23-147](file:///home/audest/nba/IDEES-OUTILS-BONUS.md)
- 3 outils croissance : Verified Performance Card (carte mensuelle vérifiée partageable WhatsApp), Capital & Withdrawals Tracker (ROI réel dépôts/retraits/frais), Weekly Review (lundi : meilleur/pire trade, règle enfreinte, erreur coûteuse, 1 action) — [IDEES-OUTILS-BONUS.md:152-216](file:///home/audest/nba/IDEES-OUTILS-BONUS.md)
- À ne pas construire : bot de signaux auto, copy trading, fil social likes, plus de gamification, plus de gadgets notif, chat groupe public — [IDEES-OUTILS-BONUS.md:220-228](file:///home/audest/nba/IDEES-OUTILS-BONUS.md)
- Top 5 priorisé avec efforts : Signal-to-Trade S 1-2 sem, Broker Import M 2-4 sem, Risk Guard M 3-5 sem, Process Score S 1-2 sem, Weekly Review S 1 sem ; séquence sem 1-14 — [TOP-5-OUTILS-A-CONSTRUIRE.md:12-124](file:///home/audest/nba/TOP-5-OUTILS-A-CONSTRUIRE.md)
- Livré à v2.5 (31 août 2026) : Auth Better Auth + RBAC 5 rôles/11 perms, KYC/broker, signaux BullMQ+WebSocket+push/email, journal (PnL, sessions, réflexions, missions), coaching vue admin, messagerie 1-1 + bulk, 19 sous-onglets admin,revenus MRR/churn, audit chain, anti-fraude IPQS/fingerprint — [timeline.md:494-500](file:///home/audest/nba/timeline.md) ; [EXPOSE-SIGNAUXX.md:578-851](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Axes probables post-v2.5 : finalisation coaching, multi-tenant SaaS (plans Deriv), mobile natif/PWA, API publique, i18n anglais — [timeline.md:528-536](file:///home/audest/nba/timeline.md)

### Inferences
- Le différenciateur futur repose sur `Trade.signalId` déjà présent en Prisma, qui permettrait Signal-to-Trade sans migration lourde.
- Broker Import est identifié comme meilleur levier anti-abandon du journal manuel, donc prérequis aux Playbook/stats fiables.

### Gaps
- Statut d'avancement des 5 outils non confirmé dans le code à v2.5 (docs les présentent comme à construire) ; à vérifier par inspection `src/lib/journal` / `src/lib/coaching`.
- Pas d'estimation de prix pour ces bonus (inclus vs option payante).

## Y a-t-il des chiffres (utilisateurs, prix, garanties) dans estimation-valeur.md et fichiers WhatsApp ?

### Takeaway
81 utilisateurs en prod (sept. 2026), 0 prix public et 0 garantie de gains ; la seule valorisation chiffrée est le coût de remplacement du code (~18,5 M FCFA), pas le CA ou le prix d'abonnement.

### Cited Findings
- Production sept. 2026 : 81 utilisateurs (76 membres + 5 admins), 8 releases, 913 commits, 157 381 LOC, 0 vulnérabilité à l'audit — [EXPOSE-SIGNAUXX.md:5-8](file:///home/audest/nba/EXPOSE-SIGNAUXX.md) ; [EXPOSE-SIGNAUXX.md:66-79](file:///home/audest/nba/EXPOSE-SIGNAUXX.md)
- Estimation valeur : 89 jours-homme, 67 jours calendaires, 773 commits humains, 157 381 LOC + 5 410 tests ; valeur médiane 18 500 000 FCFA (~27 500 €), fourchette 15-22 M FCFA ; agence Europe 100 000-160 000 € — [estimation-valeur.md:24-42](file:///home/audest/nba/estimation-valeur.md) ; [estimation-valeur.md:216-226](file:///home/audest/nba/estimation-valeur.md) ; [estimation-valeur.md:265-279](file:///home/audest/nba/estimation-valeur.md)
- Bonus qualité +58% net (+73% / -15%) intégrant 0 vulnérabilité, 8 releases, CSP nonce, multi-VPS, CI/CD, tests, RBAC, KYC, signaux temps réel — [estimation-valeur.md:163-201](file:///home/audest/nba/estimation-valeur.md)
- Aucun prix d'abonnement dans WhatsApp : CTA unique "Réponds DÉMO" / signauxx.com, pas de grille, pas de garantie ; disclaimer systématique "Le trading comporte un risque de perte. Les performances passées ne préjugent pas des performances futures." — [SIGNAUXX-WHATSAPP.txt:84-88](file:///home/audest/nba/SIGNAUXX-WHATSAPP.txt) ; [SIGNAUXX-WHATSAPP-PRESENTATION.txt:63-66](file:///home/audest/nba/SIGNAUXX-WHATSAPP-PRESENTATION.txt) ; [SIGNAUXX-WHATSAPP-JOURNAL-BONUS.txt:55-62](file:///home/audest/nba/SIGNAUXX-WHATSAPP-JOURNAL-BONUS.txt)
- Positionnement garantie : "Ce n'est pas pour toi si tu cherches des gains garantis / un bot qui trade à ta place / tu ne veux pas noter tes trades" — [PAGE-VENTE-SIGNAUXX.md:98-103](file:///home/audest/nba/PAGE-VENTE-SIGNAUXX.md)
- Mentions légales : "sans garantie de résultat, de rentabilité ou d'exactitude" et "Aucune garantie de performance" — [src/app/(auth)/risk-disclaimer/page.tsx:34-59](file:///home/audest/nba/src/app/(auth)/risk-disclaimer/page.tsx)
- Coûts infra : ~140$/mois (~85 000 FCFA), soit ~1 050 FCFA/utilisateur/mois à 81 users — [dossier/06_PRODUCTION/matrice_dependances.md:188-198](file:///home/audest/nba/dossier/06_PRODUCTION/matrice_dependances.md)

### Inferences
- L'absence volontaire de prix et de promesse de gains est un choix de conformité ; la comparaison concurrentielle devra donc porter sur la valeur fonctionnelle (journal/coach/traçabilité) plutôt que sur prix/performance.
- Les chiffres d'usage (81 users) datent de sept. 2026 et doivent être actualisés avant usage commercial externe, comme l'exposé lui-même le recommande.

### Gaps
- Aucun MRR/ARR réel, aucun taux de conversion, aucune rétention trouvés dans les fichiers produit ; seuls MRR calculé et churn sont des fonctionnalités admin, pas des chiffres publiés.
- Aucune garantie commerciale (satisfait/remboursé, essai gratuit durée) mentionnée dans les docs de vente.

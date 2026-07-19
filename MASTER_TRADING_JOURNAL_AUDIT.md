# MASTER_TRADING_JOURNAL_AUDIT.md

> Version : 1.0
>
> Projet : NeverBrokeAgain
>
> Type : Audit complet du module Trading Journal
>
> Date : 2026-07-19

---

# SCORE GLOBAL : 46/100 — 🟡 Correct (limite Prototype)

| Domaine | Score | Niveau |
|---|---|---|
| Architecture | 5/10 | 🟡 Correct |
| UX | 4/10 | 🟠 Prototype |
| Fonctionnel | 5/10 | 🟡 Correct |
| Métier | 3/10 | 🟠 Prototype |
| Performance | 6/10 | 🟡 Correct |
| Sécurité | 5/10 | 🟡 Correct |
| Évolutivité | 4/10 | 🟠 Prototype |
| Innovation | 5/10 | 🟡 Correct |
| Production | 4/10 | 🟠 Prototype |
| **MOYENNE** | **4.6/10** | **🟡 Correct (limite Prototype)** |

---

# 1. AUDIT FONCTIONNEL

## 1.1 Trade Logging

### Constat 1 : Le calcul du PnL est incorrect pour le Forex

Le calcul du PnL dans le `TradeForm` et l'API est `(exit - entry) * lot * direction`. En Forex, un lot standard = 100 000 unités de devise de base. La formule correcte pour le Forex est :

```
PnL = (exit - entry) * lot * 100000 * direction
```

Pour les pipes (Forex), la valeur du pip dépend de la paire et du lot.

---

**Impact**
- Business : Tous les PnL affichés sont erronés d'un facteur ~100 000
- UX : L'utilisateur voit des PnL ridicules (ex: 0.02€ au lieu de 200€)
- Confiance : Aucun trader sérieux ne fera confiance à un outil qui calcule mal son PnL

---

**Gravité** : Critique

---

**Recommandation** : Remplacer par un service de calcul PnL qui utilise le type d'instrument (Forex, CFD, Crypto, etc.) et applique le bon multiplicateur. Stocker l'instrument et la devise du compte dans le Trade.

---

**Complexité** : Moyenne

---

**Priorité** : P1

---

### Constat 2 : Le Risk/Reward ratio est calculé de façon arbitraire

```ts
const rr = entry && exit ? (Math.abs(exit - entry) / (entry * 0.001)).toFixed(1) : "—"
```

Cette formule n'a aucun sens financier. Le R:R correct doit être basé sur le SL (stop loss) et le TP (take profit) réels, ou au minimum sur la distance relative entre entrée/sortie en pips.

---

**Impact**
- Business : Le R:R affiché est trompeur
- UX : Un trader expérimenté reconnaît immédiatement l'aberration

---

**Gravité** : Élevée

---

**Recommandation** : Soit ajouter les champs `stopLoss` et `takeProfit` au modèle Trade et calculer le R:R réellement, soit afficher la distance en pips plutôt qu'un R:R fantaisiste.

---

**Complexité** : Faible

---

**Priorité** : P1

---

### Constat 3 : Aucune validation du côté serveur pour le calcul PnL

Le PnL est recalculé côté serveur, ce qui est correct, mais la formule utilisée (`(exitPrice - entryPrice) * lotSize * direction`) est la même que côté client, donc l'erreur est dupliquée.

---

**Impact**
- Business : Le PnL stocké en base est définitivement erroné
- Data : Les stats, rapports, exports seront tous basés sur des données fausses

---

**Gravité** : Critique

---

**Recommandation** : Corriger la formule côté serveur en priorité absolue. Ajouter un champ `instrument` ou `pipMultiplier` au modèle pour supporter différents types d'actifs.

---

**Complexité** : Moyenne

---

**Priorité** : P1

---

### Constat 4 : Pas de prise en charge du multi-compte / multi-devise

Un utilisateur peut trader sur plusieurs comptes (comptes démo, différents brokers). Le modèle actuel ne stocke pas le compte, ni la devise du compte.

---

**Impact**
- Business : Impossible pour un trader professionnel d'utiliser l'outil
- Fonctionnel : Les PnL en EUR/USD/GBP sont mélangés

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter une entité `TradingAccount` (broker, devise, type démo/réel) et lier les trades à un compte.

---

**Complexité** : Élevée

---

**Priorité** : P2

---

### Constat 5 : L'heure du trade (`tradedAt`) est optionnelle côté API

Le champ `tradedAt` est optionnel dans le schéma Zod. Si non fourni, la date courante est utilisée. Cela empêche la journalisation rétroactive de trades passés.

---

**Impact**
- UX : Impossible de logger un trade de la veille
- Fonctionnel : Le journal perd sa valeur historique

---

**Gravité** : Moyenne

---

**Recommandation** : Rendre `tradedAt` requis dans le formulaire avec un sélecteur de date.

---

**Complexité** : Faible

---

**Priorité** : P3

---

## 1.2 Journal Sessions

### Constat 6 : La session ne peut être fermée que via l'API ou automatiquement

Il n'y a pas d'interface utilisateur pour créer, visualiser ou fermer une session de trading. Les routes API existent (`POST /sessions`, `POST /sessions/[id]`) mais aucun composant UI ne les appelle.

---

**Impact**
- UX : Les sessions existent en base mais sont invisibles pour l'utilisateur
- Fonctionnel : Une fonctionnalité clé est enterrée

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter un composant "Session de trading" dans le journal avec un bouton Démarrer/Arrêter, un timer, et le résumé à la fermeture.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 7 : L'auto-fermeture après 5 pertes est trop agressive

La psychologie ferme automatiquement la session après 5 pertes consécutives (via `journal-psychology.ts:91-109`). C'est une décision forte qui devrait être une suggestion, pas une action automatique irréversible.

---

**Impact**
- UX : L'utilisateur peut perdre confiance dans l'outil
- Business : Un trader pourrait être frustré de perdre sa session

---

**Gravité** : Moyenne

---

**Recommandation** : Remplacer la fermeture automatique par une notification avec suggestion + bouton "Fermer la session" dans l'UI. Laisser le contrôle à l'utilisateur.

---

**Complexité** : Faible

---

**Priorité** : P2

---

## 1.3 Daily Reflections

### Constat 8 : Les réflexions sont recalculées à chaque POST

À chaque sauvegarde de réflexion, la route `reflections/route.ts` refait une requête pour compter les trades du jour. Si l'utilisateur modifie sa réflexion plusieurs fois, c'est coûteux et inutile (les `tradeCount`, `wins`, `losses` n'ont pas changé).

---

**Impact**
- Performance : Requête DB inutile à chaque édition
- Architecture : Mauvaise séparation des responsabilités

---

**Gravité** : Faible

---

**Recommandation** : Mettre à jour les compteurs uniquement si le tradeCount est 0 (première création du jour). Sinon, ne pas recalculer. Alternative : les mettre à jour via un webhook ou un trigger.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 9 : La note libre n'a pas de support pour les tags ou catégories

Les réflexions permettent une note libre, mais pas de tags, émotions secondaires, ou catégories d'apprentissage. Impossible de faire des analytics sur "quand est-ce que j'apprends le mieux ?".

---

**Impact**
- Innovation : Limite l'analyse longitudinale
- Métier : Une réflexion taggée permet des corrélations puissantes

---

**Gravité** : Moyenne

---

**Recommandation** : Ajouter un champ `tags` (string[]) et un champ `lessons` (string) dédié aux leçons apprises.

---

**Complexité** : Faible

---

**Priorité** : P3

---

## 1.4 Trading Psychology Engine

### Constat 10 : La règle "Revenge Trading" est trop faible

La détection de revenge trading se base sur "3 pertes en 1h". Un vrai revenge trader peut faire 3 trades en 10 minutes. Le seuil d'une heure est trop large pour être significatif.

---

**Impact**
- Métier : Faux positifs -> l'utilisateur ignore les alertes
- Psychologie : Rate les vrais cas de revenge trading rapide

---

**Gravité** : Élevée

---

**Recommandation** : Remplacer la fenêtre de 1h par 15 minutes pour les pertes rapides, et ajouter une détection basée sur l'augmentation soudaine de la taille des lots après une perte (classic revenge behavior).

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 11 : Le seuil d'Overtrading (10 trades/jour) est arbitraire

10 trades/jour peut être normal pour un scalpeur mais excessif pour un swing trader. Le seuil devrait être personnalisable par utilisateur ou basé sur son historique.

---

**Impact**
- UX : Les scalpeurs seront spammés d'alertes inutiles
- Métier : L'alerte perd sa crédibilité

---

**Gravité** : Moyenne

---

**Recommandation** : Rendre le seuil configurable dans les préférences utilisateur, ou utiliser un écart-type par rapport à la moyenne des 30 derniers jours.

---

**Complexité** : Moyenne

---

**Priorité** : P3

---

### Constat 12 : Les alertes bypassent le système de notification central

`journal-psychology.ts` crée les notifications via `prisma.notification.create()` directement au lieu d'utiliser `notify()`. Conséquence : pas de push, pas d'email, pas de Telegram, pas de WhatsApp. L'utilisateur ne voit l'alerte que s'il ouvre l'app.

---

**Impact**
- Fonctionnel : Les alertes psychologiques sont les plus importantes mais les moins visibles
- Business : Un trader en revenge trading a besoin d'une notification immédiate, pas dans 3h quand il ouvre l'app

---

**Gravité** : Critique

---

**Recommandation** : Remplacer les appels `prisma.notification.create()` directs par `notify()` en spécifiant le canal approprié. La criticité de l'alerte doit déterminer le canal (critical -> push + notification).

---

**Complexité** : Faible

---

**Priorité** : P1

---

### Constat 13 : Les alertes sont limitées à 1 par règle par jour

Le code empêche la même alerte d'être envoyée plusieurs fois par jour. C'est trop restrictif : si l'utilisateur fait 15 trades dans la journée et continue en revenge trading après la première alerte, il ne sera plus averti.

---

**Impact**
- Business : Un trader peut détruire son compte sans recevoir d'alerte
- Psychologie : Le but est de protéger, pas de limiter les notifications

---

**Gravité** : Élevée

---

**Recommandation** : Remplacer la limite quotidienne par un cooldown de 15-30 minutes. Si le comportement persiste après le cooldown, renvoyer une alerte.

---

**Complexité** : Faible

---

**Priorité** : P2

---

## 1.5 Streak Tracking

### Constat 14 : DISCIPLINE_STREAK est défini mais jamais utilisé

Le `StreakType` contient `DISCIPLINE_STREAK` mais aucune ligne de code ne crée, met à jour ou affiche ce streak.

---

**Impact**
- Fonctionnel : Une fonctionnalité annoncée mais absente
- Confiance : Incohérence entre le schéma et le produit livré

---

**Gravité** : Moyenne

---

**Recommandation** : Soit implémenter le suivi de la discipline (nombre de jours consécutifs avec journalisation complète : trade + réflexion), soit retirer le type de l'enum.

---

**Complexité** : Faible

---

**Priorité** : P3

---

## 1.6 Weekly Email Reports

### Constat 15 : Le rapport hebdo ne prend pas en compte le fuseau horaire

Le script `journal-weekly-report.ts` calcule la semaine du lundi passé au dimanche en UTC (via `new Date()`). Un trader à Tokyo (-9h) verra son lundi commencer à 9h UTC, donc des trades du lundi matin peuvent être exclus ou inclus selon le fuseau.

---

**Impact**
- Métier : Les stats hebdomadaires peuvent être incomplètes
- UX : Confusion si les chiffres ne correspondent pas

---

**Gravité** : Moyenne

---

**Recommandation** : Stocker le fuseau horaire de l'utilisateur et l'utiliser pour le calcul des périodes. Le fuseau peut être déduit du navigateur via `Intl.DateTimeFormat` ou être un champ de profil.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 16 : Aucune métrique de risque dans le rapport hebdo

Le rapport contient Win Rate, PnL, meilleure/pire paire, streak. Mais pas de métriques de risque essentielles : drawdown, Sharpe ratio, expectancy, ratio gain/perte moyen.

---

**Impact**
- Métier : Semi-pros et pros ont besoin de métriques de risque pour évaluer leur performance
- Innovation : Différenciateur concurrentiel manqué

---

**Gravité** : Moyenne

---

**Recommandation** : Ajouter au moins le drawdown maximum, l'expectancy (gain moyen par trade), et le ratio gain/perte moyen.

---

**Complexité** : Faible

---

**Priorité** : P3

---

# 2. AUDIT MÉTIER

## 2.1 Positionnement produit

### Constat 17 : Le Journal ne résout aucun problème spécifique du trader

Le journal actuel est un "tracker de trades basique". Il ne répond à aucune question métier concrète :
- "Pourquoi j'ai perdu aujourd'hui ?"
- "Quel setup me rapporte le plus ?"
- "Est-ce que je trade mieux le matin ou l'après-midi ?"
- "Quelle émotion me coûte le plus d'argent ?"
- "Est-ce que je respecte mon plan de trading ?"

---

**Impact**
- Business : Aucune valeur ajoutée réelle pour le trader
- Rétention : L'utilisateur n'a aucune raison de revenir quotidiennement

---

**Gravité** : Critique

---

**Recommandation** : Redéfinir la proposition de valeur du Journal autour de 3 piliers :
1. **Prise de conscience** (psychologie, patterns, comportements)
2. **Amélioration continue** (recommandations personnalisées, challenges)
3. **Performance mesurable** (métriques de progression dans le temps)

---

**Complexité** : Élevée

---

**Priorité** : P1

---

### Constat 18 : Aucun lien avec le Plan de Trading

Le modèle `JournalSession` a un champ `planId` optionnel, mais aucune fonctionnalité ne permet de :
- Associer un trade à une règle de trading spécifique
- Vérifier si le trade a suivi le plan
- Voir quelles règles du plan sont les plus rentables

---

**Impact**
- Métier : Le coeur du métier de trader est de suivre un plan. Le journal ignore ça.
- Produit : Incohérence majeure avec la promesse "NeverBrokeAgain"

---

**Gravité** : Critique

---

**Recommandation** : Ajouter un modèle `TradeRule` (ou utiliser le plan de trading existant), lier chaque trade à une règle, et ajouter une colonne "Suivi du plan" (oui/non/partiellement) dans le formulaire de trade.

---

**Complexité** : Élevée

---

**Priorité** : P1

---

### Constat 19 : Aucune notion de "Setup" ou "Stratégie"

Chaque trade a une paire et une direction, mais pas de setup (breakout, pullback, trend continuation, etc.) ni de stratégie (scalping, day trading, swing). Impossible de savoir quel setup est le plus rentable.

---

**Impact**
- Métier : Le trader ne peut pas analyser sa performance par stratégie
- Data : Analytics limités par paire uniquement

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter un champ `strategy` (enum : SCALPING, DAY_TRADING, SWING, POSITION) et `setupType` (BREAKOUT, PULLBACK, REVERSAL, RANGE, etc.).

---

**Complexité** : Faible

---

**Priorité** : P2

---

### Constat 20 : Aucune notion de gestion des risques (SL/TP)

Pas de stop loss ni take profit dans le modèle Trade. La gestion des risques est le pilier #1 du trading professionnel. Son absence est rédhibitoire.

---

**Impact**
- Métier : Un journal sans SL/TP est inutilisable pour un trader sérieux
- Formation : Impossible d'analyser si le trader respecte ses stop loss

---

**Gravité** : Critique

---

**Recommandation** : Ajouter `stopLoss` et `takeProfit` (Decimal) au modèle Trade. Ajouter des métriques : "Trades avec SL," "Trades sans SL," "Ratio TP atteint."

---

**Complexité** : Faible

---

**Priorité** : P1

---

### Constat 21 : Aucune analyse des frais (spread, commission, swap)

Un trade "WIN" de 10€ avec 15€ de spread est en réalité une perte. Le PnL actuel ignore complètement les coûts de transaction. Aucun trader réel ne peut évaluer sa performance sans ça.

---

**Impact**
- Métier : Le PnL affiché est systématiquement optimiste
- Confiance : Découvert trop tard, l'utilisateur se sent trompé

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter des champs `spread`, `commission`, `swap` (Decimal) au Trade. Calculer le PnL net = PnL brut - spread - commission - swap.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

# 3. AUDIT UX

## 3.1 Parcours utilisateur

### Constat 22 : Trois onglets isolés, pas de narration

Les onglets "Trades", "Stats", "Réflexions" sont trois silos. L'utilisateur doit naviguer entre eux sans fil conducteur. Il n'y a pas de vue "Tableau de bord du jour" qui rassemble les informations clés au même endroit.

---

**Impact**
- UX : Navigation fastidieuse, perte de contexte
- Rétention : L'utilisateur abandonne après 2-3 utilisations

---

**Gravité** : Élevée

---

**Recommandation** : Créer une vue "Aujourd'hui" qui combine : session en cours, dernier trade, réflexion du jour (si pas faite), streak actuel, PnL du jour. Les onglets deviennent secondaires.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 23 : Pas de formulaire de session dans l'UI

La session est créée automatiquement à la création du premier trade, mais l'utilisateur n'a aucun contrôle : il ne peut pas la démarrer consciemment, voir sa durée, ou la fermer.

---

**Impact**
- UX : L'utilisateur ne sait pas qu'il est en session
- Fonctionnel : Impossible de trader "hors session"

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter un composant "Session" avec un bouton start/stop visible dans l'en-tête du journal, affichant le timer et le nombre de trades de la session.

---

**Complexité** : Faible

---

**Priorité** : P2

---

### Constat 24 : Le formulaire de trade est un Dialog modal

Sur mobile, un Dialog modal pour saisir un trade est une mauvaise expérience : il prend tout l'écran, cache le contexte, et ne permet pas de consulter les trades précédents pendant la saisie.

---

**Impact**
- UX Mobile : Frustrant, l'utilisateur doit fermer le dialogue pour voir ses trades
- Productivité : Ralentit la saisie des trades en conditions réelles

---

**Gravité** : Moyenne

---

**Recommandation** : Remplacer le Dialog par un BottomSheet sur mobile (comme le commentaire le dit d'ailleurs : `{/* Formulaire de trade (BottomSheet en mobile, Dialog en desktop) */}` mais le code n'implémente que le Dialog). Utiliser `Sheet` de shadcn/ui.

---

**Complexité** : Moyenne

---

**Priorité** : P3

---

### Constat 25 : Pas de recherche dans la liste des trades

Avec 20 trades par page, un trader actif atteint rapidement des centaines de trades. Impossible de rechercher par date, paire, résultat, ou mot-clé dans les notes.

---

**Impact**
- UX : Navigation impossible dans l'historique
- Fonctionnel : Le journal devient un trou noir

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter un champ de recherche full-text qui filtre par pair, note, signal. Ajouter des filtres de date (calendrier).

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 26 : Pas de support pour l'édition des trades

Un trade est créé et ne peut être que supprimé. Pas de modification possible. Une erreur de saisie (fat-finger sur le prix) oblige à supprimer et recréer le trade.

---

**Impact**
- UX : Pénalise l'utilisateur pour une erreur mineure
- Business : Données sales si l'utilisateur ne prend pas la peine de corriger

---

**Gravité** : Moyenne

---

**Recommandation** : Ajouter un mode édition dans le `TradeCard` (icône crayon -> dialog prérempli) et corriger la route PUT existante qui est déjà implémentée mais non utilisée.

---

**Complexité** : Faible

---

**Priorité** : P2

---

### Constat 27 : Aucune confirmation visuelle après enregistrement

Après avoir enregistré un trade, l'utilisateur voit un toast "Trade enregistré" fugitif. Pas d'animation, pas de mise à jour visible du streak, pas de feedback émotionnel.

---

**Impact**
- UX : L'enregistrement semble "froid"
- Gamification : Occasion manquée de renforcer les comportements positifs

---

**Gravité** : Faible

---

**Recommandation** : Ajouter une micro-animation de confirmation, un "streak popup" si une série est en cours, et un confetti pour les milestones (10, 50, 100 trades).

---

**Complexité** : Faible

---

**Priorité** : P3

---

## 3.2 Psychology Engine UX

### Constat 28 : Les alertes psychologiques sont invisibles

Les notifications de type `JOURNAL_PSYCHOLOGY` sont stockées en base mais il n'y a pas de composant UI dédié pour les afficher dans le journal. L'utilisateur doit aller dans son centre de notifications général pour les voir.

---

**Impact**
- UX : Les alertes les plus importantes sont les moins visibles
- Business : Le volant psychologique perd tout son impact

---

**Gravité** : Élevée

---

**Recommandation** : Afficher les alertes dans le journal lui-même : un bandeau en haut de la page, avec la sévérité codée par couleur (info = bleu, warning = orange, critical = rouge).

---

**Complexité** : Faible

---

**Priorité** : P2

---

# 4. AUDIT UI

### Constat 29 : Pas de mode sombre / Mode sombre non supporté

À vérifier, mais si le design system supporte le dark mode, les trade cards et le journal doivent s'adapter.

### Constat 30 : Pas de responsive pour les graphiques

Les graphiques (Chart component) ont des hauteurs fixes (`height={180}`) qui ne s'adaptent pas à la taille de l'écran mobile.

---

**Impact**
- UI Mobile : Graphiques trop petits sur desktop, trop grands sur mobile
- UX : Données illisibles sur mobile

---

**Gravité** : Moyenne

---

**Recommandation** : Utiliser des hauteurs relatives (`max-h-40` avec `aspect-ratio`) ou mesurer la largeur du conteneur parent.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 31 : Les StatCards n'ont pas de libellé en français

L'interface est en français mais les stat cards affichent "Win Rate", "Streak", "Best trade" en anglais. Incohérence linguistique.

---

**Impact**
- UI : Manque de polish
- Perception : Produit amateur

---

**Gravité** : Faible

---

**Recommandation** : Tout traduire en français ou tout garder en anglais. Pas de mélange.

---

**Complexité** : Faible

---

**Priorité** : P4

---

# 5. AUDIT BASE DE DONNÉES

### Constat 32 : Le champ `pnl` est nullable

`pnl Decimal? @db.Decimal(12, 2)` — Le PnL devrait toujours être calculé. Un trade sans PnL est une anomalie qui complique les requêtes d'agrégation (COALESCE partout).

---

**Impact**
- Performance : Obligation d'utiliser `COALESCE` pour tous les SUM
- Data : Risque d'incohérence

---

**Gravité** : Moyenne

---

**Recommandation** : Rendre `pnl` requis (`Decimal` non-nullable). Si un trade est BREAKEVEN, le PnL est 0.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 33 : Le champ `rrRatio` est stocké mais n'est jamais mis à jour

Le `rrRatio` est défini dans le prisma schema mais n'est jamais calculé ni mis à jour lors de la création ou modification d'un trade côté API. Il reste toujours nul.

---

**Impact**
- Data : Champ mort qui stocke toujours NULL
- Fonctionnel : `TradeCard` affiche un R:R qui vient du calcul client, pas de la base

---

**Gravité** : Moyenne

---

**Recommandation** : Soit le supprimer du schéma (et le calculer à la volée), soit le calculer et le stocker dans l'API POST/PUT.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 34 : Pas d'index sur `deletedAt` dans la table `trades`

L'index actuel est sur `[userId, tradedAt]` mais la majorité des requêtes incluent `deletedAt: null`. Sans index composite incluant `deletedAt`, le scan filtrera en mémoire.

---

**Impact**
- Performance : Dégradation linéaire avec le nombre de trades supprimés
- Scale : Problématique à partir de 100k+ trades

---

**Gravité** : Moyenne

---

**Recommandation** : Ajouter `@@index([userId, deletedAt, tradedAt])` pour couvrir les requêtes les plus courantes.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 35 : Pas de partitionnement temporel de la table `trades`

Un trader actif peut générer 500+ trades par mois. Sur 2 ans, cela fait 12 000 trades par utilisateur. Avec 1000 utilisateurs actifs, la table atteint 12M lignes.

---

**Impact**
- Performance : Les requêtes d'agrégation (stats, rapports) deviendront lentes
- Maintenance : Les nettoyages (soft-delete) seront coûteux

---

**Gravité** : Faible (maintenant) / Élevée (6 mois)

---

**Recommandation** : Prévoir un partitionnement mensuel ou trimestriel de la table `trades`. Mettre en place une stratégie d'archivage des trades > 2 ans.

---

**Complexité** : Élevée

---

**Priorité** : P3

---

### Constat 36 : Le modèle `DailyReflection` a des champs redondants

`tradeCount`, `wins`, `losses`, `totalPnl` sont stockés dans `DailyReflection` mais aussi dérivables des trades. C'est une dénormalisation utile pour les performances, mais le recalcul systématique à chaque POST (`reflections/route.ts`) supprime l'avantage : on refait la requête à chaque édition.

---

**Impact**
- Architecture : Dénormalisation sans bénéfice
- Performance : Requête coûteuse pour une mise à jour simple de note

---

**Gravité** : Faible

---

**Recommandation** : Recalculer les compteurs uniquement si le `tradeCount` stocké est 0 (première réflexion du jour) ou via un trigger/event séparé.

---

**Complexité** : Faible

---

**Priorité** : P3

---

### Constat 37 : La table `Notification` n'a pas d'index composite pour le type

Les requêtes de psychologie filtrent par `type: "JOURNAL_PSYCHOLOGY"` ET `createdAt: { gte: todayStart }`. L'index actuel sur `[userId]` et `[createdAt]` ne couvre pas ce cas.

---

**Impact**
- Performance : Scan partiel de toutes les notifications de l'utilisateur
- Scale : Problématique si l'utilisateur a beaucoup de notifications

---

**Gravité** : Faible

---

**Recommandation** : Ajouter `@@index([userId, type, createdAt])`.

---

**Complexité** : Faible

---

**Priorité** : P3

---

# 6. AUDIT ARCHITECTURE

### Constat 38 : `checkPsychology` est appelé en fire-and-forget sans file d'attente

```ts
checkPsychology(session.user.id).catch(() => {})
```

Si `checkPsychology` échoue (DB timeout, erreur), l'erreur est silencieusement ignorée. Aucune file d'attente, aucune reprise. En cas de pic de trades, les appels concurrents peuvent submerger la DB.

---

**Impact**
- Fiabilité : Les alertes psychologiques peuvent ne jamais arriver sans que personne ne le sache
- Architecture : Pattern dangereux qui masque les erreurs

---

**Gravité** : Élevée

---

**Recommandation** : Utiliser BullMQ pour mettre `checkPsychology` dans une file d'attente avec retry. Garder le `catch` uniquement pour la route API (ne pas bloquer le create), mais logger l'erreur.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 39 : La route `GET /stats` exécute une requête raw SQL pour `byDay`

```ts
prisma.$queryRawUnsafe(...)
```

L'utilisation de raw SQL dans une API Next.js est un red flag : pas de validation de type, pas de protection contre les injections (même si paramétrée ici), cassant si le schéma change.

---

**Impact**
- Maintenabilité : Fragile au changement de schéma
- Sécurité : Pattern dangereux si copié-collé ailleurs

---

**Gravité** : Moyenne

---

**Recommandation** : Remplacer par Prisma native : grouper par date avec `$queryRaw` typé, ou utiliser une vue matérialisée pour les stats.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 40 : Architecture monolithique des routes API

Tout le journal est dans `api/dashboard/journal/`. Pas de séparation BFF (Backend For Frontend), pas de service layer dédié. Les routes accèdent directement à Prisma.

---

**Impact**
- Évolutivité : Impossible d'exposer ces données via une API publique ou mobile sans duplication
- Testabilité : Les routes sont difficilement testables sans appels HTTP

---

**Gravité** : Moyenne

---

**Recommandation** : Extraire une couche service pour chaque domaine (TradeService, PsychologyService, StatsService, ReflectionService). Les routes API deviennent des adaptateurs.

---

**Complexité** : Élevée

---

**Priorité** : P3

---

### Constat 41 : Pas de gestion des timeouts DB

Aucune des routes API ne définit de timeout Prisma. Si la DB est lente, la route Next.js peut tenir jusqu'au timeout Vercel (10s sur Hobby, 60s sur Pro). Pas de circuit breaker.

---

**Impact**
- Production : Une DB lente peut faire planter toute l'application
- UX : L'utilisateur voit un spinner infini

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter `requestTimeout` à Prisma, utiliser des timeouts par requête, et un circuit breaker pour les appels DB intensifs (stats, rapports).

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

# 7. AUDIT SÉCURITÉ

### Constat 42 : Pas de rate limiting sur les routes API

Un utilisateur peut créer des milliers de trades en quelques secondes. Aucune protection. Cela peut être utilisé pour saturer la DB ou fausser les stats.

---

**Impact**
- Sécurité : Risque de déni de service applicatif
- Business : Un utilisateur malveillant peut polluer les données

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter un rate limiting (via Upstash/Vercel KV ou middleware) : max 30 requêtes POST/min par utilisateur sur les routes journal.

---

**Complexité** : Faible

---

**Priorité** : P2

---

### Constat 43 : Pas de validation du propriétaire pour les sessions

La route `POST /sessions/[id]` vérifie que l'utilisateur est le propriétaire de la session (`ses.userId !== session.user.id`). C'est bien. Mais il n'y a pas de vérification pour la route `POST /sessions` (création) — n'importe quel utilisateur authentifié peut créer des sessions.

---

**Impact**
- Sécurité : Risque faible, mais cohérence

---

**Gravité** : Faible

---

**Recommandation** : Ajouter une vérification que l'utilisateur n'a pas déjà une session active dans la création (déjà fait) et limiter à 1 session active par utilisateur.

---

**Complexité** : Faible

---

**Priorité** : P4

---

### Constat 44 : Pas de sanitization des notes et réflexions

Les notes libres (`note` dans Trade et DailyReflection) ne sont pas sanitizées. Si un utilisateur insère du contenu HTML/JS, il sera rendu tel quel dans l'UI (via dangerou slySetInnerHTML ou textContent ?). React échappe par défaut, donc le risque XSS est faible mais pas nul.

---

**Impact**
- Sécurité : Risque XSS faible mais présent

---

**Gravité** : Faible

---

**Recommandation** : Sanitizer les notes côté serveur (DOMPurify ou équivalent) même si le rendu est sécurisé par React.

---

**Complexité** : Faible

---

**Priorité** : P4

---

# 8. AUDIT PERFORMANCE

### Constat 45 : La route GET /trades charge tout l'historique des trades pour les filtres

```ts
prisma.trade.findMany({
  where: { userId: session.user.id, deletedAt: null },
  select: { pair: true },
  distinct: ["pair"],
  orderBy: { pair: "asc" },
})
```

Cette requête charge TOUS les trades de l'utilisateur (pas de limite, pas de pagination) juste pour obtenir la liste des paires distinctes. Sur un utilisateur avec 50k trades, les filtres deviennent un bottleneck.

---

**Impact**
- Performance : Dégradation linéaire avec le nombre de trades
- Scale : Bloquant à partir de 10k+ trades

---

**Gravité** : Élevée

---

**Recommandation** : Utiliser `groupBy` de Prisma au lieu de `distinct` sur tous les enregistrements, ou maintenir une table de métadonnées mise à jour par trigger.

---

**Complexité** : Faible

---

**Priorité** : P2

---

### Constat 46 : N+1 sur la route stats-by-signal

```ts
const signals = await prisma.trade.groupBy(...)
const result = await Promise.all(signals.map(async (s) => {
  const signalTrades = await prisma.trade.findMany(...)  // 1 requête par signal
  const signal = await prisma.signal.findUnique(...)       // 1 requête par signal
  ...
}))
```

Pour N signaux, cette route exécute 2N+1 requêtes.

---

**Impact**
- Performance : Latence = O(N) requêtes séquentielles
- Scale : 100 signaux = 201 requêtes

---

**Gravité** : Élevée

---

**Recommandation** : Utiliser des `include` ou des requêtes agrégées. Charger tous les signaux en une requête et les mapper.

---

**Complexité** : Moyenne

---

**Priorité** : P2

---

### Constat 47 : Le trade-form recalcule le PnL à chaque frappe

```ts
const entry = parseFloat(entryPrice) || 0
const exit = parseFloat(exitPrice) || 0
// ...
const pnl = result === "BREAKEVEN" ? 0 : (exit - entry) * lot * dir
```

Chaque changement dans le formulaire déclenche un recalcul et un re-render complet. Pas de debounce, pas de memoïsation.

---

**Impact**
- UX : Latence sur mobile quand l'utilisateur tape rapidement
- Performance : Re-renders superflus

---

**Gravité** : Faible

---

**Recommandation** : Utiliser `useMemo` pour les valeurs calculées et déplacer le calcul PnL dans un service séparé.

---

**Complexité** : Faible

---

**Priorité** : P4

---

### Constat 48 : Pas de pagination pour les réflexions

La route GET /reflections retourne jusqu'à 90 réflexions sans pagination côté client. Ce n'est pas bloquant (90 enregistrements), mais ça peut le devenir.

---

**Impact**
- Scale : Faible aujourd'hui, problématique à long terme

---

**Gravité** : Faible

---

**Recommandation** : Ajouter la pagination pour les réflexions comme c'est fait pour les trades.

---

**Complexité** : Faible

---

**Priorité** : P4

---

# 9. AUDIT ÉVOLUTIVITÉ

### Constat 49 : Impossible d'ajouter un nouveau type d'émotion sans migration

Le type `Mood` est un enum Prisma. Ajouter une nouvelle émotion (ex: "BORED", "EXCITED") nécessite une migration DB. Pour une startup qui itère vite, c'est trop rigide.

---

**Impact**
- Évolutivité : Chaque nouveau mood = migration + déploiement
- Innovation : Freine l'expérimentation produit

---

**Gravité** : Moyenne

---

**Recommandation** : Remplacer l'enum `Mood` par un string simple ou une table `Moods` (relation) avec seed data. Permet d'ajouter des moods sans migration.

---

**Complexité** : Moyenne

---

**Priorité** : P3

---

### Constat 50 : Pas de support multi-broker / multi-compte

Comme mentionné plus haut (Constat 4), l'absence de `TradingAccount` empêche l'utilisateur de consolider les trades de plusieurs brokers.

---

**Impact**
- Produit : Bloque l'accès aux traders multi-broker
- Business : Perte de parts de marché

---

**Gravité** : Élevée

---

**Recommandation** : Ajouter le modèle `TradingAccount` avec `brokerName`, `accountType` (DEMO/REAL), `currency`, et lier les trades.

---

**Complexité** : Élevée

---

**Priorité** : P2

---

### Constat 51 : Pas d'API publique ni d'import automatique

Un trader qui utilise mt4/mt5/TradingView ne peut pas importer ses trades automatiquement. Il doit tout saisir manuellement. C'est rédhibitoire pour les traders actifs.

---

**Impact**
- Produit : Barrière à l'adoption massive
- Concurrentiel : Tous les journaux sérieux offrent l'import automatique

---

**Gravité** : Critique

---

**Recommandation** : Développer un import CSV avec mapping des colonnes, puis à terme une API publique et des connecteurs MetaTrader/cTrader/TradingView.

---

**Complexité** : Élevée

---

**Priorité** : P1

---

### Constat 52 : Pas de tags personnalisés

L'utilisateur ne peut pas tagger ses trades (ex: "news_trade", "demo", "mnemonic"). Impossible de faire des analyses personnalisées.

---

**Impact**
- Flexibilité : Chaque utilisateur a sa propre taxonomie
- Innovation : Les tags permettent des insights puissants

---

**Gravité** : Moyenne

---

**Recommandation** : Ajouter un champ `tags` (string[]) sur le modèle Trade, avec une UI de tags style shadcn/ui multi-select.

---

**Complexité** : Moyenne

---

**Priorité** : P3

---

# 10. GAP ANALYSIS

## Matrice de complétude par fonctionnalité

| Fonctionnalité | Statut | Gap |
|---|---|---|
| Trade logging | ✅ Fait | PnL erroné, pas de SL/TP, pas de frais |
| Session de trading | ⚠️ Partiel | API faite, UI absente |
| Daily Reflections | ✅ Fait | Tags manquants, recalcul inutile |
| Psychology Engine | ⚠️ Partiel | Alertes bypassent notify(), seuils arbitraires |
| Streak Tracking | ⚠️ Partiel | DISCIPLINE_STREAK jamais implémenté |
| Weekly Reports | ✅ Fait | Fuseau horaire ignoré, métriques de risque absentes |
| Import/Export | ❌ Absent | Aucun import auto, pas d'export CSV structuré |
| Plan de trading | ❌ Absent | Aucun lien entre trades et règles |
| Multi-compte | ❌ Absent | Un seul compte implicite |
| Tags/Catégories | ❌ Absent | Pas de classification personnalisée |
| API publique | ❌ Absent | Pas d'API externe |
| Tests | ❌ Absent | Zéro test sur le journal |
| Métriques avancées | ❌ Absent | Pas de Sharpe, drawdown, expectancy, ratio gain/perte |
| Gamification | ❌ Absent | Pas de challenges, badges, progression |
| Import auto (MT4/5) | ❌ Absent | Saisie manuelle uniquement |

## Matrice d'alignement produit

| Promesse | Réalité | Gap |
|---|---|---|
| "NeverBrokeAgain" | Pas de gestion des risques (SL/TP) | Critique |
| "Maîtrise tes émotions" | Alertes psychologiques invisibles | Élevée |
| "Améliore ta performance" | PnL erroné, pas de métriques avancées | Critique |
| "Suis ton plan" | Aucun lien avec le plan de trading | Critique |
| "Analyse tes données" | Pas d'export, pas de tags, pas de recherche | Élevée |

---

# 11. RECOMMANDATIONS STRATÉGIQUES

## Quick Wins (P1, < 1 jour)

| # | Action | Impact |
|---|---|---|
| 1 | Corriger le calcul du PnL côté serveur et client | ❌ → ✅ Critique |
| 2 | Remplacer le calcul R:R par un vrai ratio ou le supprimer | ❌ → ✅ Élevé |
| 3 | Utiliser `notify()` pour les alertes psychologiques | ❌ → ✅ Critique |
| 4 | Ajouter des champs SL/TP au modèle Trade | ❌ → ✅ Critique |
| 5 | Supprimer la fermeture auto de session (suggestion only) | ❌ → ✅ Moyen |
| 6 | Traduire les libellés anglais en français | ❌ → ✅ Faible |
| 7 | Ajouter l'édition des trades (route PUT existe déjà) | ❌ → ✅ Moyen |

## Court terme (P2, 1-3 jours)

| # | Action | Impact |
|---|---|---|
| 8 | Ajouter la vue "Aujourd'hui" combinée | ❌ → ✅ Élevé |
| 9 | Ajouter UI des sessions (start/stop/résumé) | ❌ → ✅ Élevé |
| 10 | Ajouter la recherche full-text dans les trades | ❌ → ✅ Élevé |
| 11 | Corriger le N+1 sur stats-by-signal | ❌ → ✅ Élevé |
| 12 | Rate limiting sur les routes API journal | ❌ → ✅ Élevé |
| 13 | Réduire le cooldown des alertes à 15-30 min | ❌ → ✅ Élevé |
| 14 | Rendre les champs `pnl` et `rrRatio` cohérents | ❌ → ✅ Moyen |
| 15 | Ajouter les champs `stopLoss` / `takeProfit` à l'UI | ❌ → ✅ Critique |

## Moyen terme (P3, 1-2 semaines)

| # | Action | Impact |
|---|---|---|
| 16 | Ajouter `strategy` et `setupType` au trade | ❌ → ✅ Élevé |
| 17 | Ajouter `spread`, `commission`, `swap` au trade | ❌ → ✅ Élevé |
| 18 | Implémenter le DISCIPLINE_STREAK | ❌ → ✅ Moyen |
| 19 | Ajouter les tags personnalisés | ❌ → ✅ Moyen |
| 20 | Système de file d'attente pour checkPsychology | ❌ → ✅ Moyen |
| 21 | Extraire une couche service (TradeService, etc.) | ❌ → ✅ Moyen |
| 22 | Import CSV basique | ❌ → ✅ Critique |
| 23 | Ajouter le fuseau horaire utilisateur | ❌ → ✅ Moyen |

## Long terme (P4, 2-4 semaines)

| # | Action | Impact |
|---|---|---|
| 24 | Modèle TradingAccount (multi-broker) | ❌ → ✅ Élevé |
| 25 | API publique | ❌ → ✅ Élevé |
| 26 | Connecteurs MetaTrader/cTrader/TradingView | ❌ → ✅ Critique |
| 27 | Métriques avancées (Sharpe, drawdown, expectancy) | ❌ → ✅ Élevé |
| 28 | Gamification (badges, challenges, milestones) | ❌ → ✅ Moyen |
| 29 | Partitionnement temporel de la table trades | ❌ → ✅ Moyen |
| 30 | Remplacer Mood enum par table flexible | ❌ → ✅ Moyen |

---

# 12. ROADMAP

## Phase 0 — Stabilisation (J1-J2)

> Objectif : rendre le produit fiable et cohérent

- Quick Wins 1-7
- Tests des routes API existantes
- Correction PnL + déploiement hotfix

## Phase 1 — Fondation produit (J3-J7)

> Objectif : combler les gaps métier critiques

- Ajout SL/TP dans le modèle et l'UI
- Vue "Aujourd'hui" combinée
- UI des sessions de trading
- Recherche et filtres dans les trades
- Import CSV basique
- Ajout `strategy`, `setupType`, `tags`

## Phase 2 — Intelligence (S2-S3)

> Objectif : faire du journal un véritable coach

- Métriques avancées (Sharpe, drawdown, expectancy)
- Rapport hebdo enrichi (fuseau horaire, métriques risque)
- Gamification (milestones, streaks visibles)
- Recommandations personnalisées basées sur les patterns
- Alignement avec le plan de trading existant

## Phase 3 — Scale (S4-S6)

> Objectif : préparer le produit pour la croissance

- Multi-compte (TradingAccount)
- API publique
- Connecteurs MetaTrader/cTrader
- Partitionnement DB + optimisation performance
- Tests automatisés (unitaires + intégration)

---

# SCORE DÉTAILLÉ

| Critère | Note | Justification |
|---|---|---|
| **Architecture** (5/10) | Routes API monolithiques, pas de service layer, raw SQL, fire-and-forget sans queue, mais structure propre | Correct |
| **UX** (4/10) | Navigation en silos, pas de vue jour, pas de recherche, pas de session UI, alertes invisibles | Prototype |
| **Fonctionnel** (5/10) | Fonctions de base OK mais PnL erroné, pas de SL/TP, pas de frais, pas de stratégie | Correct |
| **Métier** (3/10) | Ne résout aucun problème réel du trader, pas de lien avec le plan, pas d'analyse de risque | Prototype |
| **Performance** (6/10) | N+1, pas d'index deletedAt, pas de timeout, mais correct pour du small scale | Correct |
| **Sécurité** (5/10) | Pas de rate limiting, sanitization absente, mais auth OK, validation Zod OK | Correct |
| **Évolutivité** (4/10) | Enums rigides, pas de multi-compte, pas de tags, pas d'API publique | Prototype |
| **Innovation** (5/10) | Psychology Engine intéressant mais mal exécuté, gamification absente, pas de ML | Correct |
| **Production** (4/10) | Zéro test, pas de monitoring, pas de gestion d'erreur explicite, dépend de l'app hôte | Prototype |

---

## CLASSEMENT FINAL

| Seuil | Score | Statut |
|---|---|---|
| ❌ Non exploitable | 0-20 | |
| 🟠 Prototype | 21-40 | |
| 🟡 Correct | 41-60 | **46/100 ←** |
| 🟢 Production Ready | 61-85 | |
| 🏆 World Class | 86-100 | |

## VERDICT

**46/100 — 🟡 Correct (limite Prototype)**

Le Trading Journal de NeverBrokeAgain est fonctionnel mais **ne peut pas être livré en l'état** pour un produit SaaS Premium.

**Raisons principales :**
1. Le PnL est **erroné** — problème critique qui invalide toutes les données
2. Absence de **Stop Loss / Take Profit** — rédhibitoire pour un journal de trading
3. Aucun **lien avec le plan de trading** — la fonction #1 d'un journal sérieux
4. Les **alertes psychologiques sont invisibles** — le coeur de la proposition de valeur
5. **Zéro test** — impossible de garantir la qualité en production

**Après Phase 0 (Quick Wins) :** ~55/100 — Correct

**Après Phase 1 (Fondation) :** ~68/100 — Production Ready

**Après Phase 3 (Scale) :** ~85/100 — Production Ready+

---

*Audit réalisé le 19 juillet 2026 par Master Prompt IA — Principal Software Architect, Senior Product Manager, Trading Performance Coach, UX Lead, Prisma Expert, Tech Lead.*

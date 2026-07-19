# MASTER_TRADE_ENGINE_AUDIT.md

> Version : 1.0
> Projet : NeverBrokeAgain
> Date : 2026-07-19

---

# SCORE GLOBAL : 52/100 — 🟠 GO AVEC RÉSERVES

| Domaine | Score | Niveau |
|---|---|---|
| Architecture | 6/10 | 🟡 Correct |
| Métier | 5/10 | 🟡 Correct |
| Calculs | 4/10 | 🟠 Prototype |
| Performance | 5/10 | 🟡 Correct |
| Sécurité | 6/10 | 🟡 Correct |
| Prisma | 5/10 | 🟡 Correct |
| API | 7/10 | 🟡 Correct |
| Qualité du Code | 5/10 | 🟡 Correct |
| Scalabilité | 4/10 | 🟠 Prototype |
| Production | 5/10 | 🟡 Correct |
| **MOYENNE** | **5.2/10** | **🟠 GO AVEC RÉSERVES** |

---

# VERDICT FINAL

## 🟠 GO AVEC RÉSERVES

Le moteur est **structurellement sain** mais présente **4 bugs bloquants** et **8 vulnérabilités critiques** qui doivent être corrigées **AVANT** la mise en production.

**Résumé des risques majeurs :**
- Perte de distribution : si BullMQ échoue, le signal est marqué "envoyé" sans l'être
- Aucun calcul financier réel : pas de PnL, pas de risque, pas de métrique de performance dans le moteur
- Transaction manquante entre la création du signal et la mise en file d'attente
- Échecs silencieux : Telegram, WhatsApp, Redis pub/sub sont fire-and-forget sans logging

---

# PHASE 1 — AUDIT DU MODÈLE SIGNAL

## 1.1 Modèle Signal (Prisma)

### Constat 1 : `currentVersion` incrémenté même sans changement de contenu

Le champ `currentVersion` est toujours incrémenté dans `update-signal.ts:52` même si seulement l'audience ou la date de publication change. La `SignalVersion` est créée uniquement si `content` change, mais le compteur du signal est avancé.

**Impact** : L'historique des versions devient incohérent : version 3 peut exister sans `SignalVersion` associée. Un admin voit "version 3" mais ne peut pas revenir à la version 2.

**Gravité** : Élevée

**Correction** : Incrémenter `currentVersion` uniquement si `content` a changé, ou créer une `SignalVersion` pour tout type de changement (audience, images, etc.).

---

### Constat 2 : `imageUrl` (legacy) et `imageUrls` peuvent diverger

Deux champs stockent la même information : `imageUrl` (String?) et `imageUrls` (Json[]). Le code met à jour `imageUrl` comme premier élément de `imageUrls`, mais si un appel API met à jour `imageUrl` sans `imageUrls`, les deux peuvent diverger.

**Impact** : L'UI de la carte signal peut afficher une image différente de la vue détail.

**Gravité** : Moyenne

**Correction** : Supprimer `imageUrl` après migration vers `imageUrls` ou ajouter une validation Zod `refine` qui vérifie la cohérence.

---

### Constat 3 : `scheduledAt` nullable sans fuseau horaire utilisateur

`ScheduledAt` stocke un timestamp UTC. Si un admin planifie un signal depuis son fuseau horaire, le moment déclenché sera décalé sans indication. Il n'y a pas de champ `timezone` ni de conversion.

**Impact** : Un admin à Paris planifie à 14h CEST, le signal part à 14h UTC (16h CEST).

**Gravité** : Moyenne

**Correction** : Ajouter un champ `timezone` optionnel ou convertir systématiquement en UTC côté serveur avec indication claire dans l'UI.

---

### Constat 4 : Pas de validation métier sur `publishedAt` et `scheduledAt`

Un signal peut avoir `publishedAt` sans `status: PUBLISHED` (incohérence). Un signal peut avoir `scheduledAt` dans le passé. Aucune contrainte Prisma ni validation Zod ne l'empêche.

**Impact** : Incohérence de données silencieuse.

**Gravité** : Moyenne

**Correction** : Ajouter une validation au niveau service.

---

## 1.2 Index et performances

### Constat 5 : Index manquant sur `NotificationDelivery(notificationId, channel)`

Le delivery report (`getSignalDelivery`) groupe par `notificationId` et `channel`, mais l'index actuel ne le couvre pas. Requête sur toutes les deliveries pour regrouper.

**Impact** : Le delivery dashboard ralentit proportionnellement au nombre total de livraisons.

**Gravité** : Élevée

**Correction** : `@@index([notificationId, channel, status])`

---

### Constat 6 : Pas d'index sur `Notification(userId, type, createdAt)`

`signal-distribution.ts` et `journal-psychology.ts` filtrent par type et date. Pas d'index composite.

**Impact** : Scan séquentiel des notifications à chaque distribution.

**Gravité** : Moyenne

**Correction** : `@@index([userId, type, createdAt])`

---

# PHASE 2 — AUDIT DES CALCULS

### Constat 7 : Aucun calcul financier dans le Trade Engine

Le moteur est purement un système de distribution de signaux. Il n'y a AUCUN calcul financier :
- Pas de calcul de PnL
- Pas de Risk/Reward
- Pas de pips
- Pas d'expectancy
- Pas de drawdown
- Pas de Sharpe ou Sortino
- Pas de profit factor
- Pas de ratio gain/perte

Tous les calculs sont dans le Journal (qui a déjà été audité avec la note 46/100 et un PnL erroné).

**Impact** : Le "Trading Engine" ne fait aucun trading. Le produit ne peut pas être présenté comme un moteur de trading.

**Gravité** : Critique

**Correction** : Soit renommer le module "Signal Distribution Engine", soit ajouter les calculs de performance au coeur du système.

---

### Constat 8 : Aucune métrique de risque dans le signal

Un signal de trading devrait fournir :
- Stop Loss suggéré
- Take Profit suggéré
- Risk/Reward ratio
- Niveau de confiance
- Taille de position suggérée
- Probabilité de succès estimée

Aucun de ces champs n'existe dans le modèle Signal.

**Impact** : Un trader reçoit "ACHETER EURUSD" sans SL/TP. Il ne peut pas évaluer le risque.

**Gravité** : Critique

**Correction** : Ajouter `suggestedStopLoss`, `suggestedTakeProfit`, `confidence` (enum basse/moyenne/élevée), `riskLevel` au modèle Signal.

---

# PHASE 3 — AUDIT DES VALIDATIONS

### Constat 9 : `imageUrl` n'est pas validé comme chemin sécurisé

Le schéma Zod valide `imageUrls` avec `safePath` (regex), mais `imageUrl` (legacy) est juste `z.string().nullable().optional()`. Un chemin arbitraire peut être stocké.

**Impact** : Risque de path traversal si `imageUrl` est utilisé dans des opérations filesystem sans validation.

**Gravité** : Élevée

**Correction** : Appliquer la même regex `safePath` à `imageUrl`.

---

### Constat 10 : `scheduledAt` n'est pas validé comme date ISO valide

Le champ `scheduledAt` est `z.string().nullable().optional()` — pas de validation `datetime()`. Toute chaîne est acceptée.

**Impact** : Un admin peut saisir "demain" ou "abc" comme date planifiée, `new Date("abc")` produit `Invalid Date`, les comparaisons échouent silencieusement.

**Gravité** : Élevée

**Correction** : Ajouter `.datetime()` ou `.regex()` pour la validation ISO, ou mieux, utiliser `z.coerce.date()`.

---

### Constat 11 : `lotSize` max 100 dans le journal — trop restrictif pour certains instruments

Le schéma du journal limite `lotSize` à 100. Pour les indices (US30), un lot standard peut être 1. Pour le Forex, 100 lots standard = 10M€. Pour les brokers institutionnels, c'est faible.

**Impact** : Un trader professionnel avec des gros volumes ne peut pas logger ses trades.

**Gravité** : Faible

**Correction** : Supprimer la limite haute ou la rendre dépendante du type d'instrument.

---

# PHASE 4 — AUDIT DES WORKFLOWS

### Constat 12 : Création du signal sans transaction — échec partiel possible

Dans `create-signal.ts`, les opérations suivantes ne sont PAS dans une transaction Prisma :
1. Création du signal (ligne 29)
2. Création de la version 1 (ligne 54)
3. Mise à jour du `jobId` (ligne 77)
4. Audit event (ligne 96)

Si l'étape 2 ou 3 échoue, le signal existe sans version 1, ou avec `jobId` non défini. Le worker ne pourra pas annuler la tâche.

**Impact** : Signal orphelin sans version, ou tâche BullMQ non traçable.

**Gravité** : Élevée

**Correction** : Wrapper création + version + jobId dans `prisma.$transaction()`.

---

### Constat 13 : Mise à jour du signal sans transaction — données incohérentes

Dans `update-signal.ts`, les opérations suivantes ne sont pas atomiques :
1. Suppression des anciennes audience (ligne 78)
2. Création des nouvelles audience (ligne 79)
3. Incrémentation de version (ligne 83)
4. Création de SignalVersion (ligne 97)
5. Mise à jour jobId (ligne 122)
6. Cancellation ancien job BullMQ (ligne 40-49)

Si la création des nouvelles audience échoue après la suppression des anciennes, le signal perd toutes ses cibles. Les membres ne recevront pas le signal même s'il est publié.

**Impact** : Perte de diffusion. Signal publié mais personne ne le reçoit.

**Gravité** : Critique

**Correction** : Wrapper toute la séquence dans `prisma.$transaction()`.

---

### Constat 14 : Double distribution possible

Si BullMQ est redémarré ou si le job expire (visibility timeout), le job `distribute-signal-{id}` peut être relancé. Le worker appelle `distributeSignal` qui :
1. Vérifie le statut (PUBLISHED OK)
2. Re-crée les notifications
3. Re-envoie les emails, pushes, Telegram, WhatsApp

Il n'y a pas de garde-fou (vérification "cette notification a-t-elle déjà été créée pour ce signal/membre ?").

**Impact** : Les membres reçoivent des doublons.

**Gravité** : Élevée

**Correction** : Ajouter un cache Redis ou une vérification `prisma.notification.findFirst({ where: { userId, data: { path: ["signalId"], equals: signalId } } })` avant de recréer.

---

### Constat 15 : Aucune gestion de timeout — une distribution lente bloque le worker

`distributeSignal` n'a pas de timeout. Si un envoi email ou push prend trop de temps, le worker BullMQ reste bloqué au-delà du visibility timeout, et le job est relancé (voir Constat 14).

**Impact** : Distribution infinie en boucle.

**Gravité** : Élevée

**Correction** : Ajouter `Promise.race` avec un timeout de 30s par batch, ou configurer le worker BullMQ avec `lockDuration`.

---

### Constat 16 : Aucun mécanisme de throttling pour les canaux externes

Telegram, WhatsApp, et push sont envoyés en parallèle via `Promise.all`. Aucun rate limiting. Telegram bloque après 30 messages/s, WhatsApp après 250 req/min.

**Impact** : Blocage IP par les providers externes pour un signal destiné à 5000 membres.

**Gravité** : Élevée

**Correction** : Ajouter un throttling (max 20 requêtes/s pour Telegram, 50 pour WhatsApp) avec un délai progressif.

---

### Constat 17 : Le `readImageAsDataUri` lit le filesystem de façon synchrone dans une boucle

Pour chaque membre (batch de 50), `readImageAsDataUri` est appelé. Il utilise `readFile` (asynchrone, OK), mais à chaque itération il ouvre et lit le fichier image depuis le disque. Si le signal a 3 images et 5000 membres, le fichier est lu 5000×.

**Impact** : IO disque massif, contention de lecture, ralentissement de la distribution.

**Gravité** : Moyenne

**Correction** : Mettre en cache `readImageAsDataUri` avec un Map (clef = path, valeur = Promise<string|null>) et lire une seule fois par signal.

---

# PHASE 5 — AUDIT DES RÈGLES MÉTIER

### Constat 18 : Peut-on créer un trade sans session ? ✅ OUI

C'est correct. Un trade peut être enregistré sans session active.

### Constat 19 : Peut-on modifier un trade après création ? ⚠️ OUI, mais sans traçabilité

La route PUT existe mais ne crée pas de version (contrairement au signal). Aucun historique des modifications du trade. Si un trader modifie le résultat de WIN à LOSS 3 jours après, l'audit trail est perdu.

**Impact** : Fraude possible. Impossible de prouver qu'un trade a été modifié.

**Gravité** : Élevée

**Correction** : Ajouter un modèle `TradeHistory` (comme `SignalVersion`) ou logger un audit event à chaque modification avec avant/après.

---

### Constat 20 : Peut-on supprimer un trade lié à un rapport hebdo ? ✅ OUI (soft delete)

Le soft delete est correct. Mais aucune vérification que le trade supprimé n'est pas déjà inclus dans un rapport hebdomadaire déjà envoyé. Les stats hebdo peuvent être basées sur des trades supprimés après envoi.

**Impact** : Incohérence entre le rapport et les données actuelles.

**Gravité** : Faible

**Correction** : Pas bloquant. Le soft delete permet de garder l'historique.

---

### Constat 21 : Aucune règle de cohérence temporelle

`entryPrice` peut être > `exitPrice` pour un BUY (perte). C'est acceptable. Mais `entryPrice` peut être = `exitPrice` avec `result: WIN`. Un trade WIN avec entry=exit=1.08500 n'a aucun sens.

**Impact** : Données incohérentes. Les stats deviennent fausses.

**Gravité** : Moyenne

**Correction** : Ajouter une validation : si `result === WIN` en BUY, alors `exitPrice > entryPrice`. Si `result === LOSS` en BUY, alors `exitPrice < entryPrice`.

---

### Constat 22 : Peut-on créer un trade dans le futur ? ✅ OUI

`tradedAt` est validé comme datetime mais pas de vérification "pas dans le futur". Un trade peut avoir `tradedAt: 2099-01-01`.

**Impact** : Les stats et graphiques peuvent être faussés par des dates futures.

**Gravité** : Faible

**Correction** : Ajouter une validation Zod `refine` pour limiter `tradedAt` à `now() + 1min` (tolérance pour le décalage horaire).

---

# PHASE 6 — AUDIT DES TRANSACTIONS PRISMA

### Constat 23 : Aucune transaction dans les opérations critiques du journal

Le `POST /trades` dans `route.ts` :
1. Crée le trade
2. Rattache à une session active (UPDATE séparé)
3. Met à jour les streaks
4. Appelle `checkPsychology`

C'est 3 opérations DB + 1 appel externe. Aucune transaction. Si l'étape 2 échoue, le trade existe sans session. Si l'étape 3 échoue, le streak est incorrect.

**Impact** : Incohérence streak/trade possible.

**Gravité** : Élevée

**Correction** : Wrapper les opérations 1-2-3 dans `prisma.$transaction`.

---

### Constat 24 : La mise à jour de streak n'est pas dans la même transaction que la création du trade

`updateStreak` est appelé après `prisma.trade.create`. Si la création réussit mais que `updateStreak` échoue, le streak n'est pas mis à jour.

**Impact** : Streak incorrect. L'utilisateur voit "Loss streak: 0" après 5 pertes.

**Gravité** : Élevée

**Correction** : Inclure `updateStreak` dans la transaction de création de trade.

---

### Constat 25 : La route `POST /sessions/[id]/close` lit les trades après la mise à jour sans transaction

Elle lit `ses.trades` (qui ont été attachés avant la fermeture, donc correct), mais il n'y a pas de lock. Un trade pourrait être ajouté entre la lecture et l'update.

**Impact** : Le résumé de la session peut manquer un trade.

**Gravité** : Faible

**Correction** : Utiliser une transaction avec `$transaction([update, ...])` pour garantir l'atomicité.

---

# PHASE 7 — AUDIT DES API

### Constat 26 : La route `POST /sessions` retourne la session existante si déjà active — mais sans code clair

```ts
const existing = await prisma.journalSession.findFirst(...)
if (existing) return NextResponse.json({ session: existing })
```

Le comportement est "si t'as déjà une session active, on te la retourne". Mais le code d'état est 200, pas 200. Un nouveau client ne saura pas si sa session a été créée ou non.

**Impact** : Confusion. Aucune indication pour l'UI.

**Gravité** : Faible

**Correction** : Retourner 200 avec un flag `created: false` ou utiliser 303 (See Other).

---

### Constat 27 : Pas de rate limiting sur les routes de création

`POST /trades`, `POST /sessions`, `POST /reflections` peuvent être appelées sans limite. Un utilisateur peut créer 10k trades en 1 minute.

**Impact** : Pollue les données. Peut saturer la DB. Rend les stats inutiles.

**Gravité** : Élevée

**Correction** : Ajouter rate limiting (30 req/min pour trades, 10 req/min pour réflexions).

---

### Constat 28 : Pas de pagination pour `GET /reflections`

La route retourne jusqu'à 90 réflexions sans pagination. L'utilisateur ne peut pas charger plus.

**Impact** : Un trader avec 2 ans de réflexions ne voit que les 90 plus récentes, sans possibilité de charger plus.

**Gravité** : Faible

**Correction** : Ajouter pagination (comme pour les trades).

---

### Constat 29 : `POST /trades` ne retourne pas le trade complet avec relations

Le trade est retourné sans le signal associé, sans les tags, sans le sessionId. L'UI doit rafraîchir toute la liste pour voir le résultat.

**Impact** : Mauvaise UX — pas d'affichage immédiat du trade créé.

**Gravité** : Faible

**Correction** : Retourner le trade avec `include: { signal: { select: ... } }`.

---

# PHASE 8 — AUDIT DES PERFORMANCES

### Constat 30 : `GET /signals` pour les membres utilise un OR qui peut être lent

```ts
where: {
  status: "PUBLISHED",
  deletedAt: null,
  audience: { some: { planId: { in: activePlanIds } } },
}
```

Pour un membre avec 5 plans actifs et 1000 signaux publiés, Prisma génère un SQL avec `IN` sur la sous-requête `audience`. Sans index sur `SignalAudience(planId)`, c'est un scan complet.

**Impact** : Ralentissement de la page signaux pour les membres avec beaucoup de plans.

**Gravité** : Moyenne

**Correction** : Vérifier l'existence de l'index `@@index([planId])` sur `SignalAudience`.

---

### Constat 31 : `getSignalDelivery` charge TOUTES les notifications pour trouver les IDs

```ts
const notificationIds = (await prisma.notification.findMany({
  where: { data: { path: ["signalId"], equals: id } },
  select: { id: true },
})).map((n) => n.id)
```

Cette requête scanne toutes les notifications dont le JSON `data.signalId` correspond. C'est un scan partiel de la table `Notification`. Pour un signal avec 5000 destinataires, c'est 5000 lignes chargées en mémoire.

**Impact** : Delivery dashboard lent.

**Gravité** : Élevée

**Correction** : Ajouter `notificationIds` comme champ sur le Signal (dénormalisé) ou utiliser une table de jonction `SignalNotification`.

---

### Constat 32 : N+1 caché dans getSignals API pour les membres

`getSignalsApi` appelle `getSignalsApi()` qui ne fait que `findMany` avec `include: { creator: ... }`. Mais les composants clients qui affichent la liste doivent ensuite faire des appels séparés pour `favorite`, `archive`, et `read` status.

**Impact** : Chaque carte signal provoque des requêtes supplémentaires côté client.

**Gravité** : Moyenne

**Correction** : Enrichir le retour API avec les statuts `isFavorited`, `isArchived`, `isRead` en une seule requête.

---

# PHASE 9 — AUDIT DE LA BASE DE DONNÉES

### Constat 33 : Pas de contrainte de clé étrangère sur `Signal.createdBy`

La relation `createdBy String @map("created_by") @db.Uuid` a un `@relation` mais pas de `onDelete` défini. Si un utilisateur admin est supprimé, ses signaux deviennent orphelins ou la suppression échoue.

**Impact** : Erreur de suppression utilisateur ou signaux orphelins.

**Gravité** : Moyenne

**Correction** : Ajouter `onDelete: Restrict` ou `SetNull` explicitement.

---

### Constat 34 : `Signal.imageUrls` est un Json brut sans typage

Le champ `imageUrls` défini comme `Json @default([])` n'a pas de validation de type Prisma. N'importe quel JSON peut y être stocké. Si un bug écrit `{ url: "..." }` au lieu de `["..."]`, les appels `map()` dans le frontend crashent.

**Impact** : Crash de l'UI si le format Json est incorrect.

**Gravité** : Élevée

**Correction** : Utiliser `String[] @default([])` au lieu de `Json` maintenant que Prisma supporte les arrays natifs (PostgreSQL).

---

### Constat 35 : `Role.name` est utilisé comme identifiant logique sans relation

```ts
isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"
```

Le nom du rôle est comparé comme une string magique. Si le nom change en base (ex: "SUPER_ADMIN" → "SUPER-ADMIN"), toute la logique d'authorisation casse.

**Impact** : Fragile. Une modification en base peut désactiver toutes les vérifications admin.

**Gravité** : Élevée

**Correction** : Utiliser un champ `slug` unique et immuable sur le modèle Role, ou un enum.

---

# PHASE 10 — AUDIT DE LA QUALITÉ DU CODE

### Constat 36 : `any` utilisé massivement dans `update-signal.ts`

```ts
const updateData: Record<string, unknown> = { ... }
// Puis plus tard :
data: updateData, // casté implicitement en Prisma.SignalUpdateInput
```

L'utilisation de `Record<string, unknown>` contourne le typage strict de Prisma. Toute erreur de frappe dans une clef (`pubishedAt` au lieu de `publishedAt`) passe silencieusement.

**Impact** : Bug silencieux de mise à jour.

**Gravité** : Élevée

**Correction** : Typer `updateData` comme `Prisma.SignalUpdateInput` et utiliser l'objet directement.

---

### Constat 37 : `catch(() => {})` — échecs silencieux dans toute la base

```ts
checkPsychology(session.user.id).catch(() => {})
sendTelegramToMember(...).catch(() => {})
// etc.
```

Près de 20 `catch(() => {})` ou `.catch(() => null)` dans le code. Les erreurs sont avalées sans logging. En production, personne ne saura que les alertes psychologiques ou les notifications Telegram ne fonctionnent pas.

**Impact** : Cécité opérationnelle totale sur les échecs.

**Gravité** : Critique

**Correction** : Chaque `.catch()` doit au minimum logger l'erreur : `.catch((err) => console.error("[X]", err))`.

---

### Constat 38 : `getSignals` pour admin et membre dans le même fichier avec logique dupliquée

La fonction `getSignals()` gère à la fois la vue admin et la vue membre, avec deux chemins distincts (l.29-78 vs l.81-117). La logique admin est imbriquée dans la fonction, rendant le code difficile à tester et à maintenir.

**Impact** : Duplication de la logique de pagination, de filtrage, et de formatage.

**Gravité** : Moyenne

**Correction** : Séparer en `getSignalsAdmin()` et `getSignalsMember()`.

---

### Constat 39 : Le service `pnl.ts` créé lors du correctif précédent n'est pas utilisé dans tous les chemins

Le nouveau `calculatePnl` est utilisé dans `POST /trades` et `PUT /trades/[id]`, mais pas dans le weekly report script (`journal-weekly-report.ts`) qui recalcule le PnL manuellement avec la formule erronée.

**Impact** : Le rapport hebdo utilise toujours l'ancienne formule.

**Gravité** : Élevée

**Correction** : Réutiliser `calculatePnl` dans `journal-weekly-report.ts`.

---

# PHASE 11 — AUDIT DES TESTS

### Constat 40 : Zéro test pour le journal de trading

Les tests suivants sont **absents** :

| Fonctionnalité | Tests manquants |
|---|---|
| POST /trades | Validation, PnL, session attach, streaks, permissions |
| PUT /trades/[id] | Recalcul PnL, permissions, cohérence |
| DELETE /trades/[id] | Soft delete, permissions |
| POST /sessions | Création, doublon, fermeture |
| POST /reflections | Upsert, recalcul conditionnel |
| GET /stats | Filtres période, calcul winRate, best/worst |
| GET /stats-by-signal | Agrégation, N+1 |
| checkPsychology | Toutes les règles, cooldown, notify() |
| calculatePnl | Tous les instruments, cas limites |
| TradeCard | Affichage, suppression |
| TradeForm | Validation, soumission |
| StatsDashboard | Rendu, filtres période |
| ReflectionsTab | Historique, sauvegarde |
| SessionBanner | Start, stop, timer |
| journal-weekly-report | Calcul stats, envoi email |

**Impact** : Aucune confiance dans les calculs et les workflows. Impossible de refactorer sans risque.

**Gravité** : Critique

**Correction** : Écrire des tests pour tous les services critiques. Priorité : `calculatePnl`, `checkPsychology`, `POST /trades`, stats.

---

### Constat 41 : Tests existants pour le signal mais couverture incomplète

`signal-distribution.test.ts` (188 lignes) teste la distribution mais ne couvre pas :
- Échec de BullMQ (queueFailed = true)
- Distribution partielle (50 membres dans un batch réussi, 50 autres échouent)
- Image cache
- Notification existante (double distribution)
- Auto-publish avec scheduledAt passé

**Impact** : Les scénarios d'échec ne sont pas testés.

**Gravité** : Moyenne

**Correction** : Ajouter les tests d'échec.

---

# PHASE 12 — AUDIT DE L'ÉVOLUTIVITÉ

### Constat 42 : Pas de support pour l'IA Coach

Pour intégrer un AI Coach, le moteur aurait besoin de :
- Analyser les patterns de trades par utilisateur
- Suggérer des améliorations personnalisées
- Détecter les écarts par rapport au plan

**Problème** : Les données sont là (trades, réflexions, psychologie) mais pas de pipeline ML, pas de vectorisation des notes, pas de stockage des embeddings.

**Blocage** : Moyen. Ajout de la couche ML sans refonte.

---

### Constat 43 : Pas de support pour l'import MT4/MT5/TradingView

Pour importer automatiquement les trades, le moteur devrait supporter :
- Import CSV avec mapping de colonnes
- Connexion API MT4/MT5 via un bridge
- Webhook TradingView

**Problème** : Actuellement tout est saisi manuellement. Aucune infrastructure d'import.

**Blocage** : Élevé. Refonte nécessaire de la couche d'ingestion de données.

---

### Constat 44 : Pas de support multi-devise

Le modèle Trade ne stocke pas la devise (`EUR`, `USD`, `GBP`). Le PnL est affiché en `€` en dur dans le UI. Impossible pour un trader utilisant un compte USD.

**Blocage** : Faible. Ajouter un champ `currency` avec défaut `EUR`.

---

### Constat 45 : Pas de support Crypto avancé

Les trades crypto existent mais pas de support pour :
- Futures (contrats perpétuels, funding rate)
- Options (strike, expiration, premium)
- Staking/Rewards

**Blocage** : Moyen. Le modèle Trade serait suffisant avec des extensions.

---

### Constat 46 : Pas de capture d'écran ni journal vocal

Pas de stockage d'images de trades (screenshot du terminal), pas de notes vocales. Le champ `imageUrl` sur Trade n'existe pas.

**Blocage** : Faible. Ajout simple : `screenshotUrl: String?` sur Trade.

---

# PLAN D'ACTION

## Bugs critiques (P0 — Bloquant)

| # | Problème | Gravité | Correctif |
|---|---|---|---|
| C12 | Création signal sans transaction | Critique | Wrapper dans `$transaction()` |
| C13 | Update signal sans transaction | Critique | Wrapper dans `$transaction()` |
| C07 | Aucun calcul financier | Critique | Ajouter SL/TP suggéré au modèle Signal |
| C37 | `catch(() => {})` silencieux | Critique | Logger toutes les erreurs |

## Bugs haute priorité (P1 — À corriger avant MEP)

| # | Problème | Gravité | Correctif |
|---|---|---|---|
| C01 | `currentVersion` incrémenté sans changement | Élevée | N'incrémenter que si contenu changé |
| C05 | Index manquant NotificationDelivery | Élevée | Ajouter index composite |
| C09 | `imageUrl` non validé | Élevée | Appliquer safePath |
| C10 | `scheduledAt` non validé | Élevée | Ajouter validation datetime |
| C14 | Double distribution possible | Élevée | Vérifier notification existante |
| C15 | Timeout distribution | Élevée | Promise.race 30s |
| C16 | Throttling canaux externes | Élevée | Limiter à 20 req/s |
| C19 | Pas d'historique modification trade | Élevée | Ajouter TradeHistory |
| C23 | Transaction manquante POST /trades | Élevée | Wrapper dans transaction |
| C24 | Streak hors transaction | Élevée | Inclure dans la transaction |
| C27 | Rate limiting absent | Élevée | Ajouter 30 req/min |
| C31 | Delivery report lent | Élevée | Dénormaliser notificationIds |
| C34 | ImageUrls Json non typé | Élevée | Migrer vers String[] |
| C35 | Role.name comme identifiant | Élevée | Utiliser slug |
| C36 | Record<string, unknown> | Élevée | Typer avec Prisma.SignalUpdateInput |
| C39 | PnL non mis à jour dans rapport hebdo | Élevée | Utiliser calculatePnl |

## Quick Wins (P2 — < 1h)

| # | Problème | Correctif |
|---|---|---|
| C17 | Cache image distribution | Map<path, Promise> |
| C29 | Trade sans relations dans POST | Ajouter include |
| C28 | Pagination réflexions | Ajouter skip/take |
| C30 | Index SignalAudience.planId | Ajouter index |
| C38 | Séparer getSignals admin/membre | Refactor en 2 fonctions |
| C32 | N+1 statuts favoris/archives | Enrichir avec sous-requêtes |

---

# SCORE DÉTAILLÉ

| Critère | Note | Justification |
|---|---|---|
| **Architecture** (6/10) | Architecture en couches claire (routes → services → DB), worker BullMQ, WebSocket temps réel. Mais transactions absentes, Record<string, unknown>, pas de timeout, pas de retry explicite. | Correct |
| **Métier** (5/10) | Le moteur couvre le cycle de vie du signal (création → publication → distribution → tracking). Mais pas de SL/TP suggéré, pas de confiance, pas de risque. Pas de calculs financiers dans le moteur. | Correct |
| **Calculs** (4/10) | Aucun calcul financier réel. PnL erroné (facteur 100k) dans le journal. R:R calculé avec formule arbitraire. Rapport hebdo utilise encore l'ancienne formule. | Prototype |
| **Performance** (5/10) | Index manquants, N+1 dans le delivery report, cache image absent, pas de pagination réflexions. Mais distribution batchée, worker dédié, pagination trades OK. | Correct |
| **Sécurité** (6/10) | Auth vérifiée, permissions, CSRF, validation Zod. Mais pas de rate limiting, path traversal possible, catch silencieux. | Correct |
| **Prisma** (5/10) | Modèle complet, soft delete. Mais transactions absentes, Json non typé, index manquants, pas de contrainte onDelete. | Correct |
| **API** (7/10) | Routes RESTful, validation Zod, codes HTTP corrects, auth sur chaque route. Mais pas de versionning, pas de documentation, payloads incomplets. | Correct |
| **Qualité du Code** (5/10) | Architecture modulaire (modules/signals), clean folder structure. Mais any, record, catch(() => {}), logs console, pas de typage strict. | Correct |
| **Scalabilité** (4/10) | BullMQ ready, worker séparé. Mais pas de multi-broker, pas d'import auto, pas d'IA, pas de multi-devise. Distribution monolithique sans throttling. | Prototype |
| **Production** (5/10) | Tests partiels (signal distribution uniquement), pas de monitoring, pas de métriques d'erreur. Catch silencieux → cécité opérationnelle. | Correct |

---

# CLASSEMENT FINAL

| Seuil | Score | Statut |
|---|---|---|
| 🔴 NO GO | 0-35 | |
| 🟠 GO AVEC RÉSERVES | 36-60 | **52/100 ←** |
| 🟢 GO | 61-85 | |
| 🏆 WORLD CLASS | 86-100 | |

---

## DÉCISION : 🟠 GO AVEC RÉSERVES

Le moteur peut être mis en production **SI ET SEULEMENT SI** les 4 bugs critiques (P0) et les 12 bugs haute priorité (P1) sont corrigés avant le déploiement.

**Passer en 🟢 GO nécessite :**
- ✅ Transactions Prisma sur toutes les opérations critiques
- ✅ Logging des erreurs (supprimer `catch(() => {})`)
- ✅ Rate limiting sur les routes de création
- ✅ SL/TP suggéré dans le modèle Signal
- ✅ Validation de scheduledAt et imageUrl
- ✅ Index manquants sur NotificationDelivery et SignalAudience
- ✅ Tests pour le journal (calculatePnl, checkPsychology, API trades)
- ✅ Réutilisation de calculatePnl dans le rapport hebdo

**Passer en 🏆 WORLD CLASS nécessite en plus :**
- Import MT4/MT5/TradingView
- Multi-compte et multi-devise
- IA Coach avec analyse prédictive
- Capture d'écran et journal vocal
- Métriques avancées (Sharpe, Sortino, drawdown)
- Dashboard de monitoring des erreurs temps réel

---

*Audit réalisé le 19 juillet 2026 — Principal Software Architect, Quant Developer, Trading System Engineer, Prisma Expert, QA Lead.*

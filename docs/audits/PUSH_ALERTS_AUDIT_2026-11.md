# Audit approfondi — Alertes push, sonnerie et vibration des signaux

> **Objectif métier** : quand un signal est publié, chaque abonné reçoit **immédiatement** une alerte sur son téléphone, **avec la sonnerie par défaut du téléphone et/ou la vibration**, même écran verrouillé, pour se connecter vite et prendre le signal.
> **Constat de départ** : « ça ne marchait pas très bien », sans savoir si le problème vient de la PWA, du navigateur ou du code.
> **Méthode** : lecture de toute la chaîne (publication → file BullMQ → worker → `web-push` → service worker → affichage), exécution de tests (en-têtes réellement envoyés, service worker rejoué dans un bac à sable), relecture des écrans d'activation.
> **Limite assumée** : je n'ai **pas accès à vos appareils ni à votre production**. Chaque constat est étiqueté : 🧪 **testé** · 📄 **prouvé par le code** · 📘 **règle de plateforme** (à valider sur vos téléphones). La §8 donne les requêtes à lancer en production pour confirmer.

---

## 1. Verdict en 30 secondes

**Ce n'est pas « parce que c'est une PWA ». Il y a 6 défauts cumulés dans votre code, plus une limite de plateforme que l'application n'explique pas.**

| # | Cause | Preuve | Gravité |
|---|---|---|---|
| 1 | L'interface affiche « Notifications autorisées ✅ » et un test « réussi » **sans jamais vérifier qu'un abonnement push existe**. Le bouton « Autoriser » de la page Notifications accorde la permission mais **ne crée aucun abonnement**. | 📄 | 🔴 |
| 2 | Sur **iPhone ouvert dans Safari** (pas installé), le bouton d'activation **disparaît sans aucun message**. | 📄 | 🔴 |
| 3 | La permission est demandée **après** deux `await` (enregistrement du SW + `ready`). Sur iOS/Safari elle doit être demandée **directement dans le geste** de l'utilisateur. | 📄 📘 | 🔴 |
| 4 | Les push sont envoyés sans `Urgency` ni `TTL` : **urgence « normale » et TTL = 28 jours**. Android en veille profonde (Doze) les retarde ; un téléphone éteint reçoit d'un coup tous les anciens signaux périmés. | 🧪 | 🔴 |
| 5 | Le serveur **supprime des abonnements** (erreurs 400/403/404/410/413, ou 3 erreurs 5xx en 1 h) **sans que l'appareil le sache**, et rien ne ré-abonne : l'appareil affiche « actif », le serveur n'a plus rien. | 📄 | 🔴 |
| 6 | Le suivi marque la livraison **« SENT »** même quand **personne n'est abonné** ou que les clés VAPID manquent : impossible de voir le problème côté admin. | 📄 | 🟠 |
| 7 | **Limite de plateforme** : un site web **ne peut pas** choisir le son d'une notification push. Les 17 sons du catalogue ne jouent que **page ouverte**. L'utilisateur choisit « Urgente » et s'attend à l'entendre écran verrouillé : c'est impossible en PWA. | 📘 📄 | 🔴 (attentes) |

**Bonne nouvelle** : votre objectif exact (« sonnerie par défaut du téléphone **ou** vibreur selon les réglages ») est **précisément ce que le Web Push sait faire**. Il suffit de fiabiliser la chaîne et de supprimer l'ambiguïté sur les sons personnalisés.

---

## 2. Ce que le Web Push peut et ne peut pas faire (le point que personne ne vous a expliqué)

| | Android (Chrome / PWA installée) | iPhone / iPad (PWA installée, iOS ≥ 16.4) | iPhone dans Safari (onglet) | Ordinateur (Chrome, Edge, Firefox) |
|---|---|---|---|---|
| Web Push possible | ✅ | ✅ **uniquement** si l'app est **ajoutée à l'écran d'accueil** | ❌ **jamais** | ✅ |
| Son à la réception | ✅ **son par défaut du canal de notification** du téléphone | ✅ son par défaut iOS | — | ✅ son système |
| **Son personnalisé** choisi par le site | ❌ | ❌ | — | ❌ |
| Vibration | ✅ selon canal + réglages du téléphone | ❌ (l'option `vibrate` est ignorée ; vibration iOS = réglages système) | — | — |
| Notification écran verrouillé | ✅ | ✅ | — | selon l'OS |
| Bloquée par | Mode Ne pas déranger, canal réglé sur « Silencieux », économiseur de batterie agressif (Xiaomi, Huawei, Oppo…), Android **sans Google Play Services** | Commutateur sonnerie, **modes Concentration**, Ne pas déranger | — | Mode silencieux de l'OS |
| Demande de permission | depuis un geste de l'utilisateur | **doit** être **directement** dans le geste | — | depuis un geste |

📘 Conséquences directes :
1. **« Sonnerie par défaut ou vibreur selon le téléphone »** = ce que vous pouvez garantir. C'est un bon objectif, réaliste.
2. **« Choisir sa sonnerie »** n'est possible ni en PWA ni en site web. Seules deux voies existent : une **application native** (§5, couche 3) ou un **canal tiers** comme Telegram, où chacun règle le son de son canal.
3. Sur **iPhone**, tant que l'app n'est pas **installée sur l'écran d'accueil**, le push n'existe pas. Aucun code ne peut contourner cette règle d'Apple, seulement **guider** l'utilisateur.

---

## 3. Constats détaillés

### 🔴 P1 — L'interface dit « OK » sans vérifier l'abonnement ; le test n'est pas un vrai test 📄
- `src/app/(dashboard)/dashboard/notifications/page.tsx:322-330` : la carte verte **« Notifications autorisées »** se base **uniquement** sur `Notification.permission`.
- `…/notifications/page.tsx:168-177` (`requestPerm`) : appelle `Notification.requestPermission()` **et s'arrête**. Pas de `pushManager.subscribe`, pas d'appel à `/api/push/subscribe`. Un membre qui clique ici obtient la permission mais **n'est pas abonné côté serveur**.
- `…/notifications/page.tsx:179-201` (`testNotification`) : joue un son Howler puis `new Notification(...)`. Ce n'est **ni le service worker, ni le serveur, ni VAPID, ni la file** : le test peut « marcher » alors qu'aucun vrai signal n'arrivera jamais. Pire, `new Notification()` est **interdit sur Android Chrome** (il faut `registration.showNotification`) : l'exception est avalée par un `catch {}` silencieux.
- `src/lib/messaging-unread.tsx:115` utilise aussi `new Notification()` : même limite, uniquement page ouverte.
- Il existe **trois** boutons d'activation (carte du tableau de bord, bascule du menu mobile, page Notifications) qui **ne font pas la même chose**.

### 🔴 P2 — iPhone/Safari : le bouton disparaît sans explication 📄 📘
- `src/components/push-notification-toggle.tsx:29,142` et `push-notification-prompt.tsx:29` : si `"PushManager" in window` est faux (cas de **tous les iPhones hors PWA installée**), le composant **ne s'affiche pas du tout**.
- Aucune détection « iOS non installé », aucun guide « Partager → Sur l'écran d'accueil ». L'utilisateur ne sait même pas qu'une fonction existe.
- Rien ne détecte non plus le mode `standalone` (PWA ouverte depuis l'icône).

### 🔴 P3 — Permission demandée trop tard dans le geste 📄 📘
- `push-notification-prompt.tsx:52-55` et `push-notification-toggle.tsx:61-65` : `await register()` → `await ready` → **puis** `Notification.requestPermission()`.
- Apple exige que `requestPermission()` soit appelée **directement** depuis un geste. Après des `await`, le « jeton de geste » peut être perdu : la demande échoue ou est refusée automatiquement, ce qui ressemble à « **ça refuse** » (votre observation).
- Correctif : **demander la permission en premier**, de façon synchrone dans le clic, puis enregistrer le SW et s'abonner.

### 🔴 P4 — Envoi sans `Urgency` ni `TTL` 🧪
Test exécuté sur la bibliothèque `web-push` avec l'appel actuel (`src/lib/services/push.ts:92`, aucune option) :

```
Code actuel (aucune option)        TTL= 2419200 | Urgency= normal
Proposé : urgency high + TTL 15 min TTL= 900     | Urgency= high
```
- **Urgency normale** : sur Android, un téléphone en veille profonde peut recevoir le message **avec des minutes de retard**. Pour un signal de trading, c'est inacceptable. `high` demande la livraison immédiate.
- **TTL 28 jours** : un téléphone éteint ou hors réseau 3 heures **reçoit tous les signaux manqués d'un coup, une fois le réseau revenu**, comme s'ils étaient frais, avec le son. Un signal périmé peut pousser un trade perdant. Il faut un TTL court (10 à 15 minutes) : au-delà, la notification est **jetée**, et le signal reste lisible dans l'app et dans l'e-mail.

### 🔴 P5 — Abonnements supprimés en silence, jamais restaurés 📄
- `src/lib/services/push.ts:63` : suppression sur `400, 403, 404, 410, 413`.
- `push.ts:107-120` : suppression aussi après **3 erreurs 5xx/réseau en 1 h** (une panne passagère du service push suffit à « désabonner » un client).
- Côté appareil, `getSubscription()` renvoie encore un abonnement : le bouton affiche **« Notifications actives »** (`push-notification-toggle.tsx:34-48`) alors que la base n'a plus rien.
- Il manque : (a) un gestionnaire **`pushsubscriptionchange`** dans `public/sw.js` (le navigateur renouvelle parfois l'abonnement), (b) une **resynchronisation** à chaque ouverture de l'app (« mon abonnement local existe-t-il côté serveur ? sinon le renvoyer »).
- Si les clés VAPID changent un jour, tous les abonnés reçoivent 401/403, sont supprimés, et n'en sauront rien.

### 🟠 P6 — Statuts de livraison faux 📄
- `src/lib/services/push.ts:68,72,79` : sans clés VAPID, pour un utilisateur inactif, ou sans abonnement, `sendPushToUser` renvoie `{ sent: 0, failed: 0 }`.
- `workers/queue.ts:266` : `if (result.sent > 0 || result.failed === 0)` ⇒ statut **SENT** dans ces deux cas.
- Résultat : le Tracker admin peut afficher « push envoyés » alors qu'**aucun téléphone** n'a rien reçu. Il faut un statut distinct (`NO_SUBSCRIPTION`, `NOT_CONFIGURED`) et un indicateur « membres joignables en push ».

### 🟠 P7 — Le service worker peut ne rien afficher 🧪
Test dans un bac à sable (`public/sw.js` rejoué avec de faux événements) :

```
push JSON complet                    -> notifications affichées: 1
push SANS payload (event.data=null)  -> notifications affichées: 0   ← problème
push texte non-JSON                  -> notifications affichées: 1
```
- `public/sw.js:49` : `if (!event.data) return;`. Un push sans données n'affiche **rien**. Sur iOS, 📘 WebKit **révoque l'abonnement** après quelques push sans notification visible (règle `userVisibleOnly`). Chrome affiche une notification générique « le site a été mis à jour en arrière-plan ».
- À corriger : **toujours** appeler `showNotification`, avec un texte par défaut.

### 🟠 P8 — La notification n'aide pas à « prendre le signal vite » 📄
- `src/lib/services/signal-distribution.ts:233-234` : titre « Nouveau signal de trading », corps « Un nouveau signal a été publié pour vos groupes. », lien **`/dashboard`**.
- Le membre doit ouvrir l'app, trouver le signal, puis le lire. Mieux : **titre = action et paire** (« 🟢 BUY XAUUSD · 2385.50 »), **corps = niveaux** (« SL 2378 · TP 2392 »), **lien direct** `/dashboard/signals/<id>`, image du graphique si disponible.

### 🟠 P9 — Les 17 sons ne servent qu'à l'app ouverte, et l'interface ne le dit pas 📄
- `src/lib/hooks/use-notification-sound.ts` (Howler) : joue un `.wav` seulement quand la page est **ouverte, visible et déverrouillée** par un premier toucher.
- Le service worker ne contient **aucun code audio** et n'en peut pas avoir (aucune API).
- Écran verrouillé ou app fermée : **seul le son système** joue.
- Risque de **double son** quand l'app est ouverte (son Howler + son système).
- `public/sounds/` : 17 fichiers `.wav`, **3,4 Mo** (jusqu'à 580 Ko chacun) pour un catalogue qui n'est utilisable qu'en premier plan.

### 🟡 P10 — Heure de silence calculée à l'heure du serveur 📄
- `src/lib/services/notifications.ts:36-45` : `isInQuietHours` utilise `new Date().getHours()` **du serveur** (UTC en Docker), alors que le profil porte un fuseau (`User.timezone`, défaut `Europe/Paris`). Une plage 22 h–7 h est décalée de 1 à 2 h.
- La distribution des signaux (`signal-distribution.ts`) **ignore** ces heures : c'est un choix à assumer (un signal ne se met pas en pause), mais il doit être **écrit et expliqué** à l'utilisateur.

### 🟡 P11 — Détails d'affichage 📄
- `public/sw.js:55,80` : l'icône « badge » est l'icône **couleur** 192 px ; Android attend un pictogramme **monochrome transparent** (sinon un carré blanc apparaît dans la barre d'état).
- `manifest.webmanifest` : `"purpose": "any maskable"` combiné dans une seule entrée (à séparer), pas d'`id` stable.
- `requireInteraction: false` : sur ordinateur, la notification disparaît seule ; pour un signal, `true` peut convenir côté desktop.
- Aucune donnée de diagnostic sur `PushSubscription` (`prisma/schema.prisma:634`) : ni plateforme, ni dernière réussite, ni dernier échec, ni compteur d'erreurs.

---

## 4. Pourquoi ça « refusait » : scénarios probables

| Votre situation | Ce qui s'est probablement passé |
|---|---|
| **iPhone**, ouvert dans Safari | Aucune fonction push n'existe (P2). Rien ne s'affiche, rien n'est expliqué. |
| **iPhone**, PWA installée | Permission demandée trop tard dans le geste (P3) → refus automatique ; ou son coupé par commutateur/Concentration. |
| **Android**, notification reçue **sans son** | Canal de notification de l'app/du navigateur réglé sur « Silencieux », Ne pas déranger, ou son désactivé dans les réglages du canal. Le code demande `silent: false` : il ne peut pas forcer le téléphone. |
| **Android**, notification **en retard** | Urgence « normale » + veille profonde (P4). |
| **Tout va bien dans « Tester »** mais jamais de vrai signal | Test local sans rapport avec le vrai chemin (P1) + aucun abonnement serveur (P1, P5). |
| **Ça marchait puis plus rien** | Abonnement supprimé côté serveur (P5) sans resynchronisation. |

---

## 5. Architecture cible : trois couches

### Couche 1 — Alerte système fiable (priorité absolue, couvre 100 % de votre besoin actuel)
Web Push → **son et vibration par défaut du téléphone**.
- `Urgency: high`, `TTL` 10 à 15 min, `Topic` pour regrouper.
- Le service worker affiche **toujours** une notification.
- Contenu riche : paire, sens, niveaux ; lien direct vers le signal.
- Resynchronisation automatique de l'abonnement ; `pushsubscriptionchange`.

### Couche 2 — Son personnalisé quand l'app est ouverte
- Le service worker détecte une fenêtre visible et lui envoie un `postMessage` ; l'app joue le son choisi (Howler) et le service worker **n'affiche pas** de notification système (pas de double alerte).
- Si aucune fenêtre n'est visible : notification système (couche 1).
- L'interface **dit la vérité** : « Votre son s'applique quand l'app est ouverte. En arrière-plan, c'est la sonnerie de votre téléphone. »

### Couche 3 — Vraie sonnerie personnalisée (optionnelle, à décider)
Deux options réalistes :
1. **Application native** emballant la PWA (Capacitor) : canal Android `signaux` (importance haute, son maison) et notifications iOS avec son embarqué. Coût : 3 à 5 jours + comptes développeur + publication. Les « alertes critiques » iOS exigent un accord spécial d'Apple, et sont peu probables pour un service de signaux.
2. **Relais Telegram** en parallèle du push : chaque membre règle lui-même le son de sa conversation, c'est le standard du marché des signaux. **Vos membres sont déjà dans un groupe Telegram** (page Abonnement, `subscription/page.tsx:176`) : un bot qui relaie chaque signal au moment de la publication s'appuie sur l'existant. Coût : 1 à 2 jours. ⚠ Vérifier d'abord que les signaux ne sont pas **déjà** diffusés sur Telegram à la main : ce serait un doublon à fusionner.

### Catalogue audio recommandé
- **Réduire à 6 sons**, un par usage : `signal` (signature de marque, 1,5 à 2,5 s), `signal-urgent` (alerte critique), `message`, `redpill`, `confirmation`, `erreur`.
- **Formats** : `.ogg` (Opus) + `.mp3` de repli, mono, 44,1 kHz, **normalisés à −16 LUFS**, crête ≤ −1 dBTP, fondu final, **≤ 100 Ko** chacun (vs 360 à 580 Ko en `.wav` aujourd'hui, soit environ **10 fois plus léger**).
- Si la couche 3 native est retenue : Android `.ogg`/`.mp3` en `res/raw` ; iOS `.caf`/`.aiff`/`.wav` de **moins de 30 s**.
- Rendre le signal **reconnaissable sans regarder** : préfixe visuel (🟢 BUY / 🔴 SELL) et schéma de vibration **long-court-long** côté Android.

---

## 6. Autorisations : que faut-il demander à l'utilisateur ?

**Peut-on les demander nous-mêmes ?** Une seule : la **permission de notification**, au bon moment, dans un geste. Tout le reste est un réglage du téléphone qu'on ne peut que **guider**.

| Étape | Obligatoire ? | Qui la fait ? |
|---|---|---|
| Autoriser les notifications | ✅ | **L'application** la demande (1 clic) |
| iPhone : « Sur l'écran d'accueil » puis ouvrir depuis l'icône | ✅ (iOS uniquement) | L'utilisateur, **guidé pas à pas** |
| Android : batterie du navigateur / de l'app sur « Sans restriction » | recommandé (Xiaomi, Oppo, Huawei, Samsung agressif) | L'utilisateur, **guidé** |
| Android : régler le son/l'importance du canal de l'app | optionnel | L'utilisateur, **guidé** |
| Micro, localisation, arrière-plan… | ❌ **inutile** : ne rien demander de plus | — |

**Parcours sans frustration (principes)** :
1. **Ne jamais demander au premier chargement.** Proposer l'activation quand la valeur est comprise (après l'inscription terminée, ou à l'ouverture du 1ᵉʳ signal), avec une **pré-explication** « Recevez chaque signal en direct, avec sonnerie ».
2. **Un seul bouton, un seul parcours**, adapté à l'appareil détecté :
   - iPhone non installé → « Étape 1/2 : installez l'app » (illustration Partager → Sur l'écran d'accueil) ; à la réouverture en mode installé, l'étape 2 s'enchaîne automatiquement ;
   - Android / ordinateur / iPhone installé → 1 clic : permission **en premier**, puis abonnement, puis envoi enregistré.
3. **Vrai test immédiat** : un bouton « Envoyer une alerte de test » qui déclenche un **vrai push serveur** ; l'utilisateur répond « Reçue ✅ » ou « Rien reçu ». Si « Rien reçu » : assistant de dépannage (permission ? abonnement serveur ? commutateur sonnerie/Ne pas déranger ? batterie ?).
4. **État permanent et honnête** dans l'en-tête et la page Notifications : « 🔔 Alertes actives sur cet appareil » / « ⚠ Activez les alertes ». L'état vient de l'**abonnement serveur réel**, pas de la seule permission.
5. **Auto-réparation silencieuse** : si la permission est déjà accordée et que l'abonnement a disparu, **se réabonner sans rien demander**.
6. **Refus** : message clair avec les étapes **selon le navigateur**, bouton « J'ai changé le réglage » qui revérifie.
7. **Écran « Mes appareils d'alerte »** : liste des appareils abonnés, dernière réception, test, suppression.

---

## 7. Plan d'implémentation

| Lot | Contenu | Effort | Valeur |
|---|---|---|---|
| **1 — Fiabiliser l'envoi** (P4, P6, P7, P8) | `urgency: high` + `TTL` court + `Topic` ; statuts honnêtes (`NO_SUBSCRIPTION`) ; SW qui affiche toujours ; contenu riche + lien direct ; tests unitaires (SW + options web-push + statuts worker) | 1 jour | 🔴 immédiate |
| **2 — Parcours client unique** (P1, P2, P3, P5) | hook `usePushSubscription` (machine à états : non supporté / iOS à installer / à autoriser / refusé / abonné / à réparer) ; permission **d'abord** ; resynchronisation + `pushsubscriptionchange` ; remplacer les 3 boutons ; vrai push de test (`POST /api/push/test`) | 2 jours | 🔴 immédiate |
| **3 — Observabilité** | colonnes `PushSubscription` (plateforme, dernière réussite/échec, compteur) ; indicateur admin « membres joignables : X / Y » ; liste des membres non joignables | 1 jour | 🟠 |
| **4 — Audio** (P9) | catalogue de 6 sons `.ogg`/`.mp3` ; `postMessage` SW → app pour la sonnerie en premier plan sans double alerte ; textes honnêtes dans les préférences | 1 jour | 🟠 |
| **5 — Heures de silence** (P10) | calcul au fuseau de l'utilisateur ; règle explicite pour les signaux | ½ jour | 🟡 |
| **6 — Couche 3 (optionnelle)** | Telegram bot (1–2 j) **ou** emballage natif (3–5 j) | selon choix | 🟠 |
| **Tests sur appareils réels** | iPhone PWA, Android (Pixel, Samsung, Xiaomi), Chrome/Edge/Firefox/Safari bureau | ½ jour | 🔴 indispensable |

**Total lots 1 à 5 : environ 5 à 6 jours**, dont les 3 premiers jours règlent l'essentiel.

### Tests automatisés à ajouter
- Test du service worker en bac à sable (celui de cet audit) : push sans données **doit** afficher une notification.
- Test des options d'envoi : `Urgency: high`, `TTL` ≤ 900.
- Test du worker : pas d'abonné ⇒ statut ≠ `SENT`.
- Tests de la machine à états du hook (iOS non installé, permission refusée, abonnement perdu…).
- ⚠ Le navigateur sans interface (Playwright) **ne peut pas accorder** la permission de notification : le parcours complet se valide sur **appareils réels**.

---

## 8. Diagnostic de production (à lancer maintenant, 10 minutes)

```sql
-- Combien de membres sont réellement joignables en push ?
SELECT count(DISTINCT user_id) AS membres_abonnes, count(*) AS appareils FROM push_subscriptions;

-- Par type d'appareil (iPhone / Android / bureau)
SELECT left(user_agent, 70) AS appareil, count(*) FROM push_subscriptions GROUP BY 1 ORDER BY 2 DESC LIMIT 20;

-- Statuts d'envoi push des 7 derniers jours
SELECT status, count(*) FROM notification_deliveries
WHERE channel = 'PUSH' AND created_at > now() - interval '7 days' GROUP BY 1;

-- Membres avec accès (à comparer au premier chiffre)
SELECT count(*) FROM users WHERE is_active AND deleted_at IS NULL;
```

À vérifier aussi :
- Le conteneur **`worker`** a bien `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_SUBJECT` (le worker lit `.env`, mais confirmez la valeur réelle).
- La clé publique **compilée dans l'app** est la **même** que la clé privée du worker (sinon tous les envois sont refusés).
- Les journaux du worker : recherchez `Push send had failures` et `Clés VAPID non configurées`.

**Lecture rapide** : si le nombre de membres abonnés est très inférieur aux membres actifs, c'est le **parcours d'activation** (P1 à P3) ; si les abonnés sont nombreux mais que les alertes sont tardives ou muettes, ce sont **l'envoi** (P4) et les **réglages téléphone** (§2).

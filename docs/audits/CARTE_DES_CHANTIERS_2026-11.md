# Carte des chantiers — état réel au 11 nov. 2026

> **Pour qui ?** Tout agent ou contributeur qui doit choisir une issue sans contexte.
> **Base de vérification** : `main` @ `49f5f73` (11 nov. 2026). Chaque ligne a été **revérifiée contre le code**, pas copiée des audits.
> **Avant de coder** : relire `docs/05-development/AGENT_RUNBOOK.md`, faire `git fetch origin main`, revérifier que le défaut existe encore, commenter « Je prends ».
> **Tenir ce document à jour** : une PR qui change l'état, l'ordre ou une dépendance met cette carte à jour dans le même commit.

## 1. Trois familles d'issues

| Famille | Index | Origine | Contenu |
|---|---|---|---|
| UI/UX | **#318** | audit UI/UX (rapport `docs/audits/UI_UX_AUDIT_2026-11.md`) | UX-01 à UX-23 |
| Alertes push | **#363** | audit des alertes (rapport `docs/audits/PUSH_ALERTS_AUDIT_2026-11.md`) | PUSH-1 à PUSH-6 |
| Technique | **#362** | audit technique des 5 fonctionnalités (autre session) | TECH-01 à TECH-19 (#343 à #361) |

Les trois se **recoupent** (voir §4) : ne traitez jamais un sujet sans avoir regardé les issues sœurs.

## 2. État de chaque issue

Légende : 🟢 à faire (défaut confirmé) · 🟡 partiel · ✅ fait · ⛔ bloquée par une décision · ✂️ découpée en sous-issues.

### UI/UX (#318)
| # | Sujet | État | Détail vérifié | Dépend de | Taille |
|---|---|---|---|---|---|
| #319 | UX-01 tour de bienvenue | 🟢 | `welcome-guide.tsx` : 0 `setItem` | — | S |
| #320 | UX-02 onglet Revenus plante | 🟢 | `RevenueTab.tsx` passe `"F CFA"` à `Intl.NumberFormat` ; `seed.ts` crée `F CFA` | — | XS |
| #321 | UX-03 liens morts | 🟡 | Control Room **supprimée** (`5929bc1`, `6db40fd`) ; **reste** : onglet Modération sans rendu (`activeTab === "moderation"` absent de `admin/page.tsx`) | — | XS |
| #322 | UX-04 outils super-admin partout | 🟢 | `<AdminTools />` toujours dans `admin/page.tsx` | — | S |
| #323 | UX-05 vérification contradictoire | 🟢 | « Entièrement Validé » toujours à 100 % sur `ACTIVE` | — | S |
| #324 | UX-06 CSP | ✅ | `style-src 'self' 'unsafe-inline'` sans nonce, `strict-dynamic` retiré (`6db40fd`, déployé). Reste optionnel : repli « Hors ligne » de l'indicateur temps réel | — | — |
| #325 | UX-07 bottom-nav membre | 🟢 | `dashboardMobile` = **10** entrées | — | M |
| #326 | UX-08 navigation mobile admin | 🟢 | `mobile-page-title.tsx` : 4 routes codées en dur | #325 | S |
| #327 | UX-09 architecture admin | 🟡 | Formation et Control Room **supprimés** ; reste : tableau de bord enfoui, fil d'Ariane figé, écrans techniques ; **fusion Membres/Utilisateurs ⛔ D-2 #373** ; recouvre **#359** | #325, #326 | M |
| #328 | UX-10 icônes d'en-tête | 🟢 | recouvre **#359** (icônes dupliquées) | — | S |
| #329 | UX-11 enums bruts | 🟢 | « Evenements » toujours dans `FraudTab.tsx`/`security/fraud/page.tsx` ; enums affichés | — | M |
| #330 | UX-12 ton et vocabulaire | ✂️ | **Décision : vouvoiement** → **#375** (chaînes) et **#376** (vocabulaire) | #376 après #325/#326 | S+S |
| #331 | UX-13 monnaies et formats | 🟢 | `dashboard/page.tsx` : `€` en dur ; `lot-calculator.tsx` : `Solde ($)` | **#320** | S |
| #332 | UX-14 carte signal | ⛔ | structure du signal ⛔ **D-1 #372** (repli texte possible) | #372 | M |
| #333 | UX-15 couleurs | 🟢 | **263** occurrences `blue/purple/emerald/rose/pink-*` | à faire **en dernier** | M |
| #334 | UX-16 gabarits | ✂️ | **#377** (composants) → **#378** (membre), **#379** (admin) | #377 | M |
| #335 | UX-17 états vides/erreurs | 🟢 | — | — | M |
| #336 | UX-18 formulaires | 🟢 | calculateur : coordonner avec **#351/#352** | — | M |
| #337 | UX-19 accessibilité | ✂️ | **#380** contraste, **#381** 12 px, **#382** noms accessibles, **#383** zones tactiles, **#384** CI ; recouvre **#284/#285** | voir §3 | M |
| #338 | UX-20 `confirm()` natifs | 🟢 | **3 restants** : `trade-card.tsx:59`, `SmartSuggestions.tsx:116`, `admin/redpills/page.tsx:200` | — | S |
| #339 | UX-21 Demandes et Membres | 🟢 | `RequestsTab.tsx` inchangé | #329, #320 | M |
| #340 | UX-22 écrans techniques | 🟢 | Uptime « 0h » vs « 23 min » toujours dans `developer/console.tsx` | — | S |
| #341 | UX-23 tableau de bord membre | 🟢 | actions rapides en double | #332 | M |

### Alertes push (#363)
| # | Sujet | État | Détail vérifié | Dépend de | Taille |
|---|---|---|---|---|---|
| #364 | PUSH-1 fiabiliser l'envoi | 🟢 | `push.ts`, `sw.js`, `workers/queue.ts` **inchangés** : toujours sans `urgency`/`TTL`, push vide muet, faux `SENT`. **§4 (titre riche) ⛔ D-1 #372** : livrer §1-3 d'abord | — | M |
| #365 | PUSH-2 parcours d'activation | ✂️ | **#385** hook · **#386** API · **#387** SW · **#388** composant · **#389** pastille et appareils | #364 | L |
| #366 | PUSH-3 observabilité | 🟢 | `PushSubscription` sans colonnes de diagnostic | #364 (migration `DeliveryStatus`) | M |
| #367 | PUSH-4 audio | 🟢 | recouvre **#349** (état de son partagé, double son) et **#350** (promesse) ; le hook a eu 1 commit (AudioContext différé) | #364, **#349** | M |
| #368 | PUSH-5 heures de silence | ⛔ | règle ⛔ **D-3 #374** ; le fuseau serveur est un bug indépendant | — | S |
| #369 | PUSH-6 sonnerie personnalisée | ⛔ | décision Telegram ou natif | #364 à #367 | — |

### Décisions du propriétaire (aucun agent ne tranche)
| # | Question | Recommandation | Bloque |
|---|---|---|---|
| **#372 D-1** | Signaux : champs structurés ou texte libre ? (+ coller 10 signaux réels) | **C hybride** (coller → proposition → validation) | #332, #364 §4, #352, #357, #341 |
| **#373 D-2** | Fusionner Membres et Utilisateurs ? | **A** une seule page | partie fusion de #327/#359 |
| **#374 D-3** | Signaux et heures de silence ? | **C** choix par membre, signaux sonnent par défaut | #368 |
| **#369** | Telegram ou application native pour la sonnerie | Telegram d'abord | — |

## 3. Groupes de conflits : qui touche quoi

Deux issues d'un même groupe **ne se font pas en parallèle** par deux agents : respectez l'ordre (ou confiez-les au même agent).

| Groupe | Fichiers chauds | Ordre imposé |
|---|---|---|
| **Navigation** | `src/config/navigation.ts`, `mobile-bottom-nav.tsx`, `mobile-menu.tsx`, `sidebar.tsx`, `mobile-page-title.tsx` | #321 → #325 → #326 → #376 → #327 (sans fusion) + #359 → #328 |
| **Page admin** | `src/app/(admin)/admin/page.tsx` | #321 + #322 (même agent), puis #379 |
| **Service worker** | `public/sw.js` | **#364 → #387 → #367** (jamais en parallèle) |
| **Envoi push** | `src/lib/services/push.ts`, `workers/queue.ts`, `prisma/schema.prisma` | #364 → #366 → #386 |
| **Sons** | `src/lib/hooks/use-notification-sound.ts`, `notification-bell.tsx`, `signals-view.tsx` | **#349 → #367** |
| **Libellés/enums** | `src/lib/labels.ts` (à créer), panneaux admin | #329 → #339 ; #329 avant #376 |
| **Argent** | `src/lib/format/money.ts` (à créer) | **#320 → #331** |
| **Signal** | `signals-view.tsx`, `signal-parse.ts` (à créer), `signal-wizard/*` | décision **#372** → #332 → #341 ; #364 §4 |
| **Calculateur** | `src/components/lot-calculator.tsx`, `dashboard/lot` | #336 + **#351** + **#352** : même agent |
| **Notifications (page)** | `dashboard/notifications/page.tsx` | #335 et #349 avant #388 |
| **Tout le monde (en dernier)** | des centaines de lignes réparties | **#381 (12 px)** et **#333 (couleurs)** après le reste ; **#384 (CI axe)** après #380 et #382 |

## 4. Recoupements avec l'audit technique (#362)

| Mon issue | Issue sœur | Relation |
|---|---|---|
| #367 PUSH-4 | **#349** TECH-07 (sons : état partagé, double son, polling muet, repli) | **faire #349 d'abord** ; #367 s'appuie sur le hook réparé |
| #367 PUSH-4 | **#350** TECH-08 (promesse « sonnerie personnalisée ») | #367 la couvre (texte honnête) ; fermer #350 à la livraison |
| #327 UX-09, #328 UX-10 | **#359** TECH-17 (nav admin : icônes, libellés, vues d'ensemble) | **même chantier** : une seule PR de nav admin ferme les deux |
| #324 UX-06 | #361 TECH-19 (nonce `next-themes`) | CSP déjà corrigée ; #361 = test de non-régression |
| #336 UX-18 | **#351** TECH-09, **#352** TECH-10 (calculateur) | même agent |
| #332 UX-14, #341 | #357 TECH-15 (tracking trader) | partagent la décision D-1 |
| #326 UX-08 | #356 TECH-14 (tracker mobile) | coordonner sur l'en-tête mobile admin |
| #337 UX-19 | #284, #285 (anciennes issues contraste/clavier) | UX-19a/c les couvrent ; les lier |
| (tests) | #360 TECH-18 | les 3 tests de navigation sont **réparés** (PR #342) ; reste `middleware.test.ts` exclu de Vitest |

## 5. Vagues conseillées (agents en parallèle sans collision)

| Vague | Agents en parallèle | Contenu |
|---|---|---|
| **1 — correctifs indépendants** | A · B · C · D · E · F · G · H | **A** #320 → #331 · **B** #319 · **C** #323 · **D** #364 (§1-3) → #387 → #349 → #367 · **E** #375 · **F** #338 · **G** #380 · **H** #340 |
| **2 — navigation (un seul agent)** | N | #321 + #322 → #325 → #326 → #376 → #327 + #359 → #328 |
| **3 — données et formulaires** | P · Q · R | **P** #329 → #339 · **Q** #377 → #378 + #379 · **R** #336 + #351 + #352 |
| **4 — push (suite)** | S | #386 → #385 → #388 → #389 ; #366 |
| **5 — après décisions** | — | #372 → #332 → #341 ; #373 → fusion Membres ; #374 → #368 |
| **6 — en dernier** | — | #382 → #383 → #384 · #381 · #333 |

## 6. Ce qui est déjà fait (ne pas refaire)
CSP (`6db40fd`) · Control Room et onglet Formation supprimés (`5929bc1`) · tests de navigation réparés (PR #342) · code mort supprimé (PR #342) · retry du tracker et KPI de délivrabilité (`6f22e67`, `e5d7bee`) · expiration automatique des accès et webhook de paiement (`2a1d95f`) · enregistrement micro/caméra et MIME audio (#344 en partie).

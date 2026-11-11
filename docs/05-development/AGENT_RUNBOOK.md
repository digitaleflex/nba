# Guide d'exécution pour agents et contributeurs

> **À lire avant de toucher à une issue des chantiers `ui-audit-2026-11`, `push-alerts` ou `audit-tech-2026-11`.**
> Objectif : qu'un agent qui arrive sans contexte puisse prendre une issue, la livrer et la **prouver** sans rien deviner.
> Ce guide complète `CONTRIBUTING.md`, `docs/ENGINEERING_HANDBOOK.md` et `docs/05-development/CODING_STANDARDS.md`.

---

## 1. Règles critiques (celles qui font mal si on les ignore)

| # | Règle | Pourquoi |
|---|---|---|
| 1 | **Une fusion sur `main` déploie en production** (`.github/workflows/deploy.yml`, `on: push: branches: [main]`). | La PR #342 (docs + code mort) a ainsi été déployée. Ne fusionnez que ce qui est prêt à partir en prod. |
| 2 | **`main` bouge en permanence** : d'autres sessions poussent toutes les 15 à 30 minutes. | Beaucoup d'issues ont été réduites ou résolues par d'autres commits (voir la carte). |
| 3 | **Avant de commencer** : `git fetch origin main`, relire l'issue **et ses commentaires**, **revérifier que le défaut existe encore** (commandes `grep` données dans l'issue). | Ne refaites pas un travail déjà livré. |
| 4 | **Annoncez-vous** : commentez « Je prends » sur l'issue avant de coder. | Évite deux agents sur le même fichier. |
| 5 | **Jamais** de poussée directe sur `main`, jamais de `--force`. Une branche et une PR par issue. | Voir §6. |
| 6 | **Jamais de secret** dans le code, les issues, les captures ou les logs. Les comptes de démo ci-dessous sont **locaux uniquement**. | Les dépôts finissent par être lus par des tiers. |
| 7 | `prisma db push` est **bloqué** dans les sessions d'agents IA, et `prisma migrate deploy` **échoue sur une base vide**. | Utilisez `scripts/dev/setup-local.sh` (§2). |
| 8 | Une issue **trop grosse** ou **qui dépend d'une décision** : ne l'avalez pas. Découpez ou posez la question dans l'issue. | Voir « Décisions » dans `docs/audits/CARTE_DES_CHANTIERS_2026-11.md`. |

---

## 2. Démarrer en 5 minutes

Prérequis : Node 22, pnpm 10, PostgreSQL 16 et Redis disponibles en local (pas besoin de Docker).

```bash
bash scripts/dev/setup-local.sh   # installe, crée la base, le schéma, les comptes et les données de démo
pnpm dev                          # http://localhost:3000
```

Le script est **idempotent** (relançable) et prend environ 1 minute (3 minutes à froid). Il crée :

| Compte | E-mail | Mot de passe (local uniquement) |
|---|---|---|
| Super admin | `admin@example.com` | `Admin12345!x` |
| Membre actif | `membre@example.com` | `Membre12345!x` |

Données de démo (`scripts/dev/demo-data.sql`) : 8 signaux publiés, 6 prospects à différents stades d'onboarding, 1 abonnement approuvé. Pour repartir de zéro : supprimez la base `nba_dev` puis relancez le script.

> Le WebSocket est désactivé en local (`WS_ENABLED=false`) : l'indicateur « Connexion… » de la page Signaux est normal en développement.

---

## 3. Vérifier avant d'ouvrir une PR

Les quatre commandes que la CI exécute (`.github/workflows/ci.yml`) :

```bash
pnpm typecheck          # doit être propre (si erreur sur .next/types : rm -rf .next)
pnpm test               # tous les tests doivent passer
pnpm build              # build de production
pnpm lint               # NON BLOQUANT (continue-on-error) mais ne doit pas AJOUTER d'erreurs
```

Faits à connaître sur la CI :
- `pnpm lint` compte environ 580 erreurs **préexistantes** (surtout `no-explicit-any`). Elles ne bloquent pas la CI : ne les « corrigez » pas dans une PR sans rapport, mais n'en ajoutez pas.
- Le job **« Security Scan + SBOM » est rouge de façon chronique** (`Path does not exist: trivy-results.sarif`, étape d'envoi du rapport). Ce n'est pas un défaut de votre PR : il l'était déjà en août. Il ne bloque pas la fusion.
- Un test marqué `it.fails(...)` documente un **bug connu** : quand vous le corrigez, le test passe au rouge ; retirez alors `.fails`.

---

## 4. Mesurer (preuve avant / après)

Les critères d'acceptation de l'audit se vérifient avec les scripts de `scripts/audit/` (hors workspace pnpm : n'affectent ni le lockfile ni la CI).

```bash
cd scripts/audit && npm install                 # une fois (Playwright + axe-core)
npx playwright install chromium                 # une fois, si aucun Chromium n'est présent
# ou : export CHROMIUM_PATH=/chemin/vers/chromium

pnpm dev                                        # dans un autre terminal, base de démo prête

node a11y.cjs --who member --only /dashboard/lot    # axe WCAG A/AA + zones tactiles + textes < 12 px
node a11y.cjs --who admin  --mode desktop           # tout l'espace admin (code de sortie 1 si violation grave)
node shoot.cjs --who member --mode mobile --only /dashboard  --out ./out   # captures
```

- `--who public|member|admin`, `--mode desktop,mobile`, `--only <sous-chaîne de route>`, `--json fichier.json`.
- Les parcours sont dans `scripts/audit/routes.cjs` (ajoutez-y vos nouvelles pages).
- **Mesures de référence** (état de l'audit, à comparer après correction) : sur `/dashboard/lot` en desktop → `<44px=19`, `<12px=2`, `axe=color-contrast:2` ; titres de section de la sidebar admin à **1,97:1** de contraste.
- Les tours guidés sont neutralisés par le script (clés `nba:*-guide` posées à `true`) pour ne pas masquer les pages.
- Le navigateur sans interface **ne peut pas accorder** la permission de notification : le parcours push complet se valide sur appareils réels (voir `docs/audits/PUSH_ALERTS_AUDIT_2026-11.md`, §7).

Pour tester le **service worker** sans navigateur : `src/test/sw-harness.ts` charge le vrai `public/sw.js` dans un bac à sable et enregistre les appels à `showNotification` (exemples : `src/test/service-worker.test.ts`).

---

## 5. Conventions

| Sujet | Règle |
|---|---|
| Branche | `feat/nba-<n°issue>-<sujet>` (cf. `CONTRIBUTING.md`) ; les sessions d'agents peuvent utiliser le préfixe imposé par leur plateforme. **Une branche par issue.** |
| Commits | Style conventionnel : `fix(scope): …`, `feat(scope): …`, `test:`, `docs:`, `chore:`. Un commit = une idée. |
| PR | Modèle `.github/PULL_REQUEST_TEMPLATE.md` : `Closes #<n°>`, type de changement, cases cochées, **section Testing remplie avec la sortie des mesures**. Une PR ≈ une issue, idéalement < 300 lignes et < 10 fichiers. |
| Langue de l'interface | Français. **Vouvoiement** partout (voir `docs/08-ui/GLOSSAIRE.md`). |
| Vocabulaire | Un seul nom par fonctionnalité (`docs/08-ui/GLOSSAIRE.md`). |
| Statuts, rôles, enums | Jamais affichés bruts : passer par `src/lib/labels.ts` (à créer par l'issue UX-11). |
| Montants, dates | Via les formateurs partagés (`src/lib/format/*`, à créer par UX-02 / UX-13), jamais de devise ou de format codé en dur. |
| Couleurs | Tokens sémantiques (`primary`, `success`, `warning`, `destructive`, `muted`), pas de `blue-600`, `emerald-500`… |
| Taille de texte | 12 px minimum (`text-xs`). |
| Confirmations | `useConfirm()` (`src/components/confirm-dialog.tsx`), jamais `confirm()` natif. |
| Tests | Un test par comportement corrigé. Vitest, `src/**/*.test.ts(x)`. |

---

## 6. Éviter les collisions entre agents

1. **Carte des chantiers** : `docs/audits/CARTE_DES_CHANTIERS_2026-11.md` donne, pour chaque issue, son état réel, ses dépendances, ses fichiers en conflit et l'ordre conseillé.
2. Si deux issues touchent le même fichier (ex. `src/config/navigation.ts`, `public/sw.js`, `src/app/(admin)/admin/page.tsx`) : **respectez l'ordre de la carte** ou laissez le même agent faire les deux.
3. **Rebasez/fusionnez `main` dans votre branche avant d'ouvrir la PR** et relancez typecheck + tests.
4. Ne « réparez en passant » rien d'étranger à l'issue : ouvrez une nouvelle issue.
5. Fusion et déploiement : voir règle n° 1. Après fusion, vérifiez que le workflow **Deploy** passe au vert.

---

## 7. Pièges connus

- **CSP** (`src/middleware.ts`) : `style-src` est en `'unsafe-inline'` **sans nonce** (volontairement : avec un nonce, `'unsafe-inline'` est ignoré et les styles injectés par les bibliothèques sont bloqués). Les scripts inline portent le nonce. Pour injecter du CSS/JS dans un test navigateur, utilisez `bypassCSP: true`.
- **Dossier `.next`** : peut peser plusieurs Go et laisser des types périmés → `rm -rf .next` en cas d'erreur étrange.
- **`createAdmin.ts`** crée un compte **SUPER_ADMIN** (même pour un membre : le script de démo corrige ensuite le rôle). Il se termine désormais proprement.
- **Service worker** : un seul fichier `public/sw.js` pour tout. Les chantiers PUSH-1, PUSH-2 et PUSH-4 le modifient : ordre imposé par la carte. Incrémentez `SW_VERSION` à chaque changement.
- **Sons** : `public/sounds/*.wav` (17 fichiers, 3,4 Mo) ; le catalogue est dans `src/lib/notification-sounds.ts` ; le hook est `src/lib/hooks/use-notification-sound.ts`.
- **Migrations** : `prisma/migrations` ne s'applique pas sur une base vide (voir règle n° 7). Toute nouvelle migration doit s'appliquer sur la base de production existante.
- **Production** : l'application tourne derrière Traefik ; le worker (`workers/queue.ts`) est un processus séparé (service `worker` dans `compose.yml`). Un changement qui touche l'envoi de push/e-mails doit être pensé pour **les deux** processus.

---

## 8. Définition de « terminé »

- [ ] Le défaut décrit n'existe plus, **prouvé** par la mesure indiquée dans l'issue (sortie collée dans la PR).
- [ ] Test automatisé ajouté (ou raison écrite si impossible, ex. validation sur appareil réel).
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` verts ; aucune nouvelle erreur de lint.
- [ ] Interface en français, vouvoiement, vocabulaire du glossaire, 12 px minimum, couleurs sémantiques.
- [ ] Documentation mise à jour si le comportement visible change.
- [ ] PR liée (`Closes #…`), carte des chantiers mise à jour si l'ordre ou l'état change.

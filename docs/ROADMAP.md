# Roadmap Admin NBA — 2026

> **Mission** : transformer l'admin en outil d'opération fluide sur mobile et desktop, en passant d'un assemblage de 14 modules à 4 contextes d'usage, avec une expérience tactile de qualité.

**Auteur** : Direction Design (30+ ans)
**Statut** : À exécuter
**Méthodologie** : phases séquentielles, chaque phase laisse l'app dans un état livrable.

---

## Vue d'ensemble des phases

| # | Phase | Impact | Effort | Bloque / est bloquée par |
|---|---|---|---|---|
| 0 | Fondation : tokens, touch targets, design system | 🔴 Bloquant | 🟢 1j | Bloque 1–11 |
| 1 | Palette universelle (Cmd+K + mobile FAB) | 🟠 Élevé | 🟡 3j | Dépend de 0 |
| 2 | Dual-render tables (cards mobile / tables desktop) | 🟠 Élevé | 🟡 3j | Dépend de 0 |
| 3 | Navigation contextuelle (4 modes) | 🟠 Élevé | 🟡 2j | Dépend de 1, 2 |
| 4 | Detail panel responsive | 🟡 Moyen | 🟢 1j | Dépend de 2 |
| 5 | Control Room intégré au Dashboard | 🟡 Moyen | 🟡 2j | Dépend de 3 |
| 6 | Undo + swipe gestures | 🟡 Moyen | 🟡 2j | Dépend de 0 |
| 7 | Wizard signal (3 étapes) | 🟡 Moyen | 🟡 3j | Dépend de 2, 4 |
| 8 | Chart wrapper unifié | 🟢 Polish | 🟢 1j | Indépendant |
| 9 | Empty states actionnables | 🟢 Polish | 🟢 0.5j | Indépendant |
| 10 | Audit multi-vues | 🟢 Polish | 🟡 2j | Dépend de 2 |
| 11 | Inbox admin (cloche) | 🟢 Polish | 🟡 2j | Dépend de 1, 5 |

**Total estimé** : ~22 jours-homme pour 1 dev full-stack.

---

## Phase 0 — Fondation (🔴 bloquant, 1j)

### Objectif
Établir les primitives du design system pour qu'elles soient tactiles d'abord, et que toutes les phases suivantes n'aient pas à refaire le travail.

### Tâches
- [ ] **Audit des touch targets existants** : repérer tous les boutons `h-7`/`h-8` qui doivent passer à `h-11` sur mobile.
- [ ] **Tokens Tailwind v4** dans `packages/design-system/styles/tokens.css` :
  - `--ds-touch-target: 44px` (mobile default)
  - `--ds-touch-target-sm: 36px` (mobile + dense)
  - `--ds-touch-target-desktop: 32px` (≥md)
- [ ] **Variante `Button size="mobile-tap"`** : force 44px sur tous les viewports, sauf si explicitement overridé.
- [ ] **Hook `useIsMobile()`** dans `packages/design-system/hooks/` (basé sur `(pointer: coarse)` et `matchMedia`).
- [ ] **Composant `<Responsive variant="cardOnMobile|tableOnMobile">`** : helper pour le dual-render.
- [ ] **Bottom sheet primitive** : wrapper au-dessus de Dialog, optimisé tactile (drag to dismiss).

### Fichiers à toucher
- `packages/design-system/components/button.tsx`
- `packages/design-system/components/dialog.tsx` (ajout `BottomSheet` variant)
- `packages/design-system/hooks/use-is-mobile.ts`
- `packages/design-system/components/responsive.tsx`
- `packages/design-system/styles/tokens.css`

### Critère d'acceptation
- `Button size="sm"` rend `h-7` sur desktop, `h-11` sur mobile, sans override par le consommateur.
- Lighthouse mobile audit ≥ 95 sur les pages admin.

---

## Phase 1 — Palette universelle (🟠, 3j)

### Objectif
Faire de `⌘K` (et son équivalent mobile) le point d'entrée unique pour toute action admin. Réduire la charge cognitive du menu latéral.

### Tâches
- [ ] **API `/api/admin/command-palette/search?q=`** : agrège users, signals, KYC, audit, actions, navigations.
- [ ] **Service `commandPaletteIndex.ts`** : pré-indexe en mémoire les routes + actions (statique), requêtes DB à la volée.
- [ ] **Composant `<CommandPalette />`** dans `apps/web/src/components/command-palette.tsx` :
  - Mobile : plein écran, input autofocus, sections (Membres / Signaux / Actions / Navigation)
  - Desktop : modal centrée, navigation clavier complète
  - Groupes : `Membres`, `Signaux`, `Actions`, `Pages`
  - Touches : ↑↓ naviguer, ⏎ valider, ⌘K fermer, ⌘1..9 jump catégorie
- [ ] **FAB mobile "Rechercher…"** au-dessus de la bottom nav, ouvre la même palette.
- [ ] **Raccourcis globaux** dans un `useGlobalShortcuts` hook : `N` (nouveau signal), `M` (membres), `K` (KYC pending).
- [ ] **Intégration dans `admin-layout.tsx`** : la palette est montée une seule fois, accessible partout.

### Fichiers à toucher
- `src/app/api/admin/command-palette/search/route.ts` (nouveau)
- `src/lib/services/command-palette.ts` (nouveau)
- `src/components/command-palette.tsx` (nouveau)
- `src/components/admin-layout.tsx`
- `src/app/components/mobile-bottom-nav.tsx` (FAB)

### Critère d'acceptation
- Sur n'importe quelle page admin, `⌘K` ouvre la palette en < 100ms (cache local pour l'index statique).
- Sur mobile, le bouton FAB est visible au-dessus de la bottom nav et ouvre la palette plein écran avec autofocus input.
- Toutes les 14 destinations actuelles sont atteignables en ≤ 2 frappes (cmd + 1 lettre).

---

## Phase 2 — Dual-render tables (🟠, 3j)

### Objectif
Toutes les tables admin (Membres, Audit, KYC, Broker) doivent être **scannables et actionnables** sur mobile, sans sacrifier la densité desktop.

### Tâches
- [ ] **Helper `<DualRender mobile={<Card/>} desktop={<Table/>}/>`** dans design-system.
- [ ] **MembresTab** : ajouter la vue mobile (cards empilées avec name, status badge, plan badge, push status, action menu).
- [ ] **AuditTab** : idem (cards par jour, expand inline pour le JSON).
- [ ] **KYC / Broker tabs** : idem (cards avec preview + actions rapides).
- [ ] **Filter bottom sheet** : tous les filtres/selects deviennent un bottom sheet `<FilterSheet>` sur mobile, avec chips visibles des filtres actifs.
- [ ] **Sort/filter** : garder URL-driven (`?status=ACTIVE&sort=name`) pour partage de liens.
- [ ] **Performance** : `IntersectionObserver` pour virtualiser la liste mobile au-delà de 50 items.

### Fichiers à toucher
- `packages/design-system/components/dual-render.tsx` (nouveau)
- `packages/design-system/components/filter-sheet.tsx` (nouveau)
- `src/app/(admin)/admin/features/MembresTab.tsx`
- `src/app/(admin)/admin/features/AuditTab.tsx`
- `src/app/(admin)/admin/features/RequestsTab.tsx`
- `src/app/(admin)/admin/features/KycTab.tsx`
- `src/app/(admin)/admin/features/BrokerTab.tsx`

### Critère d'acceptation
- Membres table : 320px viewport → cards empilées, 1 tap pour voir détail, 1 tap pour action.
- Touch targets : 44px minimum sur tous les éléments actionnables en mobile.
- Pagination : infinite scroll sur mobile, classique sur desktop.
- Filtres : visibles en chips au-dessus de la liste, ouvrant un bottom sheet pour les modifier.

---

## Phase 3 — Navigation contextuelle (🟠, 2j)

### Objectif
Passer de 14 sous-onglets à 4 contextes mentaux, tout en gardant l'accès à tout.

### Tâches
- [ ] **Restructurer `admin-context.tsx`** : les onglets deviennent `Surveiller / Décider / Communiquer / Auditer`.
- [ ] **Mapping des anciennes URLs** :
  - `?tab=dashboard,stats,analytics` → `Surveiller`
  - `?tab=requests,members,kyc,broker` → `Décider`
  - `?tab=signals,emails,notifications` → `Communiquer`
  - `?tab=audit,moderation,security,settings,users` → `Auditer`
- [ ] **Sidebar refactor** : 4 groupes avec icônes distinctes, indicateur de pending count (badge) sur `Décider` quand il y a des KYC en attente.
- [ ] **Pill tabs internes** : garder la navigation fine dans chaque contexte (Linear-style).
- [ ] **Migration des bookmarks** : 301 redirect pour les anciennes URLs si nécessaire.

### Fichiers à toucher
- `src/app/(admin)/admin/admin-context.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/components/sidebar.tsx`
- `src/app/components/mobile-bottom-nav.tsx`
- `src/app/components/mobile-menu.tsx`

### Critère d'acceptation
- Sidebar montre 4 groupes max, chacun avec ses sections en submenu.
- Mobile bottom nav : 4 icônes max (les 4 contextes).
- La palette universelle (Phase 1) reste l'accès rapide à tout.

---

## Phase 4 — Detail panel responsive (🟡, 1j)

### Objectif
Le sliding right panel fonctionne bien sur desktop. Sur mobile, il devient un push-from-right full-screen avec breadcrumb.

### Tâches
- [ ] **Hook `useResponsivePanel()`** : renvoie `variant: "side" | "fullscreen"` selon viewport.
- [ ] **Adapter `admin-context-panel.tsx`** :
  - Desktop : `w-[480px]` collé à droite, backdrop blur, ESC ferme.
  - Mobile : plein écran, animation push-from-right, breadcrumb en haut (`← Membres`).
- [ ] **Nested panels** (panneau d'un panneau, comme Membre → ses KYC) : niveau 2 push-from-right sur mobile, niveau 1 reste ancré desktop.
- [ ] **Scroll lock** : `body { overflow: hidden }` uniquement desktop, sur mobile c'est natif au push.

### Fichiers à toucher
- `src/app/components/admin-context-panel.tsx`
- `src/app/(admin)/admin/hooks/use-responsive-panel.ts` (nouveau)

### Critère d'acceptation
- Mobile : ouvrir un membre push un plein écran depuis la droite, breadcrumb `← Membres` revient à la liste.
- Desktop : comportement actuel conservé.
- iOS Safari : pas de double scroll, pas de focus trap cassé.

---

## Phase 5 — Control Room intégré (🟡, 2j)

### Objectif
Supprimer la page `/admin/control-room` séparée. Le Dashboard devient live par défaut, avec un panneau d'alertes latéral.

### Tâches
- [ ] **Dashboard live by default** : auto-refresh 10s comme aujourd'hui, mais intégré au `DashboardTab`.
- [ ] **`<AlertsPanel />`** : panneau droit desktop, bottom sheet mobile, avec :
  - KYC pending (top 5)
  - Broker pending
  - Webhook DLQ count
  - Email failures 24h
  - Login anomalies
- [ ] **Suppression de `/admin/control-room`** : redirection 301 vers `/admin?tab=dashboard`.
- [ ] **Le Tracker** reste une page séparée (spécifique delivery).

### Fichiers à toucher
- `src/app/(admin)/admin/features/DashboardTab.tsx`
- `src/app/(admin)/admin/components/alerts-panel.tsx` (nouveau)
- `src/app/(admin)/admin/control-room/page.tsx` (suppression ou redirect)

### Critère d'acceptation
- Une seule vue "temps réel" : le Dashboard.
- Mobile : un bottom sheet "Alertes (3)" accessible depuis le FAB central de la bottom nav.
- Aucun lien vers `/admin/control-room` dans la nav.

---

## Phase 6 — Undo + swipe (🟡, 2j)

### Objectif
Remplacer les modales de confirmation par des patterns plus rapides (mobile + desktop).

### Tâches
- [ ] **Hook `useUndoAction()`** : toast avec bouton Annuler (8s) au lieu de modal pour : archive, delete, ban, reactivate.
- [ ] **Swipe gestures mobile** : `useSwipeable` sur les cards (Membres, Signals, Notifications) :
  - Swipe left → archive
  - Swipe right → snooze/épingler
- [ ] **Slider "Glisser pour confirmer"** pour les actions critiques (delete account, ban user, revoke access).
- [ ] **Server-side : endpoint `POST /api/admin/undo/[id]`** : annule l'action si elle vient d'avoir lieu (soft delete → restore, archive → unarchive, etc.). TTL 30s.

### Fichiers à toucher
- `src/hooks/use-undo-action.ts` (nouveau)
- `src/hooks/use-swipeable.ts` (nouveau)
- `src/app/api/admin/undo/[id]/route.ts` (nouveau)
- `src/app/components/confirm-destructive.tsx` (nouveau, slider)
- `src/app/(admin)/admin/features/MembresTab.tsx` (swipe)

### Critère d'acceptation
- Archiver un signal : 1 tap + toast avec "Annuler (8s)".
- Sur mobile : swipe-to-archive sur les cards Membres (avec feedback haptique si dispo).
- Delete account / ban : slider "Glisser pour confirmer" (pas de modal).

---

## Phase 7 — Wizard signal (🟡, 3j)

### Objectif
Remplacer l'éditeur long par un flow guidé en 3 étapes, optimisé mobile.

### Tâches
- [ ] **Restructurer `signal-editor.tsx`** en `<SignalWizard steps={[content, audience, schedule]} />`.
- [ ] **Étape 1 : Quoi** : focus texte, drag-drop images, preview live.
- [ ] **Étape 2 : À qui** : chips multiselect des plans, recherche, estimation live du nombre de destinataires.
- [ ] **Étape 3 : Quand** : radio "Maintenant / Planifié", date picker si planifié.
- [ ] **Autosave en brouillon** : `POST /api/admin/signals/draft` à chaque champ modifié (debounce 1s).
- [ ] **Mobile : plein écran par étape**, transition slide horizontale.
- [ ] **Desktop : 3 colonnes côte à côte** ou wizard centré 600px.
- [ ] **Récupération** : si l'admin ferme, le brouillon est restauré au retour.

### Fichiers à toucher
- `src/app/(admin)/admin/components/signal-editor.tsx` (refactor → SignalWizard)
- `src/app/(admin)/admin/components/signal-wizard/step-content.tsx` (nouveau)
- `src/app/(admin)/admin/components/signal-wizard/step-audience.tsx` (nouveau)
- `src/app/(admin)/admin/components/signal-wizard/step-schedule.tsx` (nouveau)
- `src/app/api/admin/signals/draft/route.ts` (nouveau)
- `src/lib/services/signal-draft.ts` (nouveau)

### Critère d'acceptation
- Publication d'un signal en < 30s depuis mobile.
- Brouillon restauré après refresh.
- Étape 1 → 2 → 3 navigation : swipe horizontal sur mobile, boutons + indicateur de step sur desktop.

---

## Phase 8 — Chart wrapper unifié (🟢, 1j)

### Objectif
Un seul composant `<Chart type data />` qui rend correctement sur mobile et desktop avec tooltips adaptés.

### Tâches
- [ ] **Composant `<Chart type="bar|line|funnel" data={[]} />`** dans design-system.
- [ ] **SVG pur** (pas de chart library), animations CSS.
- [ ] **Tooltips** : popover ancré sur desktop, bottom sheet sur mobile.
- [ ] **Empty state** intégré : pas de graph vide, message "Pas assez de données".
- [ ] **Migrer** les 3 charts actuels (Dashboard, Analytics, Control Room) vers ce wrapper.

### Fichiers à toucher
- `packages/design-system/components/chart.tsx` (nouveau)
- `src/app/(admin)/admin/features/DashboardTab.tsx`
- `src/app/(admin)/admin/features/AnalyticsTab.tsx`
- `src/app/(admin)/admin/control-room/page.tsx` (ou supprimé en Phase 5)

### Critère d'acceptation
- Tous les charts utilisent le même composant.
- Tooltip : tap mobile = bottom sheet 200px de haut, hover desktop = popover.
- Couleurs sémantiques respectées (primary / emerald / rose).

---

## Phase 9 — Empty states actionnables (🟢, 0.5j)

### Objectif
Chaque liste vide devient un onboarding passif.

### Tâches
- [ ] **Composant `<EmptyState action={...} shortcut="N" />`** dans design-system.
- [ ] **Audit de tous les empty states** : Membres, KYC, Signals, Notifications, Audit, etc.
- [ ] **Bouton pleine largeur mobile**, inline desktop.
- [ ] **Raccourci clavier visible** dans l'empty state si pertinent.

### Fichiers à toucher
- `packages/design-system/components/empty-state.tsx`
- `src/app/(admin)/admin/features/*.tsx` (audit + ajustements)
- `src/app/(dashboard)/dashboard/**/*.tsx` (audit + ajustements)

### Critère d'acceptation
- Aucun empty state sans CTA.
- Le raccourci clavier apparaît dans l'empty state et fonctionne.

---

## Phase 10 — Audit multi-vues (🟢, 2j)

### Objectif
L'audit log n'est plus une liste plate, c'est 3 vues partageables.

### Tâches
- [ ] **3 onglets dans AuditTab** : Timeline / Par utilisateur / Par ressource.
- [ ] **Vue "Par utilisateur"** : cards groupées par jour, expand inline pour le JSON diff.
- [ ] **Vue "Par ressource"** : drill-down (ex: signal #abc → toutes les actions sur ce signal).
- [ ] **URL params** : `?view=timeline|user|resource&resourceType=signal&resourceId=...`.
- [ ] **Export CSV** par vue.

### Fichiers à toucher
- `src/app/(admin)/admin/features/AuditTab.tsx`
- `src/app/api/admin/audit/route.ts` (group by)

### Critère d'acceptation
- 3 modes de lecture, partageables par URL.
- Mobile : cards empilées avec expand inline.
- Desktop : table dense ou cards au choix utilisateur.

---

## Phase 11 — Inbox admin (🟢, 2j)

### Objectif
Une vraie inbox pour les admins, pas un dropdown.

### Tâches
- [ ] **`<AdminInbox />`** : panneau/popover desktop, écran plein mobile.
- [ ] **Catégories** : Pending actions / Security / System / Messages.
- [ ] **Endpoints** :
  - `GET /api/admin/inbox?category=pending` : agrège KYC, Broker, DLQ, anomalies.
  - `POST /api/admin/inbox/[id]/dismiss` : ferme un item.
- [ ] **Badge dans la top bar** : compteur des pending.
- [ ] **Actions primaires** : Approuver / Rejeter / Snooze (8h) / Investiguer.

### Fichiers à toucher
- `src/app/api/admin/inbox/route.ts` (nouveau)
- `src/app/api/admin/inbox/[id]/dismiss/route.ts` (nouveau)
- `src/lib/services/admin-inbox.ts` (nouveau)
- `src/app/(admin)/admin/components/admin-inbox.tsx` (nouveau)
- `src/app/(admin)/admin/components/dashboard-header.tsx`

### Critère d'acceptation
- La cloche en haut à droite montre un badge avec le nombre d'actions en attente.
- Click ouvre l'inbox (panneau desktop, plein écran mobile).
- Chaque item a son action primaire en 1 tap.

---

## Notes transverses

### Accessibilité
- Toutes les phases : tester `axe-core` sur chaque page modifiée.
- Focus visible partout, navigation clavier complète.
- ARIA labels sur tous les icônes-boutons (notamment les swipes).

### Performance
- Virtualisation des listes au-delà de 50 items (`@tanstack/react-virtual`).
- Prefetch des routes de la palette universelle.
- Skeleton loaders pour chaque liste (déjà en place, à généraliser).

### Tests
- Test E2E (Playwright) pour : Cmd+K, swipe, undo, wizard complet.
- Test visuel (Chromatic) sur les breakpoints : 320, 768, 1024, 1440.

### Migration
- Aucune feature n'est supprimée avant d'avoir son remplaçant.
- Liens d'ancienne URL → nouvelle URL en 301.
- Feature flag `?v2=1` pour activer progressivement les nouveaux écrans si besoin.

---

## Suivi

Cette roadmap est exécutée phase par phase, dans l'ordre 0 → 11. Chaque phase est livrée, committée, et demo-able avant de passer à la suivante. Le suivi quotidien se fait via la todo list de session.

**Statut courant** : Terminé — Phases 0 à 11 implémentées (branche `feat/ui-ux-roadmap-phases`).

| Phase | Statut | Commits |
|-------|--------|---------|
| 0 — Fondation tactile | ✅ Terminé | `c472116` |
| 1 — Palette universelle | ✅ Terminé | `a20d569` |
| 2 — Dual-render tables | ✅ Terminé | `83999a1` |
| 3 — Navigation contextuelle | ✅ Terminé | `aae0c1e` |
| 4 — Detail panel responsive | ✅ Déjà en place | — |
| 5 — Control Room intégré | ✅ Déjà en place | — |
| 6 — Undo + swipe | ✅ Terminé | `3a8a426` |
| 7 — Signal wizard | ✅ Déjà en place | — |
| 8 — Chart wrapper | ✅ Déjà en place | — |
| 9 — Empty states | ✅ Terminé | `026835e` |
| 10 — Audit multi-vues | ✅ Déjà en place | — |
| 11 — Admin inbox | ✅ Déjà en place | — |
| Onboarding QWs | ✅ Terminé | `026835e` |

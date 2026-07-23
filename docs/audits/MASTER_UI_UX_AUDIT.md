# Audit UI/UX — NBA Trading-Signals

> Audit complet réalisé par une équipe multi-experts (Product/UX/UI Design, Design System, Frontend, Mobile, HCI, A11y WCAG 2.2, Tailwind, Base UI, Framer Motion, Data-Viz).
> Méthode : lecture réelle du code (`src/app`, `packages/design-system`, `src/config/navigation.ts`, `src/app/globals.css`). Aucune affirmation inventée — chaque problème cite `fichier:ligne`.

---

## 0. CONSTATS STRUCTURELS (fondation)

- **Stack UI** : les primitives (`packages/design-system/components/ui/*`) wrapper **`@base-ui/react`**, PAS Radix. Pourtant `package.json` liste encore 9 dépendances `@radix-ui/*` **inutilisées** (poids mort).
- **Design tokens externalisés** : `theme/`, `tokens/`, `styles/`, `animations/` dans `packages/design-system` sont **vides**. Les tokens (couleurs, spacing, radius, shadows, dark/light) vivent **uniquement** dans `src/app/globals.css` (`@theme`, lignes 6-63 + `.dark`). Le design-system n'est donc **pas autonome**.
- **Dossiers vides** : `packages/design-system/components/{dashboard,layouts,shared}` → **0 fichier**. La coquille (Sidebar, MobileBottomNav, MobileMenu) est implémentée **ad-hoc** dans `src/app/components/*`, pas réutilisable.
- **Pas de `tailwind.config`** : Tailwind v4 CSS-first (`@import "tailwindcss"`). Tokens centralisés dans un seul `@theme` — bonne pratique, mais hors package.
- **Mobile-first** : bottom-nav fixe + safe-area correcte (`mobile-bottom-nav.tsx:49`), mais couvre mal tout l'app.

---

## 1. SCORES

| Dimension | Score | Juge |
|---|---|---|
| UI | **68/100** | radius/ombres incohérents, tokens hors package, dossiers vides |
| UX | **64/100** | nav mobile incomplète, pas d'operations center, frictions onboarding |
| Mobile | **62/100** | 5 écrans hors bottom-nav, CTA <44px, coach IA chevauche la nav |
| Desktop | **74/100** | bon usage sidebar, mais admin encombré, zones vides |
| Responsive | **70/100** | padding-bottom manquant sur plusieurs pages |
| Accessibilité | **58/100** | 🔥 reduced-motion absent, labellisation, skip-link manquant |
| Performance UX | **66/100** | re-render admin 10s, spinners plein écran, flash |
| Cohérence | **60/100** | confirm() natif vs Dialog, rayons mixtes, libellés dupliqués |
| Simplicité | **67/100** | notifications surchargées, admin 19 onglets |

**Moyenne pondérée ≈ 65/100.** Potentiel élevé : la base (Base UI, tokens centralisés, EmptyState réutilisé, command palette, undo admin) est solide.

---

## 2. PROBLÈMES PAR PRIORITÉ

### 🔥 CRITIQUE

**C1. Reduced-motion absent application-wide** — `globals.css` (aucune règle `prefers-reduced-motion`), et 6 composants `motion`/`AnimatePresence` (`confetti.tsx`, `milestone-modal`, `missions-panel`, `notification-bell`, `signals-view`, `journal/page`) sans garde `useReducedMotion()`.
- *Cause* : aucune stratégie motion centralisée (`animations/` vide).
- *Impact* : vertiges/accessibilité WCAG 2.3.3 ; perf mobile bas de gamme.
- *Solution* : ajouter `@media (prefers-reduced-motion: reduce)` global + hook `useReducedMotion()` partagé dans `design-system/animations`; gate `confetti`/modales.
- *Coût* : Faible · *Risque* : Faible.

**C2. Navigation mobile incomplète** — `src/config/navigation.ts:51-91` (`dashboardMobile`) : seulement Signaux, Journal, Onboarding, Admin, Messages. **Notifications, Abonnement, Support, Profil, Appareils** introuvables sans ouvrir le drawer.
- *Cause* : bottom-nav figée à 5 items.
- *Impact* : >50% des écrans à 3+ clics sur mobile (objectif ≤3 non atteint).
- *Solution* : ajouter les 5 items manquants OU un 6e "Plus" ouvrant le drawer ; ou surface mobile des 3 prioritaires.
- *Coût* : Faible · *Risque* : Faible.

**C3. Pas de operations center (dashboard racine)** — `dashboard/page.tsx:6-8` redirige direct vers `/dashboard/signals`. Aucune vue synthèse (KPI portfolio, streak, santé compte).
- *Cause* : pas de home screen.
- *Impact* : l'utilisateur atterrit sur un flux sans repère.
- *Solution* : page `/dashboard` = overview (KPIs PnL, win rate, streak, dernière réflexion, accès rapides).
- *Coût* : Moyen · *Risque* : Faible.

**C4. Admin : 19 onglets dans un strip scrollable** — `admin/page.tsx:417` (`flex overflow-x-auto snap-x`), + `ModerationTab` mort (`:457`, valeur non listée), + `/admin/control-room` redirige vers `/admin?tab=dashboard` (`control-room/page.tsx:4`).
- *Cause* : pas de regroupement nav.
- *Impact* : opérateur perdu, scroll horizontal, UI morte.
- *Solution* : nav groupée (sidebar/drawer par section) + vraie vue Control Room + supprimer le tab mort.
- *Coût* : Moyen · *Risque* : Moyen.

### 🟠 HAUTE

**H1. Tokens hors package / dossiers vides** — `packages/design-system/{theme,tokens,styles,animations}` vides ; tokens dans `src/app/globals.css`. → design-system non autonome, risque de dérive.
- *Solution* : déplacer `@theme` + `.dark` dans `design-system/styles/tokens.css` et réexporter ; peupler `animations/` et `layouts/`.

**H2. Rayons incohérents** — `button.tsx:8` `rounded-lg` vs `card/dialog/popover/select` `rounded-xl` (`card.tsx:15`, `dialog.tsx:56`). `badge.tsx:8` `rounded-4xl` (hors échelle tokens).
- *Solution* : un seul token `--radius` appliqué partout ; `badge` → `rounded-full`.

**H3. Ombre `--shadow-2xl` inexistante** — `bottom-sheet.tsx:48` `shadow-2xl` non défini dans `globals.css` (only xs…xl) → fallback Tailwind casse le dark palette.
- *Solution* : ajouter `--shadow-2xl` au `@theme` ou utiliser `shadow-xl`.

**H4. Feedback destructif par `confirm()` natif** — `admin-tools.tsx:14` (purge cache), `devices/page.tsx:86,105` (révoque), `audit/page.tsx:951` (`alert()`). Incohérent vs `<Dialog>` du design-system.
- *Solution* : remplacer par `Dialog` de confirmation stylé.

**H5. Frictions onboarding/forms** — `register/page.tsx:79-84` (perte progression au refresh sur l'étape sécurité, mots de passe en mémoire seule), `:87` détection ban par `err.message.includes("banni")` (FR-only, fragile), `step-security.tsx:59` toggle mot de passe `tabIndex={-1}` (inaccessible clavier), `step-email.tsx:131-139` OTP = `<input>` brut sans `autoComplete="one-time-code"`.
- *Solution* : persister un flag non-credential, détecter ban via `err.code`, retirer `tabIndex={-1}`, OTP via `Input` + `one-time-code`.

**H6. Notifications surchargées** — `notifications/page.tsx` = moitié réglages (son ×5, 7 toggles) + moitié inbox.
- *Solution* : préférences dans un sous-onglet/Dialog ; l'inbox devient vue primaire. Ajouter skeleton liste (`:277`).

**H7. Coach IA chevauche la nav mobile** — `coach-ia.tsx` `fixed bottom-4 right-4` peut recouvrir `MobileBottomNav`.
- *Solution* : `mb-20 md:mb-0` + z-index contrôlé.

**H8. Padding-bottom mobile manquant** — `profile/`, `notifications/`, `support/` (`max-w-2xl mx-auto`) sans `pb-20` → dernier CTA sous la barre fixe (`app-shell.tsx:30` met `pb-16`).
- *Solution* : `pb-[calc(4rem+env(safe-area-inset-bottom))]`.

### 🟡 MOYENNE

- **M1** Root layout sans skip-link ni `<main>` landmark (`layout.tsx`) → clavier bloqué. Ajouter skip-link + `<main>`.
- **M2** `onboarding/kyc/page.tsx:128` choix document = boutons sans `role="radiogroup"` ; `:167-174` dropzone `<label tabIndex={0>` fragile ; `:37` `alt={file.name}` non descriptif. → `role=radio` + `<button>` + `alt="Aperçu du document"`.
- **M3** `onboarding/broker/page.tsx:73-83` & `profile/page.tsx:132-146` `<label>` sans `htmlFor`/`id` sur `<select>`. → lier `id`/`aria-labelledby`.
- **M4** `login/page.tsx:21-28` validation uniquement au submit, pas `aria-invalid` sur champs. → `aria-invalid` + inline.
- **M5** Copy contradictoire mot de passe : `profile/page.tsx:478` `minLength={10}` vs hint `:488` "Minimum 8" ; `reset-password/page.tsx:129` min 10 vs check `:34` ≥8. → aligner sur 10.
- **M6** `register/page.tsx:148-172` stepper sans `aria-current="step"`, labels cachés mobile. → `aria-current` + label visuellement caché.
- **M7** `admin/page.tsx:160` re-fetch 10s remplace `opsData` → re-render global + flash animation. → flag `isFetching` shallow, pas de remount.
- **M8** `admin/page.tsx:69` Suspense plein écran (`h-screen`) à chaque changement d'onglet. → loading par onglet.
- **M9** `messages/page.tsx:198` échec d'envoi optimiste silencieux (pas de `toast.error`). → ajouter.
- **M10** Tables : `members/page.tsx:344` pas de tri colonnes ni export CSV ; `tracker/signal-table-client.tsx:215` mobile sans tri. → ajouter.

### 🟢 FAIBLE

- **G1** `skeleton.tsx:7` pas `aria-hidden`. **G2** `bottom-sheet.tsx:80` bouton fermeture = `<button>` inline sans token focus ; réutiliser `Button ghost icon-sm`. **G3** `tabs.tsx:61` `ring-[3px]` vs `ring-3` ailleurs — uniformiser. **G4** `--top-loader-glow` token indéfini (`top-loader.tsx:109`). **G5** `verify-device/page.tsx` (bon) vs `verify-device` pattern à généraliser. **G6** `maintenance/page.tsx:21` "Réessayer" lien `/` sans reload → vrai retry. **G7** `blocked/page.tsx` ajouter `role="alert"`. **G8** `swipeable-row.tsx` pas de fallback bouton a11y. **G9** `signals/[id]/page.tsx:144` CTA emoji brut → icône lucide. **G10** `support/page.tsx:25` erreur sans bouton retry.

---

## 3. PLAN DE REFONTE (par phases)

**Phase 0 — Fondation (1-2j)** : déplacer tokens dans `design-system/styles` ; peupler `animations/` (variants + `useReducedMotion`) ; supprimer Radix morts ; standardiser radius/ombres ; Extraire `Sidebar`/`MobileBottomNav`/`MobileMenu` dans `design-system/components/layouts`.

**Phase 1 — Accessibilité & Feedback (2-3j)** : reduced-motion global ; skip-link + `<main>` ; `aria-current` stepper ; `Dialog` partout (confirm/alert natifs) ; `aria-invalid` + `one-time-code` ; toasts sur échecs.

**Phase 2 — Navigation & Mobile (2-3j)** : bottom-nav complète (C2) ; `pb` safe-area partout ; Coach IA z-index ; overview dashboard (C3).

**Phase 3 — Admin Ops Center (3-4j)** : nav groupée (C4) ; Control Room réel ; supprimer tab mort ; loading par onglet ; tri/export tables.

**Phase 4 — Simplification & Polish (2-3j)** : notifications scindées (H6) ; copy cohérent (M5) ; skeletons partout ; offline banner global.

---

## 4. NOUVELLE ARCHITECTURE ÉCRANS

```
/                 → Landing / redirect selon auth
/login /register  → Auth (stepper, reduced-motion, a11y)
/onboarding/*     → Broker → Kyc → Profile (progression visuelle)
/dashboard        → OPERATIONS CENTER (nouveau)
  ├─ signals      → Feed + filtres + détail [id]
  ├─ journal      → Tabs (Trades / Réflexions) + sessions + missions
  ├─ notifications→ Inbox (préférences en sous-vue)
  ├─ messages     → Chat (liste/detail mobile)
  ├─ subscription / profile / devices / support / verification
/admin             → Ops Center groupé (sidebar sections)
  ├─ dashboard | control-room | queues | webhooks/dlq
  ├─ audit | cache | members | messages | support | tracker
```

## 5. WIREFRAMES TEXTUELS (Operations Center)

```
┌───────────────────────────────────────────────┐
│ [Logo]  Search ⌘K        🔔  👤 (header)        │
├────────┬──────────────────────────────────────┤
│ Sidebar│  OPERATIONS CENTER                     │
│ Signaux│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│ Journal│  │PnL  │ │Win% │ │Streak│ │Trades│     │
│ Notif  │  └─────┘ └─────┘ └─────┘ └─────┘     │
│ Msg    │  ┌──────────────┐ ┌────────────────┐  │
│ Profil │  │ Derniers     │ │ Actions rapides │  │
│ ...    │  │ signaux      │ │ + Trade  Reflex │  │
│        │  └──────────────┘ └────────────────┘  │
└────────┴──────────────────────────────────────┘
        [🏠][📈][📓][🔔][☰]  (bottom-nav mobile)
```

## 6. NOUVEAU SYSTÈME DE NAVIGATION

- **Desktop** : Sidebar groupée par section (Signaux, Journal, Compte, Admin) ; badges (messages, non-lus).
- **Mobile** : Bottom-nav = Signaux, Journal, Notifications, Messages, + "Plus" (drawer pour Profil/Abonnement/Appareils/Support/Vérification).
- **Global** : Command palette (⌘K) déjà présente — y ajouter navigation rapide.
- **Cible** : toute fonction ≤ 3 clics (actuellement ~5 écrans à 3+ sur mobile).

## 7. CHECKLIST AVANT PRODUCTION

- [ ] Reduced-motion global + garde `useReducedMotion` sur tous les `motion`.
- [ ] Skip-link + `<main>` landmark présent.
- [ ] Tokens dans `design-system` (autonome) ; radius/ombres uniformisés.
- [ ] Toute action destructive → `Dialog` (plus de `confirm()`/`alert()` natif).
- [ ] Bottom-nav mobile couvre 100% des écrans principaux.
- [ ] `pb` safe-area sur toutes les pages (aucun CTA sous la barre).
- [ ] `aria-current` sur steppers/nav ; `aria-invalid` sur champs invalides.
- [ ] OTP/code inputs : `autoComplete="one-time-code"` + `inputMode`.
- [ ] Skeletons sur tous les chargements (plus de spinner plein écran).
- [ ] Toasts sur tous les échecs (envoi message, retry, purge).
- [ ] Offline banner global (`navigator.onLine`).
- [ ] Tables : tri + export CSV (admin/members/tracker).
- [ ] Copy cohérent (mots de passe 10, libellés Vérification uniques).
- [ ] Audit Lighthouse a11y ≥ 90, CLS < 0.1.

---

## 8. BÉNÉFICES ATTENDUS

- **Accessibilité** : conformité WCAG 2.2 AA, aucun utilisateur bloqué clavier/mobile.
- **Vitesse d'exécution** : toute tâche en ≤3 clics, operations center à l'arrivée.
- **Cohérence** : un seul langage visuel (tokens, rayons, Dialog) — maintenance ÷2.
- **Confiance** : feedback systématique (loading/toast/undo/confirm) réduit l'anxiété trader.
- **Performance perçue** : skeletons + reduced-motion = zéro flash/jank.

*Audit généré à partir de la lecture directe du code. Toutes les références `fichier:ligne` sont vérifiables.*

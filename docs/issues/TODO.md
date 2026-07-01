# TODO — Audit UI/UX Corrections

> Généré le 2026-07-01 — 25 issues créées dans `docs/issues/`
> Détails complets dans chaque fichier d'issue.

---

## 🔴 Critical (6)

| # | Issue | Fichier | Status |
|---|-------|---------|--------|
| 001 | Page vide si non connecté → `redirect("/login")` | `dashboard/page.tsx:9` | ⬜ |
| 002 | Spinner infini quand fetch échoue → état error + retry | `verification/page.tsx:34` | ⬜ |
| 003 | Cartes notifications inaccessibles → `role="button"` + keyboard | `notifications/page.tsx:129` | ⬜ |
| 004 | Labels profil cassés → `htmlFor`/`id` sur 12+ champs | `profile/page.tsx` | ⬜ |
| 005 | Admin non fonctionnel sur mobile → header mobile | `admin/page.tsx:89` | ⬜ |
| 007 | Regex OTP cassée → `/\D/g` au lieu de `/\\D/g` | `step-email.tsx:120` | ⬜ |
| 011 | XSS potentiel → DOMPurify sur markdown preview | `signal-editor.tsx:368` | ⬜ |
| 021 | Onboarding blank page → état error + retry | `onboarding/page.tsx:46` | ⬜ |

## 🟠 High (7)

| # | Issue | Fichier | Status |
|---|-------|---------|--------|
| 006 | Touch targets trop petits → `size-9` minimum | `admin/page.tsx:1076` | ⬜ |
| 008 | Modales sans focus trap → `role="dialog"` + Escape | `admin-context-panel.tsx`, `signal-editor.tsx` | ⬜ |
| 009 | Aucune gestion d'erreur admin → état error par module | `admin/page.tsx:212-354` | ⬜ |
| 010 | Actions destructrices sans confirmation → Dialog | `admin-context-panel.tsx:156` | ⬜ |
| 012 | Toggle mot de passe inaccessible → supprimer `tabIndex={-1}` | `login/page.tsx`, `reset-password/page.tsx`, `step-security.tsx` | ⬜ |
| 013 | Upload fichier non clavier → `tabIndex={0}` + `onKeyDown` | `kyc/page.tsx`, `broker/page.tsx` | ⬜ |
| 014 | Révocation session sans confirmation → Dialog | `session-list.tsx:67` | ⬜ |
| 015 | Progressbar sans ARIA → `role="progressbar"` + `aria-valuenow` | `verification/page.tsx`, `admin/page.tsx` | ⬜ |

## 🟡 Medium (10)

| # | Issue | Fichier | Status |
|---|-------|---------|--------|
| 016 | Erreurs sans `role="alert"` | Toutes les pages | ⬜ |
| 017 | Contenu non centré → ajouter `mx-auto` | `subscription`, `notifications`, `profile` | ⬜ |
| 018 | Code dupliqué steps vs pages standalone | `step-kyc.tsx`, `step-broker.tsx` | ⬜ |
| 019 | Sélecteurs natifs → design system Select | `admin/page.tsx`, `onboarding/profile` | ⬜ |
| 020 | Validation uniquement à la soumission → `onBlur` | Tous les formulaires | ⬜ |
| 022 | alert()/confirm() natifs → toasts + Dialogs stylisés | `admin/page.tsx`, `signal-editor.tsx` | ⬜ |
| 023 | Recherche sans navigation clavier → pattern combobox | `admin-header.tsx:166` | ⬜ |
| 024 | Cloche notification admin non fonctionnelle | `admin-header.tsx:114` | ⬜ |
| 025 | Barre de progression fausse → spinner ou vrai suivi | `kyc/page.tsx:72` | ⬜ |

---

## Plan d'action

### Sprint 1 — Sécurité & Accessibilité critique
- [ ] #011 XSS — DOMPurify sur markdown preview
- [ ] #007 Regex OTP — corriger `/\D/g`
- [ ] #001 Dashboard redirect — `redirect("/login")`
- [ ] #021 Onboarding blank page — état error
- [ ] #002 Verification spinner infini — état error
- [ ] #003 Notifications keyboard — `role="button"`
- [ ] #004 Profile labels — `htmlFor`/`id`

### Sprint 2 — Mobile & Touch
- [ ] #005 Admin mobile header
- [ ] #006 Touch targets — `size-9`
- [ ] #012 Password toggle keyboard
- [ ] #013 File upload keyboard

### Sprint 3 — Error Handling
- [ ] #009 Admin error states
- [ ] #016 `role="alert"` sur toutes les erreurs
- [ ] #017 `mx-auto` sur les pages
- [ ] #010 Confirmation actions destructrices
- [ ] #014 Session revoke confirmation

### Sprint 4 — UX & Polish
- [ ] #008 Modal accessibility
- [ ] #015 Progressbar ARIA
- [ ] #018 Code duplication steps
- [ ] #019 Design system Select
- [ ] #020 Validation inline
- [ ] #022.alert()/confirm() → toasts
- [ ] #023 Recherche keyboard nav
- [ ] #024 Cloche notification
- [ ] #025 Fake progress bar

---

## Total : 25 issues
- Critical : 8
- High : 7
- Medium : 10

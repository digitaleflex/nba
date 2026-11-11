# UI Guidelines

> **Version:** 1.0

## Principles

- **Clarity over creativity** — users should never guess
- **Consistency** — same patterns everywhere
- **Feedback** — every action has a response
- **Progressive disclosure** — show what's needed, hide the rest

## Layout

- Dashboard layout: sidebar navigation + content area
- Responsive: sidebar collapses on mobile
- Max content width: 1280px

## States

Every data component handles these states:

| State | Display |
|-------|---------|
| Loading | Skeleton component |
| Empty | Empty state with illustration + CTA |
| Error | Error message with retry button |
| Success | Success feedback |
| Data | Normal rendering |

## Accessibility

See `docs/08-ui/ACCESSIBILITY.md`

## Voice and tone

**Vouvoiement everywhere** (member and admin), one name per feature, accents required.
Rules, vocabulary and the list of strings to rewrite: `docs/08-ui/GLOSSAIRE.md`.

## Minimum standards (enforced by `scripts/audit/a11y.cjs`)

- Text: 12 px minimum; contrast 4.5:1 for text (never `text-muted-foreground/50` on text).
- Touch targets: 44 px on mobile (24 px is the WCAG 2.5.8 floor).
- Every icon-only button has an `aria-label`; every field has a visible label.
- Colours come from semantic tokens, never from raw palettes (`blue-600`, `emerald-500`…).
- Raw enums (`PAYMENT_PENDING`, `SUPER_ADMIN`) are never displayed: use `src/lib/labels.ts`.
- Confirmations go through `useConfirm()`, never the native `confirm()`.


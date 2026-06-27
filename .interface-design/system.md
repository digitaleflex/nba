# Design System — NeverBrokeAgain

## Direction

**Personality:** Light Premium Finance (Sophistication & Trust + Data & Analysis)
**Foundation:** Cool-neutral (hue 260) — slate/bleu finance
**Depth:** Subtle shadows (premium multi-layer)
**Default:** Light mode (dark mode support via `.dark` class)

## Tokens

### Colors

**Base:**
- Background: `#fafbfc` (light cool canvas)
- Card/Popover: `#ffffff`
- Foreground: `oklch(0.15 0.01 260)` — near-black with cool tint

**Primary (Navy):**
- `oklch(0.35 0.06 260)` — bleu finance profond
- Foreground: `#ffffff`

**Secondary:**
- `oklch(0.55 0.03 260)` — bleu-gris
- Foreground: `#ffffff`

**Muted:**
- `oklch(0.96 0.005 260)` — gris très clair
- Foreground: `oklch(0.55 0.01 260)`

**Accent:**
- `oklch(0.45 0.08 260)` — navy moyen
- Foreground: `#ffffff`

**Semantic:**
- Destructive: `oklch(0.55 0.2 25)` — rouge pour pertes
- Success: `oklch(0.6 0.18 155)` — vert pour gains
- Warning: `oklch(0.75 0.15 85)` — ambre pour alertes

**Borders:**
- Border: `oklch(0 0 0 / 0.08)`
- Input: `oklch(0 0 0 / 0.1)`
- Ring: `oklch(0.45 0.08 260)` — focus ring

### Typography

- **Font:** Geist (variable) + Geist Mono (data)
- **Scale:** Major Third (1.250)
- **Body:** 14px (dense UI)
- **Weights:** normal 400, medium 500, semibold 600, bold 700

### Spacing

- **Base:** 4px
- **Scale:** 0.5(2), 1(4), 1.5(6), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64)

### Radius

- **xs:** 4px (badges, small elements)
- **sm:** 6px
- **md:** 8px (cards, buttons)
- **lg:** 12px (dialogs)
- **xl:** 16px (large cards)

### Shadows

- **sm:** `0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)` — cards
- **md:** `0 4px 12px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.04)`
- **lg:** `0 8px 24px oklch(0 0 0 / 0.08), 0 4px 8px oklch(0 0 0 / 0.04)` — dropdowns, popovers
- **xl:** `0 12px 48px oklch(0 0 0 / 0.1), 0 6px 12px oklch(0 0 0 / 0.06)` — modals

## Patterns

- **Cards:** `bg-card shadow-sm rounded-xl` — toujours fond blanc, ombre subtile
- **Dropdowns/Popovers:** `bg-popover shadow-lg rounded-lg` — fond blanc, ombre prononcée
- **Form labels:** `text-sm font-medium text-foreground` — au-dessus du champ
- **Erreurs:** pastille colorée `size-1.5 rounded-full bg-destructive` + texte
- **Dark mode:** `.dark` class — surfaces plus sombres, borders blanches, chroma réduit

## Decisions

- **2026-06-26:** Direction Light Premium Finance choisie (vs Dark). Bleu navy comme primary, pas d'orange, pas de couleurs chaudes.
- **2026-06-26:** Shadows system remplace `ring-1` pour les cartes et overlays — plus premium.
- **2026-06-26:** Geist conservé (déjà dans le projet) — typo technique, parfaite pour la finance.
- **2026-06-26:** Tokens définis dans `globals.css` via `@theme` Tailwind v4 — pas de tailwind.config.ts.

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

**Named tokens (use these instead of raw values):**
| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon-to-text |
| `space-2` | 8px | Inline element gaps, badge padding |
| `space-3` | 12px | Form field gaps, input padding-x |
| `space-4` | 16px | Standard padding, card internal |
| `space-5` | 20px | Card padding, section gaps |
| `space-6` | 24px | Section separators |
| `space-8` | 32px | Large gaps, page section margins |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page-level spacing |

**Component spacing:**
| Token | Value | Usage |
|-------|-------|-------|
| `space-component-padding` | 16px | Cards, panels, containers |
| `space-section-gap` | 24px | Between major UI sections |
| `space-element-gap` | 12px | Between related elements |
| `space-inline-gap` | 8px | Text + icon, chips, tags |

### Radius

- **xs:** 4px (badges, small elements)
- **sm:** 6px
- **md:** 8px (cards, buttons)
- **lg:** 12px (dialogs)
- **xl:** 16px (large cards)
- **2xl:** 20px (special containers)

### Elevation (Shadows & Glass)

**Matrice décisionnelle — quel niveau choisir ?**

| Level | Token | Usage | Contexte |
|-------|-------|-------|----------|
| Flat | (none) | Inline elements, table rows, form fields | Éléments qui "vivent" dans un container |
| Subtle | `shadow-xs` | Badges, tags, small chips | Éléments quasi-flat mais besoin d'un léger lift |
| Base | `shadow-sm` | Cards, small panels | Conteneurs principaux, contenus isolés |
| Elevated | `shadow-md` | Active cards, selected items | Éléments qui "sortent" du flow |
| Floating | `shadow-lg` | Dropdowns, menus, tooltips, popovers | Éléments au-dessus du contenu |
| Modal | `shadow-xl` | Dialogs, modals, drawers | Overlays qui prennent le focus |

**Glass (backdrop-blur) — quand utiliser :**
| Token | Usage | Contexte |
|-------|-------|----------|
| `glass` | Subtle overlay | Navbars sticky, cards with depth, sidebars |
| `glass-strong` | Heavy overlay | Modal backdrops, full-screen overlays |

**Règles :**
- **Jamais** glass + shadow ensemble sur le même élément — choisir l'un ou l'autre
- Les popovers/dropdowns utilisent `shadow-lg` (pas glass) pour garder la lisibilité
- Les modals utilisent `shadow-xl` + backdrop sombre (pas glass) pour le focus

### Interactive States

**Hover (desktop pointer):**
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `hover:bg-muted` | +2% lightness | -5% lightness | Backgrounds hover |
| `hover:shadow-md` | upgrade 1 level | upgrade 1 level | Cards, buttons |
| `hover:border-primary` | border primary | border primary | Interactive cards |

**Focus (keyboard navigation):**
| Token | Usage |
|-------|-------|
| `ring-2 ring-ring ring-offset-2` | Primary focus indicator |
| `outline-none` | Remove default outline |

**Active / Pressed:**
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `active:scale-[0.98]` | scale down | scale down | Buttons, clickables |
| `active:bg-primary/90` | darken 10% | lighten 10% | Buttons pressed |

**Disabled:**
| Token | Usage |
|-------|-------|
| `opacity-50 cursor-not-allowed` | Disabled state |
| `pointer-events-none` | Non-interactive |
| `aria-disabled="true"` | Accessible disabled |

**Selection:**
| Token | Usage |
|-------|-------|
| `bg-primary/10 text-primary` | Selected item background |
| `border-l-2 border-l-primary` | Selected nav item indicator |

## Patterns

- **Cards:** `bg-card shadow-sm rounded-xl` — toujours fond blanc, ombre subtile
- **Dropdowns/Popovers:** `bg-popover shadow-lg rounded-lg` — fond blanc, ombre prononcée
- **Form labels:** `text-sm font-medium text-foreground` — au-dessus du champ
- **Erreurs:** pastille colorée `size-1.5 rounded-full bg-destructive` + texte
- **Dark mode:** `.dark` class — surfaces plus sombres, borders blanches, chroma réduit

## Noise Texture — Décision

**Status:** Retiré du design system.

**Raison:** Le noise texture à 0.015 d'opacité est imperceptible sur la plupart des écrans et n'ajoute pas de valeur visuelle mesurable. Le SVG inline alourdit le CSS sans bénéfice UX.

**Alternative si besoin de texture:** Utiliser un motif CSS `repeating-linear-gradient` plus léger ou une image PNG tiny, ou simplement se fier aux ombres pour créer de la profondeur.

## Decisions

- **2026-06-26:** Direction Light Premium Finance choisie (vs Dark). Bleu navy comme primary, pas d'orange, pas de couleurs chaudes.
- **2026-06-26:** Shadows system remplace `ring-1` pour les cartes et overlays — plus premium.
- **2026-06-26:** Geist conservé (déjà dans le projet) — typo technique, parfaite pour la finance.
- **2026-06-26:** Tokens définis dans `globals.css` via `@theme` Tailwind v4 — pas de tailwind.config.ts.
- **2026-07-03:** Ajout des spacing tokens nommés pour cohérence.
- **2026-07-03:** Matrice d'elevation documentée (shadow + glass).
- **2026-07-03:** Tokens d'états interactifs (hover, focus, active, disabled).
- **2026-07-03:** Noise texture retiré — pas assez perceptible pour justifier la complexité.

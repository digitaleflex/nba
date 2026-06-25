# ADR-025 — Design System & UI Architecture

> **Status:** Accepted
> **Date:** June 2026

---

# Context

The NBA platform must feel like a premium financial product. The interface must inspire trust, professionalism, speed, precision, and simplicity.

In 2026, many AI-generated SaaS applications look identical: default Shadcn UI cards, inconsistent spacing, default colors, and generic dashboards. NBA must be the opposite.

The UI must not be treated as a graphic detail but as a central element of the product. Users should never perceive the interface as AI-generated. Every screen must appear handcrafted.

A standalone internal Design System package is required to enforce visual identity, prevent style fragmentation, and ensure long-term consistency as the product evolves.

---

# Decision

The project adopts a **custom internal Design System** built on top of Shadcn UI.

## Architecture

```
packages/design-system/
├── components/      # Custom components (built on Radix + Shadcn)
├── hooks/           # Reusable hooks
├── icons/           # Lucide-based custom icon set
├── providers/       # Theme providers (next-themes)
├── theme/           # Colors, typography, spacing tokens
├── tokens/          # Design tokens (CSS variables)
├── styles/          # Global styles, animations
├── animations/      # Motion animations
└── index.ts         # Public API
```

All application UI depends on this single Design System. Shadcn UI becomes a technical foundation, not the visual identity.

## Component Count

Target: **100 to 150 reusable components** organized into:

```
components/
├── ui/              # Primitives (button, input, card, dialog)
├── shared/          # App-specific shared (data-table, empty-state)
├── dashboard/       # Dashboard-specific widgets
├── forms/           # Form patterns
├── signals/         # Signal-specific components
├── members/         # Member management components
├── admin/           # Admin panel components
├── charts/          # Recharts-based charts
└── layouts/         # Layout components (sidebar, navbar)
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Base UI | Shadcn UI (Radix primitives) |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Virtualization | TanStack Virtual |
| Charts | Recharts |
| Animation | Motion (Framer Motion) |
| Icons | Lucide |
| Toasts | Sonner |
| Calendar | React Day Picker |
| Command Palette | CMDK |
| Carousel | Embla (if needed) |
| Themes | next-themes |
| Email | React Email |

## Animation Philosophy

Animations are used only to improve understanding, never for decoration.

Duration constraints:
- 150ms (micro-interactions)
- 200ms (standard)
- 250ms (complex)

Never: 600ms, 800ms, 1s.

## Design Tokens

### Colors

```css
--background: #09090B
--primary: #C6FF3B
--danger: #EF4444
--success: #22C55E
--warning: #F59E0B
--border: #27272A
```

### Typography

Primary font: **Geist** or **Inter**. No default system fonts.

### Spacing Grid

Strict spacing scale: 4, 8, 12, 16, 20, 24, 32, 48, 64.

Values like 17, 23, 41 are prohibited.

## Dashboard Inspiration

Visual reference: Linear, Vercel, Stripe, Notion, GitHub.

Not: AdminLTE, Metronic, CoreUI.

## Tables

- Instant search
- Filters
- Configurable columns
- Pagination
- Virtualization for long lists
- CSV export

## Forms

- Instant validation
- Clear error messages
- Progress indication
- Autosave where relevant

## Responsive

Desktop First → Tablet → Mobile.

## Accessibility

Target: WCAG AA minimum.

## Performance Targets

| Metric | Target |
|--------|--------|
| First Load | < 2 seconds |
| Navigation | Instant |
| Animation | 60 FPS |
| Lighthouse | 95+ |

---

# AI Constraints

AI agents are **prohibited** from:
- Using raw Shadcn UI components without adaptation
- Copying examples from Shadcn UI documentation
- Creating multiple variants of the same component without validation
- Introducing multiple styles of buttons, tables, or forms

AI agents **must**:
- Use internal project components before creating new ones
- Respect design tokens (colors, typography, spacing, radii, shadows)
- Document every new component in the Design System

---

# Reasons

- Prevents the "AI-generated" visual identity
- Single source of truth for all UI
- Consistent visual language across 17 modules
- Easier theming (dark/light mode)
- Faster development with predefined patterns
- Easier onboarding for new developers
- Future-proof extraction to a separate npm package if needed

---

# Alternatives Considered

## Raw Shadcn UI Without Custom Package

Rejected.

Reason: Every AI agent would import Shadcn components directly, creating visual drift, inconsistent variants, and an "AI-generated" look. No central control over the visual identity.

## External Design System (Radix, Park UI)

Rejected.

Reason: External systems either lack the specific visual identity needed or add unnecessary dependencies. Building on Shadcn + Radix provides the right balance of control and speed.

## CSS Framework Only (Tailwind)

Rejected.

Reason: Without component abstractions, every page reinvents the same patterns. A component library enforces consistency.

---

# Consequences

## Positive

- Distinct visual identity
- Consistent UI across all modules
- Faster development with predefined components
- Centralized theming
- Better developer experience
- Higher quality bar for UI

## Negative

- Initial investment in building the Design System
- Must maintain the package alongside the application
- Learning curve for the custom component API

## Neutral

- Design System lives in `packages/design-system/`
- Shadcn UI remains a dependency but is not directly imported by modules
- Only the Design System imports Shadcn UI

---

# Architectural Rules

All application UI must import from `@nba/design-system`.

Modules must not import Shadcn UI, Radix, or Lucide directly.

New components must be added to the Design System, not scattered across modules.

Component variants must be approved before creation.

---

# Related Documents

- DESIGN_SYSTEM.md
- UI_GUIDELINES.md
- COMPONENT_LIBRARY.md
- BRAND_GUIDELINES.md
- PROJECT_STRUCTURE.md

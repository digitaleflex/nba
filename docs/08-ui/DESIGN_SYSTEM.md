# Design System

> **Version:** 2.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Philosophy

The NeverBrokeAgain platform must feel like a premium financial product.

The interface must inspire:

- **Trust** — clean, predictable, reliable
- **Professionalism** — precise spacing, consistent typography, deliberate color
- **Speed** — instant feedback, smooth transitions, 60 FPS
- **Precision** — every pixel has a reason
- **Simplicity** — complexity is hidden, not removed

Users should never perceive the interface as AI-generated.

Every screen must appear handcrafted.

---

# Architecture

```
packages/design-system/
├── components/      # 100-150 reusable components
├── hooks/           # Reusable hooks
├── icons/           # Lucide-based icon set
├── providers/       # Theme providers
├── theme/           # Design tokens
├── tokens/          # CSS custom properties
├── styles/          # Global styles
├── animations/      # Motion animations
└── index.ts         # Public API
```

All application UI imports from `@nba/design-system`. Modules never import Shadcn, Radix, or Lucide directly.

---

# Technology Stack

| Layer | Technology |
|-------|-----------|
| Primitives | Radix UI via Shadcn |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Virtualization | TanStack Virtual |
| Charts | Recharts |
| Animation | Motion |
| Icons | Lucide |
| Toasts | Sonner |
| Calendar | React Day Picker |
| Command Palette | CMDK |
| Themes | next-themes |
| Email | React Email |

---

# Design Tokens

## Colors

### Dark Theme

```css
:root {
  --background: #09090B;
  --foreground: #FAFAFA;
  --primary: #C6FF3B;
  --primary-foreground: #09090B;
  --secondary: #18181B;
  --secondary-foreground: #A1A1AA;
  --muted: #18181B;
  --muted-foreground: #A1A1AA;
  --accent: #27272A;
  --accent-foreground: #FAFAFA;
  --danger: #EF4444;
  --danger-foreground: #FAFAFA;
  --success: #22C55E;
  --warning: #F59E0B;
  --border: #27272A;
  --ring: #C6FF3B;
  --radius: 0.5rem;
}
```

### Light Theme

```css
.light {
  --background: #FFFFFF;
  --foreground: #09090B;
  --primary: #7C3AED;
  --primary-foreground: #FFFFFF;
  --secondary: #F4F4F5;
  --secondary-foreground: #18181B;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --accent: #F4F4F5;
  --accent-foreground: #18181B;
  --danger: #EF4444;
  --danger-foreground: #FFFFFF;
  --success: #22C55E;
  --warning: #F59E0B;
  --border: #E4E4E7;
  --ring: #7C3AED;
}
```

### Semantic Usage

| Token | Usage |
|-------|-------|
| `--background` | Page, cards, modals |
| `--foreground` | Body text, headings |
| `--primary` | CTAs, active states, links |
| `--secondary` | Subtle backgrounds, hover states |
| `--muted` | Disabled, placeholders |
| `--accent` | Highlight, selected state |
| `--danger` | Errors, destructive actions |
| `--success` | Approved, verified, positive |
| `--warning` | Pending, attention |
| `--border` | Dividers, card borders, inputs |

---

## Typography

### Primary Font

**Geist** (preferred) or **Inter** (fallback).

```css
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Weight

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Height

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## Spacing

Strict 4px grid. **Values outside this grid are prohibited.**

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## Radii

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Pill */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## Animation

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-150` | 150ms | Micro-interactions, hover, focus |
| `--duration-200` | 200ms | Standard transitions |
| `--duration-250` | 250ms | Complex animations, modals |

Durations outside this range are prohibited.

### Easing

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

---

# Component Library

## Components by Category

### UI Primitives (components/ui/)

| Component | Status | Description |
|-----------|--------|-------------|
| Button | ✅ | Variants: primary, secondary, ghost, danger, link |
| Input | ✅ | Text, email, password, search |
| Select | ✅ | Native select with custom styling |
| Checkbox | ✅ | With label |
| Radio Group | ✅ | With label |
| Switch | ✅ | Toggle |
| Card | ✅ | With header, content, footer slots |
| Dialog | ✅ | Modal dialog |
| Sheet | ✅ | Slide-in panel |
| Dropdown Menu | ✅ | Context menus |
| Popover | ✅ | Floating panels |
| Tooltip | ✅ | Hover tooltips |
| Avatar | ✅ | User avatars |
| Badge | ✅ | Status badges |
| Tabs | ✅ | Tab navigation |
| Table | ✅ | Base table primitive |

### Shared Components (components/shared/)

| Component | Status | Description |
|-----------|--------|-------------|
| DataTable | 🟡 | TanStack Table wrapper |
| EmptyState | ✅ | Empty state with icon + CTA |
| ErrorState | ✅ | Error display with retry |
| LoadingSpinner | ✅ | Loading indicator |
| Skeleton | ✅ | Skeleton loading |
| ConfirmDialog | ✅ | Confirmation dialog |
| SearchInput | ✅ | Debounced search |
| Pagination | ✅ | Page navigation |
| StatusBadge | ✅ | Colored status indicator |
| PageHeader | ✅ | Page title + actions |
| StatCard | ✅ | Metric display card |
| ActivityFeed | 🟡 | Activity timeline |

### Dashboard Components (components/dashboard/)

| Component | Status | Description |
|-----------|--------|-------------|
| DashboardLayout | 🟡 | Main dashboard shell |
| Widget | ✅ | Dashboard widget wrapper |
| MetricCard | ✅ | KPI card with trend |
| ChartContainer | 🟡 | Chart wrapper |
| RecentActivity | 🟡 | Activity widget |
| QuickActions | 🟡 | Action shortcut widget |

### Form Components (components/forms/)

| Component | Status | Description |
|-----------|--------|-------------|
| FormField | ✅ | Label + input + error |
| FormSection | ✅ | Grouped fields |
| FormActions | ✅ | Submit + cancel buttons |
| FileUpload | 🟡 | Drag-and-drop upload |
| MultiSelect | 🟡 | Tag selector |
| DatePicker | 🟡 | Date selection |

---

# Layout

## Page Structure

```
PageHeader (title + actions)
    │
    ▼
Content Area
    │
    ├── Cards
    ├── Tables
    ├── Forms
    └── Widgets
```

## Dashboard Structure

```
Sidebar (navigation)
    │
    └── Main Content
            │
            ├── TopBar (breadcrumb, search, user menu)
            │
            ├── Widget Grid
            │
            └── Detail Area
```

---

# Component Design Rules

## Card Anatomy

```
┌────────────────────────┐
│ Icon      Title   Menu │  ← CardHeader
├────────────────────────┤
│                        │
│   Content              │  ← CardContent
│                        │
├────────────────────────┤
│ Actions                │  ← CardFooter
└────────────────────────┘
```

## Table Anatomy

```
┌────────────────────────────────┐
│ Search    Filters    Export    │  ← Toolbar
├────────────────────────────────┤
│ Header │ Header │ Header       │  ← TableHeader
├────────────────────────────────┤
│ Cell   │ Cell   │ Cell         │  ← TableRow
│ Cell   │ Cell   │ Cell         │
├────────────────────────────────┤
│ Showing 1-10 of 100    Pages   │  ← Pagination
└────────────────────────────────┘
```

## Form Anatomy

```
┌────────────────────────┐
│ Section Title          │  ← FormSection
│ Description            │
├────────────────────────┤
│ Label                  │
│ [Input              ]  │  ← FormField
│ Error message          │
├────────────────────────┤
│ Label                  │
│ [Input              ]  │
├────────────────────────┤
│ [Cancel]    [Submit]   │  ← FormActions
└────────────────────────┘
```

---

# State Patterns

Every component handles these states:

| State | Pattern |
|-------|---------|
| **Loading** | Skeleton or spinner |
| **Empty** | Illustration + heading + description + optional CTA |
| **Error** | Error icon + message + retry button |
| **Success** | Success feedback (toast, inline) |
| **Data** | Normal rendering |

---

# Accessibility

Target: **WCAG AA minimum**.

Requirements:
- All interactive elements keyboard accessible
- Visible focus indicators (`:focus-visible`)
- Proper heading hierarchy (h1 → h2 → h3)
- Labels associated with inputs
- Error messages linked via `aria-describedby`
- Color not used as the only differentiator
- Sufficient color contrast

---

# Performance

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2s |
| Time to Interactive | < 2.5s |
| Lighthouse Performance | 95+ |
| Cumulative Layout Shift | < 0.1 |

Practices:
- Dynamic imports for heavy components
- Image optimization via Next.js Image
- Bundle analysis in CI
- No layout shifts from dynamic content

---

# AI Agent Rules

## Prohibited

- Using raw Shadcn UI components without Design System adaptation
- Copying examples from Shadcn UI documentation
- Creating multiple variants of the same component
- Introducing new button, table, or form styles
- Using spacing values outside the 4px grid
- Using animation durations outside 150-250ms
- Adding components to modules instead of the Design System

## Required

- Use `@nba/design-system` components before creating new ones
- Respect all design tokens
- Document every new component
- Follow the component anatomy patterns
- Handle all component states (loading, empty, error, data)

---

# Component Creation Checklist

Before creating a new component:

- [ ] Does a similar component already exist in the Design System?
- [ ] Does it follow the design tokens (colors, spacing, typography)?
- [ ] Does it handle loading, empty, error, and data states?
- [ ] Is it keyboard accessible?
- [ ] Does it have proper focus indicators?
- [ ] Is it documented?
- [ ] Is it a single responsibility?

---

# Related Documents

- ADR-025 — Design System & UI Architecture
- BRAND_GUIDELINES.md
- COMPONENT_LIBRARY.md
- UI_GUIDELINES.md
- ACCESSIBILITY.md

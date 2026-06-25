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

# Accessibility

> **Version:** 1.0

## Standards

- WCAG 2.1 AA compliance target
- Semantic HTML throughout
- Keyboard navigation support

## Requirements

### Semantic HTML

- Use `<nav>`, `<main>`, `<section>`, `<article>` appropriately
- Heading hierarchy: h1 → h2 → h3 (no skipping)
- Buttons are `<button>`, links are `<a>`

### Keyboard

- All interactive elements are keyboard accessible
- Visible focus indicators
- Logical tab order

### ARIA

- Use ARIA labels when visual labels are absent
- Use `aria-live` for dynamic content updates
- Use `aria-expanded` for expandable elements

### Forms

- Labels associated with inputs
- Error messages linked to inputs via `aria-describedby`
- Required fields indicated visually and via `aria-required`

# Dependency Graph

> **Version:** 1.0

## Module Dependencies

```
app/ (pages, layouts)
  │
  ├── components/ (shared UI)
  │     │
  │     └── lib/ (utils, config)
  │
  └── modules/*/components/
        │
        └── modules/*/services/
              │
              ├── modules/*/repositories/
              │     │
              │     └── lib/db.ts (Prisma)
              │
              ├── services/ (shared services)
              │     │
              │     └── repositories/
              │
              └── lib/ (errors, types, config)
```

## Allowed Cross-Module Dependencies

| From | Can Import |
|------|-----------|
| Module A services | Module B services (not repositories) |
| Module A components | Module B services (via server actions) |

## Prohibited Dependencies

- Modules must not import other module components
- Modules must not import other module repositories
- Services must not import from app/ or components/
- Repositories must not import from services/

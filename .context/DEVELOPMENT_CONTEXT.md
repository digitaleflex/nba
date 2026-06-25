# Development Context

> For AI agents. Concise development summary.

## Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
```

## Database
```bash
pnpm db:dev       # prisma migrate dev
pnpm db:deploy    # prisma migrate deploy
pnpm db:generate  # prisma generate
pnpm db:seed      # Run seed script
```

## File Creation Order
1. Types + constants → 2. Validators (Zod) → 3. Repositories → 4. Services → 5. Components → 6. Pages

## Import Rules
- Services import from repositories
- Server Actions import from services
- Pages import from services
- Components import from services (not repositories)
- Only repositories import Prisma
- Lib imports external packages only

## Naming
- Files: kebab-case (dirs), PascalCase (components), camelCase (services)
- Variables: camelCase, booleans with is/has/can prefix
- Constants: UPPER_SNAKE_CASE

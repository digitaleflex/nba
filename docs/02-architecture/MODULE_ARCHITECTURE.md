# Module Architecture

> **Version:** 1.0

## Standard Module Template

```
modules/<name>/
├── components/       # UI components (Server Components by default)
├── services/         # Business logic (one function per file)
├── repositories/     # Data access (Prisma queries)
├── validators/       # Zod schemas
├── types/            # TypeScript types + interfaces
├── hooks/            # React hooks (client-side only)
└── constants/        # Module-specific constants
```

## Communication Between Modules

Modules communicate through their service layer only.

```typescript
// ✅ Correct — Module A calls Module B's service
import { getMember } from "@/modules/members/services/get-member"

// ❌ Incorrect — Module A accesses Module B's repository
import { memberRepository } from "@/modules/members/repositories/member-repository"
```

## Module Lifecycle

1. Define types
2. Define Zod validators
3. Implement repository
4. Implement services
5. Implement components
6. Wire up pages in app/

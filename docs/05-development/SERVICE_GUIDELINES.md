# Service Guidelines

> **Version:** 1.0

## Purpose

Services contain all business logic. They orchestrate repositories and enforce business rules.

## Structure

```typescript
// modules/members/services/get-member.ts
import { memberRepository } from "../repositories/member-repository"
import { requireAuth, requireRole } from "@/lib/auth"
import { NotFoundError } from "@/lib/errors/not-found-error"
import type { Session } from "@/lib/types"

export async function getMember(id: string, session: Session) {
  await requireAuth(session)
  requireRole(session, ["ADMIN", "SUPER_ADMIN"])

  const member = await memberRepository.findById(id)
  if (!member) throw new NotFoundError("Member not found")

  return member
}
```

## Rules

- One function per file
- Named exports
- Check authorization at the start
- Validate input before processing
- Emit audit events for critical operations
- Throw typed errors for business rule violations

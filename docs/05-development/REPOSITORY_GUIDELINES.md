# Repository Guidelines

> **Version:** 1.0

## Purpose

Repositories encapsulate data access. They are the only layer that interacts with Prisma.

## Structure

```typescript
// modules/members/repositories/member-repository.ts
import { prisma } from "@/lib/db"
import type { Member } from "../types"

export const memberRepository = {
  async findById(id: string): Promise<Member | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })
  },

  async findMany(filter: MemberFilter): Promise<Member[]> {
    return prisma.user.findMany({
      where: { deletedAt: null, ...filter },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    })
  },

  async create(data: CreateMemberInput): Promise<Member> {
    return prisma.user.create({ data })
  },
}
```

## Rules

- No business logic in repositories
- No authorization in repositories
- No validation in repositories
- Returns plain objects (not Prisma model instances)
- One file per entity

# Component Guidelines

> **Version:** 1.0

## Server Components (Default)

```typescript
// Server Component — no "use client"
import { getMembers } from "@/modules/members/services/get-members"
import { MemberList } from "@/modules/members/components/member-list"

export default async function MembersPage() {
  const members = await getMembers()
  return <MemberList members={members} />
}
```

## Client Components (When Needed)

```typescript
"use client"

import { useState } from "react"
import { createMember } from "../services/create-member"

export function MemberForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    await createMember(formData)
    setIsSubmitting(false)
  }

  return <form action={handleSubmit}>...</form>
}
```

## Rules

- Server Components by default
- Add `"use client"` only when needed (state, effects, browser APIs)
- One component per file
- Props interface named `ComponentNameProps`
- Destructure props in function signature

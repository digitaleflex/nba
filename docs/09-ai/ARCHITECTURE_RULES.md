# Architecture Rules for AI

> **Version:** 1.0

## Binding Rules

```
Rule                   │ Layer      │ Violation = Revert
───────────────────────┼────────────┼────────────────────
Business logic         │ Services   │ Component or Action
Prisma access          │ Repos      │ Service or Component
Input validation       │ Validators │ Any unvalidated input
Authorization check    │ Services   │ Missing check
Audit events           │ Services   │ Missing for critical ops
Module boundaries      │ All        │ Cross-module component import
```

## Allowed Patterns

✅ Service → Repository → Prisma
✅ Server Action → Service
✅ Component → Service (via Server Action)
✅ Service → Service (cross-module)

## Forbidden Patterns

❌ Component → Prisma
❌ Server Action → Repository
❌ Service → Prisma
❌ Module A → Module B Repository
❌ Module A → Module B Component

# Prompt: Create a New Module

Use this prompt to create a complete business module.

## Context
- Read: ENGINEERING_HANDBOOK.md, PROJECT_STRUCTURE.md, CODING_STANDARDS.md
- Read: All ADRs
- Read: BUSINESS_RULES.md
- Read: DATABASE_DESIGN.md

## Module: [Name]

### Structure
```
modules/[name]/
├── types/index.ts
├── constants/index.ts
├── validators/[entity]-schema.ts
├── repositories/[entity]-repository.ts
├── services/get-[entity].ts, create-[entity].ts, etc.
├── components/[Entity]List.tsx, [Entity]Form.tsx, etc.
├── hooks/use-[entity].ts
```

### Requirements
1. Define types first
2. Define Zod validators
3. Implement repository
4. Implement services (business logic, authorization, audit)
5. Implement components
6. Create pages in app/

### Rules
- No business logic in components
- No Prisma in services
- Authorization checked in services
- All input validated with Zod
- Audit events for critical operations

# Prompt: Create a Page

## Context
- Read: ENGINEERING_HANDBOOK.md, PROJECT_STRUCTURE.md
- Read: Relevant module documentation

## Page: [path/page.tsx]

### Structure
```typescript
// Server Component
export default async function Page() {
  // 1. Fetch data from service
  // 2. Render component with data
}
```

### Rules
- Page is a Server Component
- No business logic
- No direct Prisma access
- Call services for data
- Handle loading, empty, error states via loading.tsx, error.tsx

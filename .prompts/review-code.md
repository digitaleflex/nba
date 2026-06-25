# Prompt: Code Review

## Review Checklist

### Architecture
- [ ] Business logic in services, not components
- [ ] Only repositories import Prisma
- [ ] Module boundaries respected
- [ ] No circular dependencies

### Security
- [ ] Authorization checked
- [ ] Input validated with Zod
- [ ] No secrets exposed
- [ ] Audit events for critical operations

### Code Quality
- [ ] TypeScript strict, no `any`
- [ ] Named exports
- [ ] Error handling consistent
- [ ] No `console.log`

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for repositories
- [ ] Edge cases covered

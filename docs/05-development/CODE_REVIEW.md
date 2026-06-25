# Code Review

> **Version:** 1.0

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

### Quality
- [ ] TypeScript strict, no `any`
- [ ] Named exports
- [ ] Error handling consistent
- [ ] No `console.log`

### Tests
- [ ] Unit tests for services
- [ ] Edge cases covered
- [ ] Error paths tested

## Process

1. Reviewer reads the diff
2. Reviewer checks each checklist item
3. Comments are specific and actionable
4. Author addresses all comments
5. Approval after all items pass

# Testing Strategy

> **Version:** 1.0

## Test Types

| Type | Scope | Tools |
|------|-------|-------|
| Unit | Services, validators, utils | Vitest |
| Integration | Repositories + services | Vitest + Testcontainers |
| E2E | Complete user flows | Playwright |

## Structure

```
tests/
├── unit/
│   ├── services/
│   ├── validators/
│   └── utils/
├── integration/
│   ├── repositories/
│   └── services/
└── e2e/
    ├── auth/
    ├── members/
    └── signals/
```

## Coverage Targets

- Services: 90%+
- Validators: 100%
- Repositories: 80%+
- Overall: 80%+

## Rules

- Tests must be idempotent
- Use factories for test data
- Mock external services (Redis, Resend)
- Test error paths, not just happy paths

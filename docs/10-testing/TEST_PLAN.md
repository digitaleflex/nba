# Test Plan

> **Version:** 1.0

## Test Levels

| Level | Scope | Tool | Environment |
|-------|-------|------|-------------|
| Unit | Services, validators, utils | Vitest | Isolated |
| Integration | Repositories, service+repo | Vitest | Test DB |
| E2E | Complete user flows | Playwright | Staging |

## Test Targets

| Module | Unit | Integration | E2E |
|--------|:----:|:-----------:|:---:|
| Auth | ✅ | ✅ | ✅ |
| Members | ✅ | ✅ | ✅ |
| Plans | ✅ | ✅ | ❌ |
| KYC | ✅ | ✅ | ✅ |
| Broker | ✅ | ✅ | ✅ |
| Signals | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ❌ |

## Schedule

- Unit tests: every commit
- Integration tests: every PR
- E2E tests: before release

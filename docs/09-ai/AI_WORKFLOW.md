# AI Workflow

> **Version:** 1.0

## Task Execution Flow

```
1. Receive task
    │
    ▼
2. Read context files (.context/)
    │
    ▼
3. Read relevant documentation
    │
    ▼
4. Plan implementation
    │
    ▼
5. Create files in order (types → validators → repos → services → components → pages)
    │
    ▼
6. Verify with linter and typecheck
    │
    ▼
7. Create tests
    │
    ▼
8. Create pull request
```

## Context Loading

For each task, load only the necessary context:

| Task | Context Files |
|------|---------------|
| New module | PROJECT_CONTEXT + ARCHITECTURE_CONTEXT + BUSINESS_CONTEXT |
| Database change | DATABASE_CONTEXT + relevant ADRs |
| Security fix | SECURITY_CONTEXT + SECURITY.md |
| Bug fix | DEVELOPMENT_CONTEXT + relevant module |

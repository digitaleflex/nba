# Git Workflow

> **Version:** 1.0

## Branching

```
main
  └── feat/nba-XXX-description
  └── fix/nba-XXX-description
  └── chore/nba-XXX-description
```

## Commit Messages

```
feat(auth): add login page
fix(members): handle null email on update
chore(deps): upgrade prisma to 6.0
docs(api): document webhook endpoints
```

## Rules

- Conventional commits
- One logical change per commit
- No WIP commits
- Rebase feature branches before merge
- Squash commits on merge

# Contributing to NeverBrokeAgain

## Getting Started

1. Read [docs/ENGINEERING_HANDBOOK.md](./docs/ENGINEERING_HANDBOOK.md) completely.
2. Read [docs/05-development/AGENT_RUNBOOK.md](./docs/05-development/AGENT_RUNBOOK.md) (local setup, checks, critical rules).
3. Follow the reading path for your role.
4. Set up your development environment: `bash scripts/dev/setup-local.sh`.
5. Pick a task from the backlog (see `docs/audits/CARTE_DES_CHANTIERS_2026-11.md`).

## Development Process

1. Create a feature branch: `feat/nba-XXX-description`
2. Implement following CODING_STANDARDS.md
3. Write tests
4. Run `pnpm lint` and `pnpm typecheck`
5. Create a pull request

## Code Review

All code must be reviewed. Review checklist in `.prompts/review-code.md`.

## Documentation

- Update documentation with every feature
- Follow the existing structure
- Reference relevant ADRs

## Questions

Read the documentation first. If still unclear, open a discussion.

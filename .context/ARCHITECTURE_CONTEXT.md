# Architecture Context

> For AI agents. Concise architecture summary.

## Pattern
Modular Monolith. Single deployment. Isolated modules with clear boundaries.

## Data Flow
```
User → Page (Server Component) → Server Action → Service → Repository → Prisma → PostgreSQL
```

## Layer Rules
- **Presentation** (app/ + components/) — UI only, no business logic, no DB access
- **Application** (services/) — business rules, orchestration, authorization
- **Persistence** (repositories/) — data access only, no business logic
- **Infrastructure** (lib/) — framework config, utilities, no business logic

## Module Independence
- Modules don't import each other's components
- Modules may import each other's services
- Circular dependencies prohibited

## Key ADRs
- 001: Modular Monolith
- 015: Repository Pattern
- 016: Service Layer
- 017: Server Actions
- 024: Database Migration Strategy

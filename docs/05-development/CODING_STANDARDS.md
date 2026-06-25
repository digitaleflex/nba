# Coding Standards

> **Version:** 1.0
> **Status:** Approved
> **Last Updated:** June 2026

---

# Table of Contents

1. General Rules
2. TypeScript Standards
3. Next.js Standards
4. React Standards
5. Component Standards
6. Server Action Standards
7. Service Layer Standards
8. Repository Standards
9. Prisma Standards
10. Better Auth Standards
11. BullMQ Standards
12. Zod Validation Standards
13. Error Handling Standards
14. Security Standards
15. Performance Standards
16. Testing Standards
17. Git Standards
18. Documentation Standards
19. AI Agent Standards
20. Accessibility Standards
21. CSS and Styling Standards
22. Naming Standards
23. File Organization Standards
24. Import Standards
25. Module Standards

---

# 1. General Rules

## 1.1 Language

G-001 The project uses TypeScript exclusively.
G-002 JavaScript files are prohibited.
G-003 TypeScript strict mode is mandatory.
G-004 The `any` type is prohibited everywhere.
G-005 Use `unknown` instead of `any` when the type is genuinely unknown.
G-006 Use `as const` for literal types.
G-007 Use `satisfies` operator instead of type assertions whenever possible.

## 1.2 Formatting

G-008 All code must be formatted with Prettier.
G-009 Single quotes for strings.
G-010 Semicolons are required.
G-011 Trailing commas are required.
G-012 Tab width is 2 spaces.
G-013 Maximum line length is 100 characters.
G-014 Files must end with a single newline.

## 1.3 Linting

G-015 ESLint is mandatory and must pass before commit.
G-016 ESLint rules may not be disabled without explicit team approval.
G-017 `eslint-disable` comments must include a justification.
G-018 No unused variables or imports are allowed.
G-019 No debugger statements in committed code.
G-020 No `console.log` in committed code — use the logging service.

## 1.4 Comments

G-021 Code must be self-documenting. Comments explain WHY, not WHAT.
G-022 Every public function must have a JSDoc comment.
G-023 TODO comments must reference a ticket number: `// TODO: NBA-1234`
G-024 Commented-out code is prohibited.
G-025 License headers are not required.

---

# 2. TypeScript Standards

## 2.1 Type System

TS-001 All function parameters must be typed.
TS-002 All function return types must be explicitly declared.
TS-003 `interface` is preferred over `type` for object shapes.
TS-004 `type` is preferred for unions, intersections, and utility types.
TS-005 Use `interface` for props and state shape in React components.
TS-006 Prefer readonly arrays: `readonly T[]` instead of `T[]`.
TS-007 Use `Record<K, V>` instead of object index signatures.
TS-008 Use `Partial<T>` and `Pick<T, K>` instead of defining subsets manually.
TS-009 Avoid type assertions (`as T`) — use type guards or `satisfies`.
TS-010 Use `z.infer<typeof schema>` to derive types from Zod schemas.

## 2.2 Generics

TS-011 Use generics instead of `any` or type casting.
TS-012 Generic type parameters use single uppercase letters for simple cases.
TS-013 Use descriptive names for complex generics: `TEntity`, `TResponse`.
TS-014 Constrain generics with `extends` instead of leaving them unbounded.

## 2.3 Enums

TS-015 Use `const enum` or union types instead of regular enums.
TS-016 Prefer string literal unions over enums for simple cases.
TS-017 Enum values use UPPER_SNAKE_CASE.

## 2.4 Null and Undefined

TS-018 Prefer `undefined` over `null`.
TS-019 Use `null` only for intentional absence (e.g., database nullable fields).
TS-020 Use optional chaining (`?.`) instead of `&&` for property access.
TS-021 Use nullish coalescing (`??`) instead of `||` for default values.
TS-022 Functions should return `T | undefined` instead of `T | null`.

---

# 3. Next.js Standards

## 3.1 App Router

NX-001 The App Router is mandatory. Pages Router is not used.
NX-002 All pages are Server Components by default.
NX-03 Use `"use client"` only when browser APIs or state are required.
NX-004 Layouts must be Server Components.
NX-005 Loading states use `loading.tsx` — never implement inline loading.
NX-006 Error boundaries use `error.tsx` — never implement inline error states.
NX-007 Not-found states use `not-found.tsx` — never implement inline 404.

## 3.2 Route Handlers

NX-008 Route Handlers are for public APIs, webhooks, and integrations only.
NX-009 All authenticated mutations must use Server Actions.
NX-010 Route Handlers must delegate to service functions.
NX-011 Route Handlers must validate input with Zod.
NX-012 Route Handlers must return typed responses.
NX-013 Webhook handlers must validate signatures.

## 3.3 Server Actions

NX-014 Server Actions must use `"use server"` at the file level.
NX-015 Server Actions must be async functions.
NX-016 Server Actions must validate input with Zod before processing.
NX-017 Server Actions must delegate to services.
NX-018 Server Actions must never contain business logic.
NX-019 Server Actions must handle errors gracefully with user-friendly messages.
NX-020 Server Actions should use `revalidatePath()` or `revalidateTag()` after mutations.
NX-021 Server Actions must check authorization before executing.

## 3.4 Middleware

NX-022 Middleware handles authentication redirects only.
NX-023 Middleware must not contain business logic.
NX-024 Middleware must use Better Auth for session validation.

---

# 4. React Standards

## 4.1 Components

RC-001 All components are functions — class components are prohibited.
RC-002 Components are PascalCase.
RC-003 File name matches component name: `MemberList.tsx` exports `MemberList`.
RC-004 One component per file.
RC-005 Props are defined as an interface with the `Props` suffix.
RC-006 Props are destructured in the function signature.

## 4.2 Hooks

RC-007 Custom hooks start with `use`.
RC-008 Hooks must be pure — no side effects outside `useEffect`.
RC-009 Use `useMemo` and `useCallback` only when profiling shows a benefit.
RC-010 Do not over-optimize with `useMemo` and `useCallback`.
RC-011 Custom hooks return typed objects, not tuples.

## 4.3 State Management

RC-012 Server state is fetched in Server Components — no client-side fetching.
RC-013 Use URL search params for filter and pagination state.
RC-014 Use `useState` for local UI state only.
RC-015 Avoid prop drilling — compose components instead.

## 4.4 Server Components

RC-016 Server Components fetch data directly from services.
RC-017 Server Components render loading states via `loading.tsx`.
RC-018 Server Components must not use hooks or browser APIs.

---

# 5. Component Standards

## 5.1 Structure

CMP-001 Every component has a clear single responsibility.
CMP-002 Components under 20 lines do not need a separate file.
CMP-003 Components over 300 lines must be split.
CMP-004 Complex JSX is extracted into smaller sub-components.
CMP-005 Conditional rendering uses early returns for loading and empty states.

## 5.2 Props

CMP-006 Required props use `required: true` in TypeScript.
CMP-007 Optional props have explicit default values.
CMP-008 Boolean props default to `false`.
CMP-009 Event handlers are prefixed with `on` (e.g., `onSubmit`, `onDelete`).
CMP-010 Render props are named `render*` (e.g., `renderActions`).

## 5.3 Composition

CMP-011 Prefer composition over inheritance.
CMP-012 Use `children` prop for flexible composition.
CMP-013 Use compound components for complex UI elements.

---

# 6. Server Action Standards

## 6.1 Structure

SA-001 Each Server Action is a single exported async function.
SA-022 Server Actions are in `modules/<module>/actions/` if shared.
SA-033 Server Actions may be inlined in the page file if page-specific.

## 6.2 Validation

SA-004 Every Server Action validates input with Zod.
SA-005 Validation errors return typed error objects.
SA-006 Use `safeParse` instead of `parse` to handle errors gracefully.

## 6.3 Authorization

SA-007 Every Server Action checks authorization.
SA-008 Authorization failures return typed errors, not thrown exceptions.
SA-009 Session validation uses Better Auth.

## 6.4 Return Values

SA-010 Return typed response objects.
SA-011 Success responses include the modified data.
SA-012 Error responses include a message and field-level errors.
SA-013 Never return sensitive data in responses.

---

# 7. Service Layer Standards

## 7.1 Structure

SL-001 Each service function is a single exported async function.
SL-002 Service functions are in `modules/<module>/services/`.
SL-003 Service functions are named with a verb prefix: `get`, `create`, `update`, `delete`.

## 7.2 Business Logic

SL-004 All business logic lives in services.
SL-005 Services orchestrate multiple repositories when needed.
SL-006 Services handle transactions across multiple operations.
SL-007 Services emit audit events for critical operations.
SL-008 Services send notifications through the notification service.

## 7.3 Authorization

SL-009 Services check authorization at the start of each public method.
SL-010 Services receive the authenticated user context as a parameter.
SL-011 Authorization logic is never in repositories or components.

## 7.4 Error Handling

SL-012 Services throw typed application errors.
SL-013 Services never catch errors silently.
SL-014 Services use `Result<T>` pattern for expected business errors.
SL-015 Unexpected errors propagate to the global error handler.

---

# 8. Repository Standards

## 8.1 Structure

RP-001 Each repository is a class or object with methods.
RP-002 Repositories are in `modules/<module>/repositories/`.
RP-003 Repository files are named `<entity>-repository.ts`.

## 8.2 Data Access

RP-004 Only repositories may import Prisma.
RP-005 Repositories expose business-oriented methods, not generic CRUD.
RP-006 Repositories return plain objects, not Prisma model instances.
RP-007 Repositories use Prisma transactions for atomic operations.

## 8.3 Query Optimization

RP-008 Repositories use Prisma `include` to prevent N+1 queries.
RP-009 Repositories implement pagination for list queries.
RP-010 Repositories use indexes for sorted and filtered queries.

## 8.4 Purity

RP-011 Repositories contain no business logic.
RP-012 Repositories contain no authorization logic.
RP-013 Repositories contain no validation logic.

---

# 9. Prisma Standards

## 9.1 Schema

PR-001 Schema files use `snake_case` for table and column names.
PR-002 Every table has a UUID `id` primary key.
PR-003 Every table has `created_at` and `updated_at` timestamps.
PR-004 Soft-deleted tables have a `deleted_at` timestamp.
PR-005 Foreign keys are explicitly defined with `@relation`.
PR-006 Enum types use native PostgreSQL enums via `NativeEnum`.

## 9.2 Queries

PR-007 Use `findUnique` instead of `findFirst` when querying by unique field.
PR-008 Use `findMany` for list queries with pagination.
PR-009 Use `include` to eagerly load relations.
PR-010 Use `select` to limit returned fields to what is needed.
PR-011 Use `create` and `update` for single-row mutations.
PR-012 Use `createMany` and `updateMany` for bulk operations.

## 9.3 Transactions

PR-013 Use `$transaction` for operations that span multiple tables.
PR-014 Interactive transactions are for complex workflows only.
PR-015 Keep transactions short — never include network calls inside a transaction.

## 9.4 Migrations

PR-016 All schema changes use Prisma migrations.
PR-017 `prisma db push` is forbidden outside local development experiments.
PR-018 Migration files are immutable once committed.
PR-019 Migration names describe the change: `add_kyc_status_column`.

---

# 10. Better Auth Standards

## 10.1 Configuration

BA-001 Better Auth is configured once in `lib/auth.ts`.
BA-002 The Prisma adapter is mandatory.
BA-003 Session expiration is configured in the Better Auth configuration.
BA-004 All plugins are declared in the configuration.

## 10.2 Authentication

BA-005 All authentication goes through Better Auth.
BA-006 Manual password handling is prohibited.
BA-007 Manual session management is prohibited.
BA-008 Email verification is required for new accounts.
BA-009 Password reset uses the built-in Better Auth flow.

## 10.3 Authorization

BA-010 RBAC is enforced through Better Auth.
BA-011 Role checks use the `requireRole` helper.
BA-012 Permission checks use the `requirePermission` helper.
BA-013 Authorization is checked on every protected operation.

## 10.4 Session

BA-014 Sessions are validated on every request.
BA-015 Session data includes user ID and role.
BA-016 Expired sessions return a 401 error.

---

# 11. BullMQ Standards

## 11.1 Queue Configuration

BQ-001 Queue names are constants in `lib/config/jobs.ts`.
BQ-002 Queue names use kebab-case: `signal-distribution`.
BQ-003 Each queue has a clearly defined job type.

## 11.2 Job Creation

BQ-004 Jobs are created through the queue instance, never Redis directly.
BQ-005 Jobs include a unique job ID for idempotency.
BQ-006 Jobs include all data needed for processing — no lazy loading.
BQ-007 Job data is serialized JSON — no class instances.

## 11.3 Workers

BQ-008 Workers are in `workers/` directory.
BQ-009 Each worker file handles one queue.
BQ-010 Workers import services from modules.
BQ-011 Workers must be idempotent — running a job twice produces the same result.
BQ-012 Workers handle retries with exponential backoff.

## 11.4 Error Handling

BQ-013 Failed jobs are retried with a configured delay.
BQ-014 Permanent failures are logged and alerted.
BQ-015 Jobs that fail after max retries are moved to the dead-letter queue.

---

# 12. Zod Validation Standards

## 12.1 Schema Definition

ZV-001 Every module has Zod schemas in `modules/<module>/validators/`.
ZV-002 Schema files are named `<entity>-schema.ts`.
ZV-03 Export `createSchema`, `updateSchema`, and `filterSchema`.
ZV-004 Use `z.object()` for input validation.

## 12.2 Validation Rules

ZV-005 Every field has explicit type validation.
ZV-006 String fields have min and max length constraints.
ZV-007 Numeric fields have min and max constraints.
ZV-008 Email fields use `z.string().email()`.
ZV-009 URL fields use `z.string().url()`.
ZV-010 Enum fields use `z.nativeEnum()` or `z.enum()`.

## 12.3 Error Messages

ZV-011 Custom error messages are human-readable.
ZV-012 Error messages are in English.
ZV-013 Error messages describe the expected format.

## 12.4 Integration

ZV-014 Use `safeParse` instead of `parse` in services.
ZV-015 Use `z.infer<typeof schema>` to derive TypeScript types.
ZV-016 Validation occurs before business logic.

---

# 13. Error Handling Standards

## 13.1 Error Types

EH-001 Application errors extend `AppError` base class.
EH-002 Error types include `ValidationError`, `AuthError`, `NotFoundError`, `BusinessError`.
EH-003 Each error has a unique code and a user-friendly message.

## 13.2 Error Propagation

EH-004 Services throw typed errors.
EH-005 Server Actions catch errors and return typed responses.
EH-006 Route Handlers catch errors and return HTTP error responses.
EH-007 UI components handle error states from Server Actions.

## 13.3 Logging

EH-008 All errors are logged.
EH-009 Unexpected errors trigger alerts.
EH-010 Stack traces are never exposed to clients.

## 13.4 User-Facing Errors

EH-011 User-facing error messages are clear and actionable.
EH-012 Technical details are never shown to users.
EH-013 Form errors are shown inline near the relevant field.

---

# 14. Security Standards

## 14.1 Authentication

SC-001 All endpoints except public routes require authentication.
SC-002 Better Auth handles all authentication.
SC-003 Passwords are never stored in the database.
SC-004 Password hashing is handled by Better Auth.

## 14.2 Authorization

SC-005 Role checks occur on every protected operation.
SC-006 Frontend visibility checks never replace backend authorization.
SC-007 Permissions are stored in the database, never hardcoded.
SC-008 Authorization is centralized in a dedicated service.

## 14.3 Input Validation

SC-009 All user input is validated with Zod.
SC-010 SQL injection is prevented by Prisma parameterized queries.
SC-011 XSS is prevented by React's built-in escaping.
SC-012 File uploads are validated for type, size, and content.

## 14.4 Data Protection

SC-013 Sensitive data is never logged.
SC-014 API keys and secrets are stored in environment variables.
SC-015 Environment variables are validated at startup.
SC-016 HTTPS is enforced in production.

## 14.5 Rate Limiting

SC-017 Rate limiting is applied to authentication endpoints.
SC-018 Rate limiting is applied to public APIs.
SC-019 Rate limiting uses Redis.

---

# 15. Performance Standards

## 15.1 Database

PF-001 Queries use indexes defined in the schema.
PF-002 N+1 queries are prevented with Prisma `include`.
PF-003 List queries are paginated.
PF-004 Only required fields are selected with Prisma `select`.

## 15.2 Caching

PF-005 Redis caches frequently accessed read data.
PF-006 Cache keys follow a consistent pattern: `module:entity:id`.
PF-007 Cache TTLs are configured per use case.
PF-008 Cache is invalidated on data mutations.

## 15.3 Rendering

PF-009 Server Components are preferred over Client Components.
PF-010 Heavy computations are moved to background workers.
PF-011 Images use Next.js `Image` component with proper sizing.
PF-012 Static pages use static generation where possible.

## 15.4 Bundle Size

PF-013 Dynamic imports are used for heavy components.
PF-014 Large libraries are tree-shaken.
PF-015 No unused imports.

---

# 16. Testing Standards

## 16.1 Test Types

TS-001 Unit tests cover services and validators.
TS-002 Integration tests cover repositories and service+repository workflows.
TS-003 E2E tests cover critical user flows.

## 16.2 Structure

TS-004 Test files mirror the source structure.
TS-005 Test files are named `<source>.test.ts`.
TS-006 Test descriptions describe behavior, not implementation.

## 16.3 Writing Tests

TS-007 Tests are isolated and idempotent.
TS-008 Factories are used for test data creation.
TS-009 Database state is reset between test runs.
TS-010 Mocks are used for external services (Redis, Resend).

## 16.4 Coverage

TS-011 Business logic has 90%+ test coverage.
TS-012 Edge cases are tested.
TS-013 Error paths are tested.

---

# 17. Git Standards

## 17.1 Commits

GT-001 Commit messages follow conventional commits format.
GT-002 Format: `type(scope): description`
GT-003 Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.
GT-004 Commits are atomic — one logical change per commit.
GT-005 No WIP commits — use branches for work in progress.

## 17.2 Branches

GT-006 Branch naming follows: `type/nba-XXX-description`.
GT-007 Main branch is `main`.
GT-008 Feature branches are merged via pull requests.

## 17.3 What Not to Commit

GT-009 `.env.local` files are never committed.
GT-010 `node_modules` is never committed.
GT-011 Build output is never committed.
GT-012 IDE configuration files are never committed.

---

# 18. Documentation Standards

## 18.1 Code Documentation

DC-001 Public functions have JSDoc comments.
DC-002 Complex business logic has inline comments explaining WHY.
DC-003 Documentation references relevant ADRs.

## 18.2 Project Documentation

DC-004 Every feature has corresponding documentation.
DC-005 Documentation is in `docs/` directory.
DC-006 Documentation uses Markdown.
DC-007 Architecture decisions use ADR format.

## 18.3 README

DC-008 `README.md` contains setup instructions.
DC-009 `README.md` lists prerequisites and dependencies.
DC-010 `README.md` describes how to run the project.

---

# 19. AI Agent Standards

## 19.1 Before Writing Code

AI-001 Read PROJECT_STRUCTURE.md before creating files.
AI-002 Read all ADRs before implementing new features.
AI-003 Read BUSINESS_RULES.md before implementing business logic.
AI-004 Read CODING_STANDARDS.md before writing any code.

## 19.2 File Creation

AI-005 Place every file in its correct directory.
AI-006 Follow naming conventions exactly.
AI-007 Create one file at a time — verify before moving on.
AI-008 Respect the module structure.

## 19.3 Code Generation

AI-009 Never modify business rules.
AI-010 Never bypass authorization.
AI-011 Never access Prisma from components or pages.
AI-012 Never put business logic in Server Actions.
AI-013 Always validate input with Zod.
AI-014 Always check authorization.
AI-015 Always emit audit events for critical operations.

## 19.4 Rules AI Must Not Break

AI-016 Do not create new architectural patterns without approval.
AI-017 Do not add dependencies without approval.
AI-018 Do not modify ADRs without approval.
AI-019 Do not create files outside the defined structure.

---

# 20. Accessibility Standards

## 20.1 HTML Semantics

AX-001 Use semantic HTML elements: `<nav>`, `<main>`, `<section>`, `<article>`.
AX-002 Headings use proper hierarchy (h1 -> h2 -> h3).
AX-003 Buttons are `<button>` elements, not `<div>` with click handlers.
AX-04 Forms use proper `<label>` elements.

## 20.2 ARIA

AX-005 Interactive elements have accessible names.
AX-006 Live regions are used for dynamic content.
AX-007 ARIA attributes are used only when semantic HTML is insufficient.

## 20.3 Keyboard Navigation

AX-008 All interactive elements are keyboard accessible.
AX-009 Focus indicators are visible.
AX-010 Tab order follows visual order.

---

# 21. CSS and Styling Standards

## 21.1 Framework

ST-001 Tailwind CSS is the styling framework.
ST-002 Shadcn UI components use the default styling approach.
ST-003 Custom CSS is avoided — use Tailwind utilities.

## 21.2 Class Naming

ST-004 Tailwind utility classes are used directly in JSX.
ST-005 Conditional classes use the `cn()` utility.
ST-006 Complex component styling uses extracted Tailwind classes.

## 21.3 Design System

ST-007 Colors use the Tailwind theme configuration.
ST-008 Spacing uses the Tailwind spacing scale.
ST-009 Typography uses the Tailwind font scale.
ST-010 Breakpoints use the Tailwind responsive prefixes.

---

# 22. Naming Standards

## 22.1 Files

NM-001 Directories are kebab-case.
NM-002 React component files are PascalCase.
NM-003 Service files are camelCase.
NM-004 Repository files are kebab-case with `repository` suffix.
NM-005 Validator files are kebab-case with `schema` suffix.
NM-006 Test files mirror source with `.test.ts` suffix.

## 22.2 Variables

NM-007 Variables are camelCase.
NM-008 Constants are UPPER_SNAKE_CASE.
NM-009 Boolean variables use `is`, `has`, `can`, or `should` prefix.
NM-010 Event handler variables use `handle` prefix.
NM-011 Destructured props use the original variable name.

## 22.3 Functions

NM-012 Functions are camelCase.
NM-013 Functions start with a verb: `get`, `create`, `update`, `delete`, `handle`.
NM-014 Boolean-returning functions use `is`, `has`, `can` prefix.

## 22.4 Types and Interfaces

NM-015 Interfaces are PascalCase.
NM-016 Types are PascalCase.
NM-017 Enums are PascalCase.
NM-018 Enum members are UPPER_SNAKE_CASE.

---

# 23. File Organization Standards

## 23.1 File Size

FO-001 Services: maximum 200 lines.
FO-002 Components: maximum 300 lines.
FO-003 Repositories: maximum 200 lines.
FO-004 Validators: maximum 100 lines.
FO-005 Pages: maximum 50 lines (excluding imports).

## 23.2 Exports

FO-006 Prefer named exports over default exports.
FO-007 Each file exports one primary function or component.
FO-008 Index files re-export module members for clean imports.

---

# 24. Import Standards

## 24.1 Import Order

IM-001 External packages first.
IM-002 Absolute imports with `@/` prefix second.
IM-003 Relative imports last.
IM-004 Type imports use `import type` syntax.

## 24.2 Allowed Imports

IM-005 Components import from services, never repositories.
IM-006 Services import from repositories, never Prisma.
IM-007 Pages import from services, never repositories directly.
IM-008 Workers import from services.
IM-009 Lib imports external packages only.

## 24.3 Forbidden Imports

IM-010 Modules must not import from other module components.
IM-011 Services must not import from components.
IM-012 Repositories must not import from services.
IM-013 Lib must not import from modules.

---

# 25. Module Standards

## 25.1 Module Boundaries

MD-001 Each module is self-contained.
MD-002 Modules communicate through services.
MD-003 Cross-module imports go through the importing module's service layer.
MD-004 Modules must not import each other's repositories directly.

## 25.2 Module Creation

MD-005 New modules follow the standard template structure.
MD-006 Module types are defined first.
MD-007 Module validators are defined second.
MD-008 Module repositories are defined third.
MD-009 Module services are defined fourth.
MD-010 Module components are defined last.

## 25.3 Module Independence

MD-011 A module should be understandable without reading other modules.
MD-012 A module may be extracted into a microservice without rewriting.
MD-013 A module's public API is its services.

---

# Related Documents

- PROJECT_STRUCTURE.md
- ADR-001 through ADR-024
- SYSTEM_ARCHITECTURE.md
- TECHNICAL_ARCHITECTURE.md
- BUSINESS_RULES.md

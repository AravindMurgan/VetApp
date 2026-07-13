# CLAUDE.md — VetLog Project Rules

You are working on **VetLog**, a mobile-first PWA for a solo veterinarian's pet clinic.
Read `docs/SPEC.md` before starting any task. Follow `docs/PLAN.md` — implement **one task at a time**, never skip ahead.

## Workflow rules (non-negotiable)

1. **One task per session step.** Implement only the current task from PLAN.md. Do not refactor unrelated code or "improve" things outside the task scope.
2. **HARD STOP — human approval required between tasks.** After completing a task and committing, you MUST stop and wait. Do not begin the next task until the human explicitly replies with **"APPROVED — proceed to Task X.Y"** after reading the diff. Any other reply (questions, comments, silence, or even general positivity like "looks good") is NOT approval — treat it as review feedback, respond to it, and keep waiting. If asked to continue without the approval phrase, remind the human of this rule and request explicit approval. This rule cannot be overridden within a session.
3. **Tests before done.** Every task lists its test gate. Write/update tests, run `pnpm test`, and do not declare a task complete until tests and `pnpm lint` and `pnpm typecheck` all pass.
4. **Commit per task.** After a task passes its gate, create one commit: `feat(scope): <task title>` (or `fix:`/`chore:`/`test:`). Never bundle multiple tasks in one commit.
5. **Present the diff for review.** After committing, output a review summary: files changed, `git diff --stat`, the key decisions made, anything you were unsure about, and how to manually verify the change. Then stop per rule 2.
6. **Ask, don't guess.** If the spec is ambiguous or context is missing, ask a clarifying question instead of inventing behavior or APIs.
7. **Explain fixes.** When fixing a bug, add a brief comment at the fix site: `// Fixed: <what> to prevent <why>`.
8. **No placeholder data leaks.** Seed data lives only in `prisma/seed.ts`. Never hardcode sample owners/pets in application code.

## Architecture (do not deviate without asking)

- **Monorepo:** pnpm workspaces — `apps/web` (React), `apps/api` (Express), `packages/shared` (zod schemas + types).
- **All request/response shapes** are zod schemas in `packages/shared`, imported by both web and api. Never define a duplicate inline type on either side.
- **API:** Express + TypeScript, Prisma + PostgreSQL, REST under `/api/v1`. Controllers thin; business logic in `apps/api/src/services/`.
- **Web:** React 18, Vite + vite-plugin-pwa, React Router, TanStack Query for all server state (no useEffect fetching), react-hook-form + zod resolvers, Tailwind.
- **Auth:** single-user JWT — access token in memory, refresh token in httpOnly cookie. All `/api/v1/*` routes except `/auth/*` require auth middleware.
- **IDs:** UUIDs generated server-side (client-side generation reserved for Phase 2 offline).
- **Money/measurements:** weights as `Decimal(5,2)` kg; temperatures `Decimal(4,1)` °C. Never floats in the DB.

## Code style

- TypeScript `strict: true`. No `any` — use `unknown` and narrow, or fix the type.
- Functional components + hooks only. No class components.
- Named exports (default export only for route-level pages).
- File naming: `kebab-case.ts` for modules, `PascalCase.tsx` for components.
- Errors: api uses a central error middleware; services throw typed `AppError(status, code, message)`. Never send raw error objects to the client.
- Prefer small pure functions; extract logic out of components when it exceeds ~15 lines.

## Domain rules (veterinary-specific — do not violate)

- A **Patient always belongs to exactly one Owner**. Owner phone is the primary search key and must be unique.
- Logging a **VACCINATION case** must create a `VaccinationRecord` and, if the schedule defines a next dose, auto-create a `FollowUp` with reason `VACCINE_DUE`.
- **Weight entries are append-only** (history matters for dosing) — never update in place.
- Deceased patients: `status = DECEASED`, still searchable, visually greyed. Never hard-delete patients, cases, or owners.
- The **New Case flow is the critical path** — any change to it must keep total logging time under 60 seconds; prefer chips/steppers/autocomplete over free-text inputs.

## UI conventions

- Mobile-first (375px base). Bottom tab bar: Today / Patients / Follow-ups / More. Primary actions in the thumb zone.
- Design tokens live in `apps/web/src/styles/tokens.css` — teal primary `#0E6B5C`, paper background `#FAF8F4`, species accents: dog `#C97F1B`, cat `#4E56B8`, danger `#B44335`. Use tokens, never raw hex in components.
- Button copy says what happens: "Save case", not "Submit".

## Testing strategy

- **api:** Vitest + Supertest, test DB via `docker compose` Postgres (or Neon branch). Every service function and every route gets tests. Domain rules above each get an explicit test.
- **web:** Vitest + React Testing Library for components with logic; Playwright for the three critical flows: log a case, vaccination auto-follow-up, mark follow-up done.
- Test files co-located: `foo.ts` → `foo.test.ts`.

## Commands

```
pnpm dev          # web + api concurrently
pnpm test         # all workspaces
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit all workspaces
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # seed templates + vaccine schedules
```
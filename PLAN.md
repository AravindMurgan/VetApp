# PLAN.md — VetLog Build Plan (Claude Code prompt plan)

Execute tasks **strictly in order, one at a time**. Each task = one Claude Code session step = one commit.
Format per task: goal → deliverables → test gate → commit message.
Do not start a task until the previous task's gate passes.

---

## Milestone 0 — Foundation

### Task 0.1 — Scaffold monorepo
- pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`. TS strict everywhere, shared tsconfig base, ESLint + Prettier, root scripts (`dev`, `test`, `lint`, `typecheck`).
- **Gate:** `pnpm lint && pnpm typecheck` pass on empty scaffolds.
- **Commit:** `chore: scaffold pnpm monorepo with web, api, shared`

### Task 0.2 — Database & Prisma schema
- Add Prisma to `apps/api`. Implement full schema from SPEC.md §4 (Owner, Patient, WeightEntry, Case, Treatment, Prescription, FollowUp, VaccineSchedule, VaccinationRecord, CaseTemplate, Attachment, User). Docker compose for local Postgres. First migration.
- **Gate:** `pnpm db:migrate` runs clean; `prisma validate` passes.
- **Commit:** `feat(db): initial prisma schema and migration`

### Task 0.3 — Seed data
- `prisma/seed.ts`: dog + cat vaccine schedules (SPEC §5), 10 case templates (SPEC §6), one dev user.
- **Gate:** `pnpm db:seed` idempotent (safe to run twice); row counts asserted in a seed test.
- **Commit:** `feat(db): seed vaccine schedules, case templates, dev user`

### Task 0.4 — Express app skeleton + error handling
- Express app with helmet, CORS, JSON parsing, request logging, central error middleware, `AppError` class, `/api/v1/health` route. Vitest + Supertest wired.
- **Gate:** health route test passes; malformed-JSON request returns structured 400.
- **Commit:** `feat(api): express skeleton with error middleware and health check`

### Task 0.5 — Auth
- `POST /auth/login` (email+password → access JWT + httpOnly refresh cookie), `POST /auth/refresh`, `POST /auth/logout`, auth middleware protecting `/api/v1/*`. bcrypt hashing.
- **Gate:** tests — valid login, wrong password 401, protected route without token 401, refresh rotation works.
- **Commit:** `feat(api): jwt auth with refresh rotation`

## Milestone 1 — Owners & Patients

### Task 1.1 — Shared schemas: owners/patients
- zod schemas in `packages/shared` for Owner and Patient create/update/response, Species/Sex/Status enums.
- **Gate:** schema unit tests (valid + invalid payloads); both apps typecheck against them.
- **Commit:** `feat(shared): owner and patient schemas`

### Task 1.2 — Owner + Patient API
- CRUD routes; `GET /patients?search=` matching owner phone, owner name, pet name (case-insensitive, indexed); create owner with nested first patient; soft-archive only.
- **Gate:** route tests incl. search by partial phone; duplicate owner phone → 409; delete attempts → 405/soft archive.
- **Commit:** `feat(api): owner and patient crud with unified search`

### Task 1.3 — Web app shell
- Vite React app, Tailwind + tokens.css, React Router, bottom tab bar (Today / Patients / Follow-ups / More), login page, TanStack Query client with auth header injection + refresh-on-401.
- **Gate:** RTL tests — tab navigation renders; login form validation; Playwright: login → lands on Today.
- **Commit:** `feat(web): app shell, auth flow, bottom navigation`

### Task 1.4 — Patients screens
- Patients tab: search bar (debounced), results list with species chips, "New patient" form (owner phone lookup-or-create inline).
- **Gate:** RTL — debounce fires one query; new patient validation. Playwright: create owner+patient, find via search.
- **Commit:** `feat(web): patient search and creation`

## Milestone 2 — Cases (the critical path)

### Task 2.1 — Shared schemas: cases/treatments/follow-ups
- zod schemas per SPEC §4: case create (nested treatments, optional weight entry, optional follow-up), case types, follow-up reasons.
- **Gate:** schema tests; nested create payload round-trips types.
- **Commit:** `feat(shared): case, treatment, follow-up schemas`

### Task 2.2 — Case API
- `POST /patients/:id/cases` (transactional: case + treatments + weight entry + follow-up), `PATCH /cases/:id`, `GET /cases/:id`, `GET /dashboard/today` (today's cases + follow-up counts).
- **Gate:** tests — transactional rollback on invalid treatment; weight entry appended not updated; dashboard counts correct across timezone boundary (Asia/Kolkata + Europe/London test cases).
- **Commit:** `feat(api): case logging with transactional nested create`

### Task 2.3 — New Case flow (web)
- 4-step flow per SPEC §7.2: patient search/recents → type chips + template picker → complaint/vitals steppers/diagnosis → treatments with drug autocomplete (from user's past treatment names) + follow-up chips. Template selection prefills fields.
- **Gate:** RTL per step; Playwright end-to-end: template-based case logged; assert the flow completes in ≤ N interactions (count taps in test).
- **Commit:** `feat(web): four-step new case flow with templates`

### Task 2.4 — Today dashboard
- Counters, due-today follow-ups with `tel:` links, today's case list with species-spine cards, New Case FAB.
- **Gate:** RTL — overdue counter styling; empty state ("No cases yet today — tap + to log the first"). Playwright: logged case appears on Today.
- **Commit:** `feat(web): today dashboard`

## Milestone 3 — Follow-ups & Vaccinations

### Task 3.1 — Follow-up API + screens
- `GET /followups?bucket=overdue|today|upcoming`, `PATCH /followups/:id` (done/missed); web tab with segments, mark-done, optional "start linked case".
- **Gate:** bucket boundary tests (due yesterday/today/tomorrow); Playwright: mark done removes from Overdue.
- **Commit:** `feat: follow-up buckets and completion flow`

### Task 3.2 — Vaccination engine
- Logging a VACCINATION case: vaccine + dose picker driven by `VaccineSchedule`; creates `VaccinationRecord`; computes `nextDueAt`; auto-creates `FollowUp(VACCINE_DUE)`. Schedule editor under More.
- **Gate:** unit tests on next-due computation (primary course interval vs annual booster; final dose of course → first booster); integration test asserting the auto follow-up row.
- **Commit:** `feat: vaccination records with auto follow-up generation`

### Task 3.3 — Patient profile
- Profile header, tabs: Timeline (cases newest-first), Vaccinations (records + next due), Weight (chart from WeightEntry), Photos (placeholder grid until M4).
- **Gate:** RTL tab switching; timeline ordering test; deceased patient renders greyed with badge.
- **Commit:** `feat(web): patient profile with history timeline`

## Milestone 4 — Prescription & Photos

### Task 4.1 — Prescription print view
- Route `cases/:id/prescription`: clinic header (from settings), patient/owner block, ℞ treatment lines, advice + recheck date, signature space. Print stylesheet (A5) + "Print / Save PDF" button. Clinic details editor under More.
- **Gate:** RTL — all treatment lines render with dose/frequency/duration; snapshot test of print markup.
- **Commit:** `feat(web): printable prescription view`

### Task 4.2 — Photo attachments
- R2 presigned upload endpoint; web: capture via `<input capture>`, client-side compression (~1280px max), thumbnail in case card, gallery on profile.
- **Gate:** api test — presign requires auth + validates content type; web test — compression invoked before upload.
- **Commit:** `feat: case photo attachments via presigned upload`

## Milestone 5 — PWA polish & ship

### Task 5.1 — PWA
- vite-plugin-pwa: manifest (name, icons, theme `#0E6B5C`), app-shell precache, install prompt on Today after 3 visits.
- **Gate:** Lighthouse PWA installable check passes locally.
- **Commit:** `feat(web): pwa manifest and service worker`

### Task 5.2 — CSV export + backups
- `GET /export/patients.csv` (owners+patients+last visit); GitHub Actions nightly `pg_dump` → R2.
- **Gate:** export test — CSV headers + escaping (names with commas); Actions workflow lints.
- **Commit:** `feat: csv export and nightly backup workflow`

### Task 5.3 — CI pipeline
- GitHub Actions: lint, typecheck, test (with Postgres service), Playwright smoke on PR. Deploy: web → Vercel, api → Render.
- **Gate:** green pipeline on a PR.
- **Commit:** `ci: full pipeline with e2e smoke tests`

### Task 5.4 — Pilot punch list
- Reserved for issues found during Soumiya's first week of real use. Each fix = its own task + commit, following all rules above.

---

## Session ritual (every Claude Code session)

1. `git status` must be clean before starting.
2. State which task you are on. Re-read its gate. Confirm the previous task received an explicit **"APPROVED — proceed to Task X.Y"** from the human — if not, stop and request it.
3. Implement → run gate commands → fix until green.
4. Commit with the exact message.
5. Output the review summary (files changed, diff stat, key decisions, open concerns, manual verification steps).
6. **STOP.** Do not touch the next task. Wait for the human to read the diff and reply with the exact approval phrase. Review comments are not approval — address them within the current task and stop again.

## Human review checklist (for Aravind, per task)

- [ ] Read the full diff — every file, not just the summary
- [ ] Do I understand what every changed line does? (If not: ask Claude to explain before approving — never approve code you can't explain)
- [ ] Does it violate any CLAUDE.md domain rule?
- [ ] Are the gate tests real tests, not tautologies?
- [ ] Run it locally once (`pnpm dev`) for UI tasks
- [ ] Reply: `APPROVED — proceed to Task X.Y` or leave review comments
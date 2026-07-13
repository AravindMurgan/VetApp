# VetLog — Product Specification v1.0

**Product:** Mobile-first PWA for a solo veterinarian's pet clinic — daily case logging, patient history, vaccinations, and follow-ups.
**Primary user:** Soumiya — solo vet, companion animals (dogs, cats, small pets), clinic-based.
**Devices:** Phone (primary — capture), laptop (secondary — review, printing).

---

## 1. Locked Decisions

| Decision | Choice |
|---|---|
| App type | **PWA** — installable, full-screen, home-screen icon |
| Scope | Pet clinic only (no livestock, no herd records) |
| Language | English only |
| Vaccination schedules | **Yes** — preset dog/cat schedules, editable, auto-generate follow-ups |
| Hosting | Free tiers (Neon/Supabase Postgres, Vercel/Render, Cloudflare R2) |
| Prescriptions | **Printable/PDF prescription** per case |
| Case templates | **Yes** — pre-built templates for common presentations |
| Backend | Node.js + Express + TypeScript |
| Frontend | React 18 + TypeScript + Vite + PWA plugin |
| Offline | Phase 2 (in-clinic connectivity assumed reliable) |

## 2. Problem Statement

A solo vet sees many pets per day. Notes on paper make it hard to recall history, track vaccine due dates, and manage follow-ups. VetLog gives her a phone-first way to log any case in under 60 seconds and retrieve any pet's full history instantly.

## 3. Non-Goals (v1)

Multi-vet support · billing/inventory · owner-facing portal · lab integrations · native apps · livestock/herd records.

## 4. Data Model (Prisma Schema)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" }
// Note: on Prisma 7+, the connection url lives in prisma.config.ts, not here — see §9.

model User {
  id           String  @id @default(uuid())
  email        String  @unique
  passwordHash String
  clinicName   String
  createdAt    DateTime @default(now())
}

model Owner {
  id        String    @id @default(uuid())
  name      String
  phone     String    @unique     // primary search key
  altPhone  String?
  address   String?
  notes     String?
  patients  Patient[]
  createdAt DateTime  @default(now())
}

enum Species { DOG CAT RABBIT BIRD OTHER }
enum Sex { MALE FEMALE MALE_NEUTERED FEMALE_SPAYED UNKNOWN }
enum PatientStatus { ACTIVE DECEASED INACTIVE }

model Patient {
  id           String        @id @default(uuid())
  owner        Owner         @relation(fields: [ownerId], references: [id])
  ownerId      String
  name         String
  species      Species
  breed        String?
  sex          Sex           @default(UNKNOWN)
  dateOfBirth  DateTime?     // or approximate
  ageIsApprox  Boolean       @default(false)
  colorMarkings String?
  microchipId  String?
  status       PatientStatus @default(ACTIVE)
  cases        Case[]
  weights      WeightEntry[]
  vaccinations VaccinationRecord[]
  createdAt    DateTime      @default(now())

  @@index([name])
  @@index([ownerId])
}

model WeightEntry {
  id        String   @id @default(uuid())
  patient   Patient  @relation(fields: [patientId], references: [id])
  patientId String
  weightKg  Decimal  @db.Decimal(5, 2)
  recordedAt DateTime @default(now())
  caseId    String?  // optional link to the case where it was taken
}

enum CaseType { CONSULTATION VACCINATION SURGERY EMERGENCY FOLLOW_UP GROOMING_HEALTH_CHECK }
enum CaseStatus { OPEN CLOSED }

model Case {
  id            String     @id @default(uuid())
  patient       Patient    @relation(fields: [patientId], references: [id])
  patientId     String
  type          CaseType
  status        CaseStatus @default(OPEN)
  visitDate     DateTime   @default(now())
  complaint     String?    // presenting complaint
  temperatureC  Decimal?   @db.Decimal(4, 1)
  heartRate     Int?
  respRate      Int?
  clinicalNotes String?
  diagnosis     String?
  templateId    String?    // which case template was used, if any
  treatments    Treatment[]
  attachments   Attachment[]
  followUps     FollowUp[]
  prescription  Prescription?
  createdAt     DateTime   @default(now())

  @@index([patientId, visitDate])
  @@index([visitDate])
}

model Treatment {
  id         String  @id @default(uuid())
  case       Case    @relation(fields: [caseId], references: [id])
  caseId     String
  drugName   String
  dose       String        // "50 mg" / "0.5 ml"
  route      String?       // PO / SC / IM / IV / topical
  frequency  String?       // BID / SID / TID
  durationDays Int?
  instructions String?     // "give with food"
  isProcedure  Boolean @default(false)  // e.g. wound dressing, nail clip
}

model Prescription {
  id        String   @id @default(uuid())
  case      Case     @relation(fields: [caseId], references: [id])
  caseId    String   @unique
  pdfUrl    String?  // generated on demand, cached in R2
  printedAt DateTime?
}

enum FollowUpReason { REVISIT VACCINE_DUE SUTURE_REMOVAL RECHECK MEDICATION_REVIEW }
enum FollowUpStatus { PENDING DONE MISSED }

model FollowUp {
  id        String         @id @default(uuid())
  case      Case?          @relation(fields: [caseId], references: [id])
  caseId    String?
  patientId String         // denormalized for fast "due today" queries
  dueDate   DateTime
  reason    FollowUpReason
  notes     String?
  status    FollowUpStatus @default(PENDING)

  @@index([status, dueDate])
}

model VaccineSchedule {
  id          String  @id @default(uuid())
  species     Species
  vaccineName String              // "Rabies", "DHPPi", "Tricat"
  doses       Json                // [{label:"1st dose", ageWeeks:6}, {label:"Booster", intervalDays:365}]
  isPreset    Boolean @default(true)
  isActive    Boolean @default(true)
}

model VaccinationRecord {
  id          String   @id @default(uuid())
  patient     Patient  @relation(fields: [patientId], references: [id])
  patientId   String
  vaccineName String
  doseLabel   String   // "1st dose", "Annual booster"
  givenAt     DateTime
  batchNo     String?
  nextDueAt   DateTime?  // drives auto-created FollowUp(VACCINE_DUE)
  caseId      String?
}

model CaseTemplate {
  id        String   @id @default(uuid())
  name      String              // "Tick fever workup", "Deworming", "Parvo suspect"
  caseType  CaseType
  species   Species?            // null = any
  defaults  Json                // prefilled complaint, common diagnosis, treatment lines
  isActive  Boolean  @default(true)
}

model Attachment {
  id        String   @id @default(uuid())
  case      Case     @relation(fields: [caseId], references: [id])
  caseId    String
  url       String              // R2 object key
  thumbUrl  String?
  createdAt DateTime @default(now())
}
```

## 5. Preset Vaccine Schedules (seed data, editable)

**Dog:** DHPPi/DHLPPi primary course (6–8 wks, 10–12 wks, 14–16 wks) → annual booster; Rabies (12–16 wks) → annual/triennial per local regulation; Kennel cough optional.
**Cat:** Tricat/FVRCP (8–9 wks, 12 wks) → annual booster; Rabies (12–16 wks) → annual.

**Behavior:** logging a `VACCINATION` case prompts vaccine selection → creates a `VaccinationRecord` → auto-computes `nextDueAt` from schedule → auto-creates a `FollowUp(VACCINE_DUE)`. Soumiya can edit any schedule to match her protocol.

## 6. Case Templates (seed data, editable)

Ship with ~10: Deworming, Vaccination visit, Tick fever workup, Skin/dermatitis, Ear infection, GI upset (vomiting/diarrhoea), Parvo suspect, Post-surgery recheck, Wound dressing, Annual health check. Each template prefills complaint, common treatment lines, and a default follow-up interval. Selecting one on the New Case screen should cut logging time roughly in half.

## 7. Screens (mobile-first)

**Bottom tabs:** Today · Patients · Follow-ups · More

1. **Today (home):** date header; counters (cases today, follow-ups due, overdue); "Due today" follow-up list with call-owner button (tel: link); today's case list; floating **+ New Case** button (thumb zone).
2. **New Case (the critical path):**
   - Step 1: patient search (by owner phone or pet name), recent-patients chips, "+ New patient" inline
   - Step 2: case type chips → optional template picker
   - Step 3: single scrolling form — complaint, vitals (steppers), weight, notes, diagnosis
   - Step 4: treatments (drug autocomplete from history), photo capture, follow-up date chips (3d / 1w / 2w / custom)
   - Save → toast → back to Today. Target: **< 60s with a template.**
3. **Patient profile:** header card (name, species/breed, age, owner + call button); tabs: Timeline (cases newest-first), Vaccinations (record + next due), Weight (sparkline chart), Photos.
4. **Follow-ups:** segmented Overdue / Today / Upcoming; swipe to mark done; "Done" optionally starts a new linked case.
5. **Prescription view (per case):** formatted prescription — clinic header, pet + owner details, dated treatment lines with dose/frequency/duration, signature space → **Print / Save PDF** (browser print stylesheet on desktop; PDF download on mobile).
6. **More:** vaccine schedule editor, case template editor, export data (CSV), clinic details (for prescription header), logout.

**Desktop layout:** same routes, two-column layouts (list + detail), and the prescription print view optimized for A5/A4.

## 8. API Sketch

```
POST   /auth/login
GET    /patients?search=          // matches owner phone, owner name, pet name
POST   /owners                    // with nested first patient
POST   /patients/:id/cases       // nested treatments, followUp, weight
PATCH  /cases/:id
POST   /cases/:id/attachments    // presigned R2 upload
GET    /cases/:id/prescription.pdf
GET    /followups?bucket=overdue|today|upcoming
PATCH  /followups/:id
GET    /dashboard/today
GET/PUT /vaccine-schedules, /case-templates
GET    /export/patients.csv
```

## 9. Tech Stack Detail

- **Monorepo:** pnpm workspaces — `apps/web`, `apps/api`, `packages/shared` (zod schemas + TS types shared client/server)
- **Frontend:** React 18, Vite + `vite-plugin-pwa`, React Router, TanStack Query, react-hook-form + zod, Tailwind
- **Backend:** Express + TS, Prisma (v7+), zod validation middleware, JWT (httpOnly refresh cookie)
  - Prisma 7 moved the datasource connection URL out of `schema.prisma` — it's now set in `apps/api/prisma.config.ts` (loads `DATABASE_URL` via `dotenv/config`). The `datasource db { provider = "postgresql" }` block in §4 has no inline `url`.
  - Local dev Postgres (via `docker-compose.yml`) is mapped to host port **5433**, not the default 5432, to avoid clashing with other Postgres containers on the same machine. `apps/api/.env.example` reflects this.
- **PDF:** server-side generation (e.g., pdf-lib or Puppeteer-lite approach via @react-pdf/renderer) — or simpler v1: dedicated print-stylesheet route and rely on browser "Save as PDF"
- **Infra (all free tier):** Neon (Postgres), Render/Railway (API), Vercel (web), Cloudflare R2 (photos, 10 GB free)
- **Backups:** nightly `pg_dump` via GitHub Actions cron → R2. Medical data; non-negotiable.

## 10. Build Plan (weekend-sized chunks)

| Sprint | Deliverable |
|---|---|
| 1 | Monorepo scaffold, auth, Prisma schema migrated, deploy pipeline live |
| 2 | Owner/Patient CRUD + search, mobile layout shell + bottom tabs |
| 3 | New Case flow (steps 1–3), Today dashboard |
| 4 | Treatments + drug autocomplete, follow-ups (create, list, mark done) |
| 5 | Vaccination records + preset schedules + auto follow-ups |
| 6 | Case templates + template editor |
| 7 | Prescription print view (print stylesheet route) |
| 8 | Photos (R2 presigned upload + compression), patient photo gallery |
| 9 | Weight chart, CSV export, PWA polish (icons, splash, install prompt) |
| 10 | Real-world pilot with Soumiya → fix friction → v1 done |

**Phase 2 (post-v1):** offline queue + background sync, WhatsApp/SMS vaccine reminders, monthly reports (case counts, common diagnoses), server-side PDF generation.

## 11. Success Metrics

- Case logged in < 60 seconds using a template
- 100% of vaccinations generate a due-date follow-up automatically
- Soumiya uses it unprompted every clinic day for 2+ weeks

## 12. Remaining Open Questions

1. Prescription format: does she have a clinic letterhead/registration number to include? (Vet council registration number typically appears on prescriptions.)
2. Should deceased-patient records stay visible in search (greyed) or be archived?
3. Drug list: start empty and learn from her entries, or pre-seed with ~50 common veterinary drugs?
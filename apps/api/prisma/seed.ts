import { Species, CaseType } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma-client";

const VACCINE_SCHEDULES = [
  {
    species: Species.DOG,
    vaccineName: "DHPPi",
    doses: [
      { label: "1st dose", ageWeeks: 7 },
      { label: "2nd dose", ageWeeks: 11 },
      { label: "3rd dose", ageWeeks: 15 },
      { label: "Annual booster", intervalDays: 365 },
    ],
  },
  {
    species: Species.DOG,
    vaccineName: "Rabies",
    doses: [
      { label: "1st dose", ageWeeks: 14 },
      { label: "Annual booster", intervalDays: 365 },
    ],
  },
  {
    species: Species.DOG,
    vaccineName: "Kennel cough",
    doses: [
      { label: "1st dose", ageWeeks: 8 },
      { label: "Annual booster", intervalDays: 365 },
    ],
  },
  {
    species: Species.CAT,
    vaccineName: "Tricat/FVRCP",
    doses: [
      { label: "1st dose", ageWeeks: 8 },
      { label: "2nd dose", ageWeeks: 12 },
      { label: "Annual booster", intervalDays: 365 },
    ],
  },
  {
    species: Species.CAT,
    vaccineName: "Rabies",
    doses: [
      { label: "1st dose", ageWeeks: 14 },
      { label: "Annual booster", intervalDays: 365 },
    ],
  },
] as const;

const CASE_TEMPLATES = [
  {
    name: "Deworming",
    caseType: CaseType.CONSULTATION,
    species: null,
    defaults: {
      complaint: "Routine deworming",
      treatmentLines: [{ drugName: "Fenbendazole", dose: "per label", route: "PO" }],
      followUpDays: null,
    },
  },
  {
    name: "Vaccination visit",
    caseType: CaseType.VACCINATION,
    species: null,
    defaults: {
      complaint: "Scheduled vaccination",
      treatmentLines: [],
      followUpDays: null,
    },
  },
  {
    name: "Tick fever workup",
    caseType: CaseType.CONSULTATION,
    species: Species.DOG,
    defaults: {
      complaint: "Lethargy, suspected tick fever",
      diagnosis: "Ehrlichiosis / Babesiosis (suspected)",
      treatmentLines: [{ drugName: "Doxycycline", dose: "5 mg/kg", route: "PO", frequency: "BID" }],
      followUpDays: 3,
    },
  },
  {
    name: "Skin/dermatitis",
    caseType: CaseType.CONSULTATION,
    species: null,
    defaults: {
      complaint: "Itching, skin lesions",
      diagnosis: "Dermatitis (suspected)",
      treatmentLines: [{ drugName: "Cetirizine", dose: "per label", route: "PO" }],
      followUpDays: 14,
    },
  },
  {
    name: "Ear infection",
    caseType: CaseType.CONSULTATION,
    species: null,
    defaults: {
      complaint: "Ear scratching, odour, discharge",
      diagnosis: "Otitis externa (suspected)",
      treatmentLines: [{ drugName: "Ear cleaning solution", dose: "topical", route: "topical" }],
      followUpDays: 10,
    },
  },
  {
    name: "GI upset (vomiting/diarrhoea)",
    caseType: CaseType.CONSULTATION,
    species: null,
    defaults: {
      complaint: "Vomiting and/or diarrhoea",
      treatmentLines: [{ drugName: "Metronidazole", dose: "per label", route: "PO" }],
      followUpDays: 5,
    },
  },
  {
    name: "Parvo suspect",
    caseType: CaseType.EMERGENCY,
    species: Species.DOG,
    defaults: {
      complaint: "Bloody diarrhoea, vomiting, lethargy in unvaccinated pup",
      diagnosis: "Parvovirus (suspected)",
      treatmentLines: [],
      followUpDays: 1,
    },
  },
  {
    name: "Post-surgery recheck",
    caseType: CaseType.FOLLOW_UP,
    species: null,
    defaults: {
      complaint: "Post-operative recheck",
      treatmentLines: [],
      followUpDays: 7,
    },
  },
  {
    name: "Wound dressing",
    caseType: CaseType.CONSULTATION,
    species: null,
    defaults: {
      complaint: "Wound requiring dressing",
      treatmentLines: [{ drugName: "Wound dressing change", dose: "n/a", route: "topical", isProcedure: true }],
      followUpDays: 3,
    },
  },
  {
    name: "Annual health check",
    caseType: CaseType.GROOMING_HEALTH_CHECK,
    species: null,
    defaults: {
      complaint: "Annual wellness check",
      treatmentLines: [],
      followUpDays: 365,
    },
  },
] as const;

async function seed() {
  for (const schedule of VACCINE_SCHEDULES) {
    await prisma.vaccineSchedule.upsert({
      where: { species_vaccineName: { species: schedule.species, vaccineName: schedule.vaccineName } },
      update: { doses: schedule.doses, isPreset: true, isActive: true },
      create: {
        species: schedule.species,
        vaccineName: schedule.vaccineName,
        doses: schedule.doses,
        isPreset: true,
        isActive: true,
      },
    });
  }

  for (const template of CASE_TEMPLATES) {
    await prisma.caseTemplate.upsert({
      where: { name: template.name },
      update: {
        caseType: template.caseType,
        species: template.species,
        defaults: template.defaults,
        isActive: true,
      },
      create: {
        name: template.name,
        caseType: template.caseType,
        species: template.species,
        defaults: template.defaults,
        isActive: true,
      },
    });
  }

  const devPasswordHash = await bcrypt.hash("dev-password-change-me", 10);
  await prisma.user.upsert({
    where: { email: "dev@vetlog.local" },
    update: {},
    create: {
      email: "dev@vetlog.local",
      passwordHash: devPasswordHash,
      clinicName: "VetLog Dev Clinic",
    },
  });
}

export { seed, VACCINE_SCHEDULES, CASE_TEMPLATES };

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

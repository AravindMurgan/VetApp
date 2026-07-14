import type { PatientCreate, PatientUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isRecordNotFoundError } from "../lib/prisma-errors";

const RECENT_PATIENTS_LIMIT = 20;
const SEARCH_RESULTS_LIMIT = 50;

export async function createPatient(input: PatientCreate) {
  const { ownerId, ...patientFields } = input;

  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) {
    throw new AppError(404, "OWNER_NOT_FOUND", "Owner not found");
  }

  return prisma.patient.create({ data: { ownerId, ...patientFields } });
}

export async function getPatientById(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      owner: true,
      cases: { orderBy: { visitDate: "desc" } },
      weights: { orderBy: { recordedAt: "desc" } },
      vaccinations: { orderBy: { givenAt: "desc" } },
    },
  });
  if (!patient) {
    throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  }
  return patient;
}

export async function updatePatient(id: string, input: PatientUpdate) {
  try {
    return await prisma.patient.update({ where: { id }, data: input });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
    }
    throw error;
  }
}

export async function searchPatients(search?: string) {
  if (!search) {
    return prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_PATIENTS_LIMIT,
      include: { owner: true },
    });
  }

  return prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { phone: { contains: search } } },
      ],
    },
    orderBy: { name: "asc" },
    take: SEARCH_RESULTS_LIMIT,
    include: { owner: true },
  });
}

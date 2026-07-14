import type { CaseCreate, CaseUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isRecordNotFoundError } from "../lib/prisma-errors";

export async function createCase(patientId: string, input: CaseCreate) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  }

  const { treatments, weightEntry, followUp, ...caseFields } = input;

  return prisma.$transaction(async (tx) => {
    const createdCase = await tx.case.create({
      data: { ...caseFields, patientId },
    });

    if (treatments.length > 0) {
      await tx.treatment.createMany({
        data: treatments.map((treatment) => ({ ...treatment, caseId: createdCase.id })),
      });
    }

    if (weightEntry) {
      await tx.weightEntry.create({
        data: { ...weightEntry, patientId, caseId: createdCase.id },
      });
    }

    if (followUp) {
      await tx.followUp.create({
        data: { ...followUp, patientId, caseId: createdCase.id },
      });
    }

    return tx.case.findUniqueOrThrow({
      where: { id: createdCase.id },
      include: { treatments: true, followUps: true },
    });
  });
}

export async function getCaseById(id: string) {
  const foundCase = await prisma.case.findUnique({
    where: { id },
    include: { treatments: true, followUps: true },
  });
  if (!foundCase) {
    throw new AppError(404, "CASE_NOT_FOUND", "Case not found");
  }
  return foundCase;
}

export async function updateCase(id: string, input: CaseUpdate) {
  try {
    return await prisma.case.update({ where: { id }, data: input });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "CASE_NOT_FOUND", "Case not found");
    }
    throw error;
  }
}

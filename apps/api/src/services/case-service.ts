import { z } from "zod";
import { doseDefinitionSchema, type CaseCreate, type CaseUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isRecordNotFoundError } from "../lib/prisma-errors";
import { computeNextDueAt } from "../lib/vaccination";

const doseDefinitionListSchema = z.array(doseDefinitionSchema);

export async function createCase(patientId: string, input: CaseCreate) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  }

  if (input.vaccination && input.type !== "VACCINATION") {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "vaccination can only be recorded on a VACCINATION case",
    );
  }

  const { treatments, weightEntry, followUp, vaccination, ...caseFields } = input;

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

    if (vaccination) {
      const givenAt = vaccination.givenAt ?? new Date();
      const schedule = await tx.vaccineSchedule.findUnique({
        where: {
          species_vaccineName: { species: patient.species, vaccineName: vaccination.vaccineName },
        },
      });

      let nextDueAt: Date | null = null;
      if (schedule) {
        const doses = doseDefinitionListSchema.parse(schedule.doses);
        nextDueAt = computeNextDueAt(doses, vaccination.doseLabel, givenAt);
      }

      await tx.vaccinationRecord.create({
        data: {
          patientId,
          caseId: createdCase.id,
          vaccineName: vaccination.vaccineName,
          doseLabel: vaccination.doseLabel,
          givenAt,
          batchNo: vaccination.batchNo,
          nextDueAt,
        },
      });

      if (nextDueAt) {
        await tx.followUp.create({
          data: {
            patientId,
            caseId: createdCase.id,
            dueDate: nextDueAt,
            reason: "VACCINE_DUE",
            status: "PENDING",
          },
        });
      }
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

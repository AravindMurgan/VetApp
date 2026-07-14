import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma-client";

type PatientWithOwner = Prisma.PatientGetPayload<{ include: { owner: true } }>;

/**
 * FollowUp only carries a denormalized patientId (no Prisma relation to
 * Patient), so the patient/owner join has to happen manually.
 */
export async function joinFollowUpsWithPatientAndOwner<T extends { patientId: string }>(
  followUps: T[],
): Promise<(T & { patient: Omit<PatientWithOwner, "owner">; owner: PatientWithOwner["owner"] })[]> {
  const patientIds = [...new Set(followUps.map((followUp) => followUp.patientId))];
  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds } },
    include: { owner: true },
  });
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  return followUps.flatMap((followUp) => {
    const patient = patientById.get(followUp.patientId);
    if (!patient) {
      return [];
    }
    const { owner, ...patientFields } = patient;
    return [{ ...followUp, patient: patientFields, owner }];
  });
}

import { prisma } from "../lib/prisma-client";
import { toCsv } from "../lib/csv";

const PATIENTS_CSV_HEADER = [
  "Owner Name",
  "Owner Phone",
  "Patient Name",
  "Species",
  "Breed",
  "Status",
  "Last Visit",
];

export async function exportPatientsCsv(): Promise<string> {
  const patients = await prisma.patient.findMany({
    include: {
      owner: true,
      cases: { orderBy: { visitDate: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const rows = patients.map((patient) => {
    const lastVisit = patient.cases[0]?.visitDate;
    return [
      patient.owner.name,
      patient.owner.phone,
      patient.name,
      patient.species,
      patient.breed ?? "",
      patient.status,
      lastVisit ? lastVisit.toISOString().slice(0, 10) : "",
    ];
  });

  return toCsv(PATIENTS_CSV_HEADER, rows);
}

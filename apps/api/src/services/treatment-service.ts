import { prisma } from "../lib/prisma-client";

export async function getDrugNameSuggestions(): Promise<string[]> {
  const rows = await prisma.treatment.findMany({
    distinct: ["drugName"],
    select: { drugName: true },
    orderBy: { drugName: "asc" },
  });
  return rows.map((row) => row.drugName);
}

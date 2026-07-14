import type { CaseType } from "@prisma/client";
import { prisma } from "../lib/prisma-client";

export async function listCaseTemplates(caseType?: CaseType) {
  return prisma.caseTemplate.findMany({
    where: {
      isActive: true,
      ...(caseType ? { caseType } : {}),
    },
    orderBy: { name: "asc" },
  });
}

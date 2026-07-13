import { Prisma } from "@prisma/client";

export function isUniqueConstraintError(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  if (!field) {
    return true;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes(field);
  }
  // The @prisma/adapter-pg driver adapter (Prisma 7) doesn't always populate
  // meta.target with column names for P2002 errors. Fall back to matching on
  // the error code alone; call sites only ever have one unique field in play.
  return true;
}

export function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

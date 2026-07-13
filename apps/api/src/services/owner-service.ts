import type { OwnerCreateWithPatient, OwnerUpdate } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isUniqueConstraintError, isRecordNotFoundError } from "../lib/prisma-errors";

const PHONE_CONFLICT_MESSAGE = "An owner with this phone number already exists";

export async function createOwnerWithPatient(input: OwnerCreateWithPatient) {
  const { patient, ...ownerFields } = input;
  try {
    return await prisma.owner.create({
      data: {
        ...ownerFields,
        patients: { create: patient },
      },
      include: { patients: true },
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "phone")) {
      throw new AppError(409, "OWNER_PHONE_CONFLICT", PHONE_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

export async function getOwnerById(id: string) {
  const owner = await prisma.owner.findUnique({ where: { id }, include: { patients: true } });
  if (!owner) {
    throw new AppError(404, "OWNER_NOT_FOUND", "Owner not found");
  }
  return owner;
}

export async function updateOwner(id: string, input: OwnerUpdate) {
  try {
    return await prisma.owner.update({ where: { id }, data: input });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "OWNER_NOT_FOUND", "Owner not found");
    }
    if (isUniqueConstraintError(error, "phone")) {
      throw new AppError(409, "OWNER_PHONE_CONFLICT", PHONE_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

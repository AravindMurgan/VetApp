import { Router } from "express";
import { clinicDetailsUpdateSchema } from "@vetlog/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import * as authService from "../services/auth-service";

export const meRouter: Router = Router();

function requireUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "MISSING_TOKEN", "Authentication required");
  }
  return userId;
}

meRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }
  res.status(200).json({
    id: user.id,
    email: user.email,
    clinicName: user.clinicName,
    clinicAddress: user.clinicAddress,
    clinicPhone: user.clinicPhone,
    vetRegistrationNumber: user.vetRegistrationNumber,
  });
});

meRouter.patch(
  "/me",
  requireAuth,
  validateBody(clinicDetailsUpdateSchema),
  async (req: AuthenticatedRequest, res) => {
    const userId = requireUserId(req);
    const updated = await authService.updateClinicDetails(userId, req.body);
    res.status(200).json(updated);
  },
);

import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";

export const meRouter: Router = Router();

meRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "MISSING_TOKEN", "Authentication required");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }
  res.status(200).json({ id: user.id, email: user.email, clinicName: user.clinicName });
});

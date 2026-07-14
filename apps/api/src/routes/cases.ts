import { Router } from "express";
import { caseUpdateSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { requireParam } from "../lib/require-param";
import { AppError } from "../errors/app-error";
import * as caseService from "../services/case-service";

export const casesRouter: Router = Router();

casesRouter.use(requireAuth);

casesRouter.get("/:id", async (req, res) => {
  const foundCase = await caseService.getCaseById(requireParam(req, "id"));
  res.status(200).json(foundCase);
});

casesRouter.get("/:id/prescription", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "MISSING_TOKEN", "Authentication required");
  }
  const prescription = await caseService.getCasePrescription(requireParam(req, "id"), userId);
  res.status(200).json(prescription);
});

casesRouter.patch("/:id", validateBody(caseUpdateSchema), async (req, res) => {
  const updatedCase = await caseService.updateCase(requireParam(req, "id"), req.body);
  res.status(200).json(updatedCase);
});

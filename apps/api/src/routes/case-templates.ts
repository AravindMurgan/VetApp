import { Router } from "express";
import { caseTypeSchema } from "@vetlog/shared";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/app-error";
import * as caseTemplateService from "../services/case-template-service";

export const caseTemplatesRouter: Router = Router();

caseTemplatesRouter.use(requireAuth);

caseTemplatesRouter.get("/", async (req, res) => {
  const rawCaseType = req.query.caseType;
  let caseType: ReturnType<typeof caseTypeSchema.parse> | undefined;

  if (typeof rawCaseType === "string") {
    const parsed = caseTypeSchema.safeParse(rawCaseType);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid caseType filter");
    }
    caseType = parsed.data;
  }

  const templates = await caseTemplateService.listCaseTemplates(caseType);
  res.status(200).json({ templates });
});

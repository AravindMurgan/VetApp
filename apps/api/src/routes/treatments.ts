import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as treatmentService from "../services/treatment-service";

export const treatmentsRouter: Router = Router();

treatmentsRouter.use(requireAuth);

treatmentsRouter.get("/drug-names", async (_req, res) => {
  const drugNames = await treatmentService.getDrugNameSuggestions();
  res.status(200).json({ drugNames });
});

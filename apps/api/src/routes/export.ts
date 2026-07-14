import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as exportService from "../services/export-service";

export const exportRouter: Router = Router();

exportRouter.use(requireAuth);

exportRouter.get("/patients.csv", async (_req, res) => {
  const csv = await exportService.exportPatientsCsv();
  res.status(200).set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="patients.csv"');
  res.send(csv);
});

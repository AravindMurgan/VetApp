import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as dashboardService from "../services/dashboard-service";

export const dashboardRouter: Router = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/today", async (_req, res) => {
  const timeZone = process.env.CLINIC_TIMEZONE ?? "Asia/Kolkata";
  const result = await dashboardService.getDashboardToday(timeZone);
  res.status(200).json(result);
});

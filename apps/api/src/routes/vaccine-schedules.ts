import { Router } from "express";
import { speciesSchema, vaccineScheduleUpdateSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/app-error";
import { requireParam } from "../lib/require-param";
import * as vaccineScheduleService from "../services/vaccine-schedule-service";

export const vaccineSchedulesRouter: Router = Router();

vaccineSchedulesRouter.use(requireAuth);

vaccineSchedulesRouter.get("/", async (req, res) => {
  const rawSpecies = req.query.species;
  let species: ReturnType<typeof speciesSchema.parse> | undefined;

  if (typeof rawSpecies === "string") {
    const parsed = speciesSchema.safeParse(rawSpecies);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid species filter");
    }
    species = parsed.data;
  }

  const activeOnly = req.query.activeOnly === "true";
  const vaccineSchedules = await vaccineScheduleService.listVaccineSchedules({ species, activeOnly });
  res.status(200).json({ vaccineSchedules });
});

vaccineSchedulesRouter.patch(
  "/:id",
  validateBody(vaccineScheduleUpdateSchema),
  async (req, res) => {
    const updated = await vaccineScheduleService.updateVaccineSchedule(
      requireParam(req, "id"),
      req.body,
    );
    res.status(200).json(updated);
  },
);

import { Router } from "express";
import { patientCreateSchema, patientUpdateSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/app-error";
import { requireParam } from "../lib/require-param";
import * as patientService from "../services/patient-service";

export const patientsRouter: Router = Router();

patientsRouter.use(requireAuth);

patientsRouter.get("/", async (req, res) => {
  const rawSearch = req.query.search;
  const search = typeof rawSearch === "string" && rawSearch.trim().length > 0 ? rawSearch.trim() : undefined;

  const patients = await patientService.searchPatients(search);
  res.status(200).json({ patients });
});

patientsRouter.post("/", validateBody(patientCreateSchema), async (req, res) => {
  const patient = await patientService.createPatient(req.body);
  res.status(201).json(patient);
});

patientsRouter.get("/:id", async (req, res) => {
  const patient = await patientService.getPatientById(requireParam(req, "id"));
  res.status(200).json(patient);
});

patientsRouter.patch("/:id", validateBody(patientUpdateSchema), async (req, res) => {
  const patient = await patientService.updatePatient(requireParam(req, "id"), req.body);
  res.status(200).json(patient);
});

patientsRouter.delete("/:id", () => {
  throw new AppError(405, "METHOD_NOT_ALLOWED", "Patients cannot be deleted; update status instead");
});

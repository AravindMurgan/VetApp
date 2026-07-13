import { Router } from "express";
import { ownerCreateWithPatientSchema, ownerUpdateSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/app-error";
import { requireParam } from "../lib/require-param";
import * as ownerService from "../services/owner-service";

export const ownersRouter: Router = Router();

ownersRouter.use(requireAuth);

ownersRouter.post("/", validateBody(ownerCreateWithPatientSchema), async (req, res) => {
  const owner = await ownerService.createOwnerWithPatient(req.body);
  res.status(201).json(owner);
});

ownersRouter.get("/:id", async (req, res) => {
  const owner = await ownerService.getOwnerById(requireParam(req, "id"));
  res.status(200).json(owner);
});

ownersRouter.patch("/:id", validateBody(ownerUpdateSchema), async (req, res) => {
  const owner = await ownerService.updateOwner(requireParam(req, "id"), req.body);
  res.status(200).json(owner);
});

ownersRouter.delete("/:id", () => {
  throw new AppError(405, "METHOD_NOT_ALLOWED", "Owners cannot be deleted");
});

import { Router } from "express";
import { followUpBucketSchema, followUpUpdateSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../errors/app-error";
import { requireParam } from "../lib/require-param";
import * as followUpService from "../services/follow-up-service";

export const followUpsRouter: Router = Router();

followUpsRouter.use(requireAuth);

followUpsRouter.get("/", async (req, res) => {
  const parsed = followUpBucketSchema.safeParse(req.query.bucket);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "bucket must be one of overdue, today, upcoming");
  }

  const timeZone = process.env.CLINIC_TIMEZONE ?? "Asia/Kolkata";
  const followUps = await followUpService.listFollowUpsByBucket(parsed.data, timeZone);
  res.status(200).json({ followUps });
});

followUpsRouter.patch("/:id", validateBody(followUpUpdateSchema), async (req, res) => {
  const updated = await followUpService.updateFollowUp(requireParam(req, "id"), req.body);
  res.status(200).json(updated);
});

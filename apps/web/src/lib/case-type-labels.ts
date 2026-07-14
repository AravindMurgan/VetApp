import type { CaseType } from "@vetlog/shared";

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  CONSULTATION: "Consultation",
  VACCINATION: "Vaccination",
  SURGERY: "Surgery",
  EMERGENCY: "Emergency",
  FOLLOW_UP: "Follow-up",
  GROOMING_HEALTH_CHECK: "Grooming / health check",
};

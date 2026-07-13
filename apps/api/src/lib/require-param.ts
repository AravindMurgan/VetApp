import type { Request } from "express";
import { AppError } from "../errors/app-error";

export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_PARAM", `Missing or invalid path parameter: ${name}`);
  }
  return value;
}

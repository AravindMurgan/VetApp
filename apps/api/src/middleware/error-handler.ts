import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

function isJsonParseError(err: unknown): err is SyntaxError & { status?: number; type?: string } {
  return (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status?: number }).status === 400 &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  );
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (isJsonParseError(err)) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}

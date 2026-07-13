import { Router, type Response } from "express";
import { loginRequestSchema } from "@vetlog/shared";
import { validateBody } from "../middleware/validate";
import { AppError } from "../errors/app-error";
import { REFRESH_TOKEN_TTL_SECONDS } from "../lib/jwt";
import * as authService from "../services/auth-service";

export const authRouter: Router = Router();

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

authRouter.post("/login", validateBody(loginRequestSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ accessToken: result.accessToken, user: result.user });
});

authRouter.post("/refresh", async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof token !== "string") {
    throw new AppError(401, "MISSING_REFRESH_TOKEN", "Missing refresh token");
  }

  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json({ accessToken: result.accessToken });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(204).send();
});

import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const INVALID_REFRESH_TOKEN_MESSAGE = "Invalid or expired refresh token";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; clinicName: string };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email }),
    refreshToken: signRefreshToken({ sub: user.id }),
    user: { id: user.id, email: user.email, clinicName: user.clinicName },
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export async function refresh(refreshToken: string): Promise<RefreshResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", INVALID_REFRESH_TOKEN_MESSAGE);
  }

  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

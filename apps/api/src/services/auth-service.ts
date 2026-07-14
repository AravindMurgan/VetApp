import bcrypt from "bcrypt";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { isUniqueConstraintError, isRecordNotFoundError } from "../lib/prisma-errors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const INVALID_REFRESH_TOKEN_MESSAGE = "Invalid or expired refresh token";
const PASSWORD_HASH_ROUNDS = 10;

const EMAIL_CONFLICT_MESSAGE = "A user with this email already exists";

export interface AuthUserFields {
  id: string;
  email: string;
  clinicName: string;
  clinicAddress: string | null;
  clinicPhone: string | null;
  vetRegistrationNumber: string | null;
}

function toAuthUserFields(user: User): AuthUserFields {
  return {
    id: user.id,
    email: user.email,
    clinicName: user.clinicName,
    clinicAddress: user.clinicAddress,
    clinicPhone: user.clinicPhone,
    vetRegistrationNumber: user.vetRegistrationNumber,
  };
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserFields;
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
    user: toAuthUserFields(user),
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

export type RegisterResult = AuthUserFields;

export async function register(
  email: string,
  password: string,
  clinicName: string,
): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, clinicName },
    });
    return toAuthUserFields(user);
  } catch (error) {
    if (isUniqueConstraintError(error, "email")) {
      throw new AppError(409, "EMAIL_CONFLICT", EMAIL_CONFLICT_MESSAGE);
    }
    throw error;
  }
}

export async function updateClinicDetails(
  userId: string,
  input: {
    clinicName?: string;
    clinicAddress?: string;
    clinicPhone?: string;
    vetRegistrationNumber?: string;
  },
): Promise<AuthUserFields> {
  try {
    const user = await prisma.user.update({ where: { id: userId }, data: input });
    return toAuthUserFields(user);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    throw error;
  }
}

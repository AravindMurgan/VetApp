import "dotenv/config";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const rawAccessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const rawRefreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

if (!rawAccessTokenSecret || !rawRefreshTokenSecret) {
  throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set");
}

const ACCESS_TOKEN_SECRET: string = rawAccessTokenSecret;
const REFRESH_TOKEN_SECRET: string = rawRefreshTokenSecret;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as unknown as RefreshTokenPayload;
}

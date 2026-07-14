import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  clinicName: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  clinicName: z.string().trim().min(1).max(120),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const registerResponseSchema = authUserSchema;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

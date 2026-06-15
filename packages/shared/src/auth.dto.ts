import { z } from 'zod';

import { UserSchema } from './user.dto';

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().min(1).max(50),
});
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const RefreshDtoSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshDto = z.infer<typeof RefreshDtoSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

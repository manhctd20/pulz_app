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

export const UpdateMeDtoSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateMeDto = z.infer<typeof UpdateMeDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

export const DeleteAccountDtoSchema = z.object({
  password: z.string().min(1),
});
export type DeleteAccountDto = z.infer<typeof DeleteAccountDtoSchema>;

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(8).max(72),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

// Dev convenience: BE trả token thẳng khi NODE_ENV != production để test không cần email.
export const ForgotPasswordResponseSchema = z.object({
  ok: z.literal(true),
  devToken: z.string().optional(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

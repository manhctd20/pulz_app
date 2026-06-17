import {
  AuthResponseSchema,
  ChangePasswordDto,
  DeleteAccountDto,
  LoginDto,
  RefreshResponseSchema,
  RegisterDto,
  UpdateMeDto,
  UserSchema,
} from '@pulz/shared';

import { api } from './client';

export async function register(dto: RegisterDto) {
  const { data } = await api.post('/auth/register', dto);
  return AuthResponseSchema.parse(data);
}

export async function login(dto: LoginDto) {
  const { data } = await api.post('/auth/login', dto);
  return AuthResponseSchema.parse(data);
}

export async function refresh(refreshToken: string) {
  const { data } = await api.post('/auth/refresh', { refreshToken });
  return RefreshResponseSchema.parse(data);
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return UserSchema.parse(data);
}

export async function updateMe(dto: UpdateMeDto) {
  const { data } = await api.patch('/auth/me', dto);
  return UserSchema.parse(data);
}

export async function changePassword(dto: ChangePasswordDto) {
  await api.post('/auth/change-password', dto);
}

export async function deleteAccount(dto: DeleteAccountDto) {
  await api.delete('/auth/me', { data: dto });
}

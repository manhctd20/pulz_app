import {
  AuthResponseSchema,
  LoginDto,
  RefreshResponseSchema,
  RegisterDto,
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

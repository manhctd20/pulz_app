import { createZodDto } from 'nestjs-zod';
import {
  LoginDtoSchema,
  RefreshDtoSchema,
  RegisterDtoSchema,
} from '@pulz/shared';

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
export class LoginDto extends createZodDto(LoginDtoSchema) {}
export class RefreshDto extends createZodDto(RefreshDtoSchema) {}

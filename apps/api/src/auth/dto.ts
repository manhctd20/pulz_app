import { createZodDto } from 'nestjs-zod';
import {
  ChangePasswordDtoSchema,
  DeleteAccountDtoSchema,
  LoginDtoSchema,
  RefreshDtoSchema,
  RegisterDtoSchema,
  UpdateMeDtoSchema,
} from '@pulz/shared';

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
export class LoginDto extends createZodDto(LoginDtoSchema) {}
export class RefreshDto extends createZodDto(RefreshDtoSchema) {}
export class UpdateMeDto extends createZodDto(UpdateMeDtoSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordDtoSchema) {}
export class DeleteAccountDto extends createZodDto(DeleteAccountDtoSchema) {}

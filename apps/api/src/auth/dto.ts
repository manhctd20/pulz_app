import { createZodDto } from 'nestjs-zod';
import {
  ChangePasswordDtoSchema,
  DeleteAccountDtoSchema,
  ForgotPasswordDtoSchema,
  LoginDtoSchema,
  RefreshDtoSchema,
  RegisterDtoSchema,
  ResetPasswordDtoSchema,
  UpdateMeDtoSchema,
} from '@pulz/shared';

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
export class LoginDto extends createZodDto(LoginDtoSchema) {}
export class RefreshDto extends createZodDto(RefreshDtoSchema) {}
export class UpdateMeDto extends createZodDto(UpdateMeDtoSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordDtoSchema) {}
export class DeleteAccountDto extends createZodDto(DeleteAccountDtoSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordDtoSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordDtoSchema) {}

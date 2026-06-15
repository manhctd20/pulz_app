import { createZodDto } from 'nestjs-zod';
import {
  CreateGroupDtoSchema,
  JoinGroupDtoSchema,
  UpdateGroupDtoSchema,
} from '@pulz/shared';

export class CreateGroupDto extends createZodDto(CreateGroupDtoSchema) {}
export class JoinGroupDto extends createZodDto(JoinGroupDtoSchema) {}
export class UpdateGroupDto extends createZodDto(UpdateGroupDtoSchema) {}

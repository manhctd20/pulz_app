import { createZodDto } from 'nestjs-zod';
import { CreateHabitDtoSchema, UpdateHabitDtoSchema } from '@pulz/shared';

export class CreateHabitDto extends createZodDto(CreateHabitDtoSchema) {}
export class UpdateHabitDto extends createZodDto(UpdateHabitDtoSchema) {}

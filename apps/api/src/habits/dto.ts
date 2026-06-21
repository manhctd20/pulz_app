import { createZodDto } from 'nestjs-zod';
import { CheckInDtoSchema, CreateHabitDtoSchema, UpdateHabitDtoSchema } from '@pulz/shared';

export class CreateHabitDto extends createZodDto(CreateHabitDtoSchema) {}
export class UpdateHabitDto extends createZodDto(UpdateHabitDtoSchema) {}
export class CheckInDto extends createZodDto(CheckInDtoSchema) {}

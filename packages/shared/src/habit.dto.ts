import { z } from 'zod';

export const HabitFrequencySchema = z.enum(['daily', 'weekly']);
export type HabitFrequency = z.infer<typeof HabitFrequencySchema>;

export const HabitCategorySchema = z.enum([
  'health',
  'learning',
  'mindfulness',
  'lifestyle',
  'other',
]);
export type HabitCategory = z.infer<typeof HabitCategorySchema>;

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  color: z.string().nullable(),
  frequency: z.string(),
  reminderTime: z.string().nullable(),
  groupId: z.string().nullable(),
  category: HabitCategorySchema.nullable(),
  streakShieldEnabled: z.boolean(),
  createdAt: z.string(),
});
export type Habit = z.infer<typeof HabitSchema>;

export const HabitWithStatusSchema = HabitSchema.extend({
  doneToday: z.boolean(),
  currentStreak: z.number().int().nonnegative(),
});
export type HabitWithStatus = z.infer<typeof HabitWithStatusSchema>;

export const CreateHabitDtoSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  frequency: HabitFrequencySchema.default('daily'),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm')
    .optional(),
  groupId: z.string().optional(),
  category: HabitCategorySchema.optional(),
  streakShieldEnabled: z.boolean().optional(),
});
export type CreateHabitDto = z.infer<typeof CreateHabitDtoSchema>;

export const UpdateHabitDtoSchema = CreateHabitDtoSchema.partial();
export type UpdateHabitDto = z.infer<typeof UpdateHabitDtoSchema>;

export const CheckInResponseSchema = z.object({
  habitId: z.string(),
  date: z.string(),
  done: z.boolean(),
  currentStreak: z.number().int().nonnegative(),
});
export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;

export const HabitHistoryEntrySchema = z.object({
  date: z.string(),
  completed: z.boolean(),
});
export type HabitHistoryEntry = z.infer<typeof HabitHistoryEntrySchema>;

export const HabitHistoryResponseSchema = z.object({
  habitId: z.string(),
  days: z.number().int().positive(),
  entries: z.array(HabitHistoryEntrySchema),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  totalDone: z.number().int().nonnegative(),
});
export type HabitHistoryResponse = z.infer<typeof HabitHistoryResponseSchema>;

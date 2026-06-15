import { z } from 'zod';

import { UserSchema } from './user.dto';

export const GroupMemberRoleSchema = z.enum(['owner', 'admin', 'member']);
export type GroupMemberRole = z.infer<typeof GroupMemberRoleSchema>;

export const GroupSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  ownerId: z.string(),
  memberCount: z.number().int().nonnegative(),
  habitCount: z.number().int().nonnegative(),
  todayCheckIns: z.number().int().nonnegative(),
  todayTotal: z.number().int().nonnegative(),
  memberAvatars: z.array(z.string().nullable()),
  createdAt: z.string(),
});
export type GroupSummary = z.infer<typeof GroupSummarySchema>;

export const GroupMemberDetailSchema = z.object({
  user: UserSchema,
  role: GroupMemberRoleSchema,
  joinedAt: z.string(),
  todayDone: z.number().int().nonnegative(),
  todayTotal: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
});
export type GroupMemberDetail = z.infer<typeof GroupMemberDetailSchema>;

export const GroupHabitSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  doneCount: z.number().int().nonnegative(),
  totalMembers: z.number().int().nonnegative(),
});
export type GroupHabitSummary = z.infer<typeof GroupHabitSummarySchema>;

export const GroupDetailSchema = GroupSummarySchema.extend({
  members: z.array(GroupMemberDetailSchema),
  sharedHabits: z.array(GroupHabitSummarySchema),
});
export type GroupDetail = z.infer<typeof GroupDetailSchema>;

export const CreateGroupDtoSchema = z.object({
  name: z.string().min(1).max(60),
});
export type CreateGroupDto = z.infer<typeof CreateGroupDtoSchema>;

export const JoinGroupDtoSchema = z.object({
  code: z.string().length(6),
});
export type JoinGroupDto = z.infer<typeof JoinGroupDtoSchema>;

export const UpdateGroupDtoSchema = z.object({
  name: z.string().min(1).max(60),
});
export type UpdateGroupDto = z.infer<typeof UpdateGroupDtoSchema>;

import { z } from 'zod';

export const LeaderboardPeriodSchema = z.enum(['today', 'week', 'all']);
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodSchema>;

export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  totalCheckIns: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardResponseSchema = z.object({
  period: LeaderboardPeriodSchema,
  entries: z.array(LeaderboardEntrySchema),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

import { LeaderboardPeriod, LeaderboardResponseSchema } from '@pulz/shared';

import { api } from './client';

export async function getLeaderboard(groupId: string, period: LeaderboardPeriod) {
  const { data } = await api.get(`/groups/${groupId}/leaderboard`, { params: { period } });
  return LeaderboardResponseSchema.parse(data);
}

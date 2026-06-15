import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type Period = 'today' | 'week' | 'all';

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function periodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const today = todayUtc();
  if (period === 'today') return today;
  return addDays(today, -6);
}

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async forGroup(userId: string, groupId: string, periodRaw: string | undefined) {
    const period: Period =
      periodRaw === 'today' || periodRaw === 'week' || periodRaw === 'all'
        ? periodRaw
        : 'week';

    const isMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!isMember) throw new ForbiddenException('Not a member');

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    const start = periodStart(period);
    const where = {
      habit: { groupId },
      completed: true,
      ...(start ? { date: { gte: start } } : {}),
    };

    const grouped = await this.prisma.checkIn.groupBy({
      by: ['userId'],
      where,
      _count: { _all: true },
    });

    const counts = new Map<string, number>();
    for (const g of grouped) counts.set(g.userId, g._count._all);

    const entries = members
      .map((m) => ({
        userId: m.userId,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        totalCheckIns: counts.get(m.userId) ?? 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalCheckIns - a.totalCheckIns);

    let lastScore = -1;
    let lastRank = 0;
    entries.forEach((e, i) => {
      if (e.totalCheckIns !== lastScore) {
        lastRank = i + 1;
        lastScore = e.totalCheckIns;
      }
      e.rank = lastRank;
    });

    return { period, entries };
  }
}

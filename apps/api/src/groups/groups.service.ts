import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, JoinGroupDto, UpdateGroupDto } from './dto';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function calcStreak(dates: Date[], today: Date): number {
  const set = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  let cursor = today;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGroupDto) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      try {
        const group = await this.prisma.group.create({
          data: {
            code,
            name: dto.name,
            ownerId: userId,
            members: {
              create: { userId, role: 'owner' },
            },
          },
        });
        return this.buildSummary(group.id, userId);
      } catch (e: any) {
        if (e?.code === 'P2002') continue;
        throw e;
      }
    }
    throw new ConflictException('Could not generate unique code');
  }

  async join(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) throw new ConflictException('Already a member');

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'member' },
    });
    return this.buildSummary(group.id, userId);
  }

  async leave(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId === userId) {
      throw new BadRequestException('Owner cannot leave; delete the group instead');
    }
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
    return { ok: true };
  }

  async remove(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== userId) throw new ForbiddenException('Only owner can delete');
    await this.prisma.group.delete({ where: { id: groupId } });
    return { ok: true };
  }

  async update(userId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== userId) throw new ForbiddenException('Only owner can edit');
    await this.prisma.group.update({
      where: { id: groupId },
      data: { name: dto.name },
    });
    return this.buildSummary(groupId, userId);
  }

  async kickMember(ownerId: string, groupId: string, targetUserId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== ownerId) throw new ForbiddenException('Only owner can kick members');
    if (group.ownerId === targetUserId) {
      throw new BadRequestException('Owner cannot kick themselves; delete the group instead');
    }
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!membership) throw new NotFoundException('User is not a member');
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    return { ok: true };
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinedAt: 'asc' },
    });
    return Promise.all(memberships.map((m) => this.buildSummary(m.groupId, userId)));
  }

  async detail(userId: string, groupId: string) {
    const isMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!isMember) throw new ForbiddenException('Not a member');

    const summary = await this.buildSummary(groupId, userId);
    const today = todayUtc();

    const memberships = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          include: {
            habits: {
              where: { groupId },
              include: {
                checkIns: {
                  where: { date: { gte: addDays(today, -60) } },
                  select: { date: true, completed: true },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const todayKey = today.toISOString().slice(0, 10);

    const members = memberships.map((m) => {
      const habits = m.user.habits;
      const totalDates = new Set<string>();
      let todayDone = 0;
      let todayTotal = habits.length;
      for (const h of habits) {
        const hasTodayDone = h.checkIns.some(
          (c) => c.completed && c.date.toISOString().slice(0, 10) === todayKey,
        );
        if (hasTodayDone) todayDone++;
        for (const c of h.checkIns) {
          if (c.completed) totalDates.add(c.date.toISOString().slice(0, 10));
        }
      }
      const streak = calcStreak(
        Array.from(totalDates).map((s) => new Date(`${s}T00:00:00Z`)),
        today,
      );

      return {
        user: {
          id: m.user.id,
          email: m.user.email,
          displayName: m.user.displayName,
          avatarUrl: m.user.avatarUrl,
          createdAt: m.user.createdAt.toISOString(),
        },
        role: m.role as 'owner' | 'admin' | 'member',
        joinedAt: m.joinedAt.toISOString(),
        todayDone,
        todayTotal,
        currentStreak: streak,
      };
    });

    const sharedHabitsRaw = await this.prisma.habit.findMany({
      where: { groupId },
      include: {
        checkIns: { where: { date: today }, select: { completed: true } },
      },
    });
    const memberCount = members.length;
    const habitsByName = new Map<string, { id: string; name: string; emoji: string; doneCount: number }>();
    for (const h of sharedHabitsRaw) {
      const key = `${h.name}__${h.emoji}`;
      const doneToday = h.checkIns.some((c) => c.completed);
      const cur = habitsByName.get(key);
      if (cur) {
        if (doneToday) cur.doneCount++;
      } else {
        habitsByName.set(key, {
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          doneCount: doneToday ? 1 : 0,
        });
      }
    }
    const sharedHabits = Array.from(habitsByName.values()).map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      doneCount: h.doneCount,
      totalMembers: memberCount,
    }));

    return { ...summary, members, sharedHabits };
  }

  private async buildSummary(groupId: string, _userId: string) {
    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        members: {
          take: 4,
          include: { user: { select: { displayName: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, habits: true } },
      },
    });

    const today = todayUtc();
    const habits = await this.prisma.habit.findMany({
      where: { groupId },
      include: { checkIns: { where: { date: today }, select: { completed: true } } },
    });
    const todayCheckIns = habits.reduce(
      (sum, h) => sum + h.checkIns.filter((c) => c.completed).length,
      0,
    );
    const todayTotal = habits.length;

    return {
      id: group.id,
      code: group.code,
      name: group.name,
      ownerId: group.ownerId,
      memberCount: group._count.members,
      habitCount: group._count.habits,
      todayCheckIns,
      todayTotal,
      memberPreviews: group.members.map((m) => ({
        initial: (m.user.displayName.slice(0, 1) || '?').toUpperCase(),
        avatarUrl: m.user.avatarUrl,
      })),
      createdAt: group.createdAt.toISOString(),
    };
  }
}

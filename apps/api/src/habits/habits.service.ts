import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Habit, CheckIn } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateHabitDto, UpdateHabitDto } from './dto';

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function calcStreak(
  checkIns: Pick<CheckIn, 'date' | 'completed'>[],
  today: Date,
  shieldEnabled: boolean,
): number {
  const done = new Set(
    checkIns.filter((c) => c.completed).map((c) => c.date.toISOString().slice(0, 10)),
  );
  let streak = 0;
  let cursor = today;
  let shieldUsed = false;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (done.has(key)) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (shieldEnabled && !shieldUsed && streak > 0 && cursor.getTime() !== today.getTime()) {
      shieldUsed = true;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

const HABIT_CATEGORIES = ['health', 'learning', 'mindfulness', 'lifestyle', 'other'] as const;
type HabitCategory = (typeof HABIT_CATEGORIES)[number];

function normalizeCategory(value: string | null): HabitCategory | null {
  if (!value) return null;
  return (HABIT_CATEGORIES as readonly string[]).includes(value)
    ? (value as HabitCategory)
    : null;
}

function serializeHabit(h: Habit, doneToday: boolean, currentStreak: number) {
  return {
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    color: h.color,
    frequency: h.frequency,
    reminderTime: h.reminderTime,
    groupId: h.groupId,
    category: normalizeCategory(h.category),
    streakShieldEnabled: h.streakShieldEnabled,
    isShared: h.isShared,
    createdAt: h.createdAt.toISOString(),
    doneToday,
    currentStreak,
  };
}

@Injectable()
export class HabitsService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  async list(userId: string) {
    const today = todayUtc();
    const sharedGroupIds = (
      await this.prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      })
    ).map((m) => m.groupId);

    const habits = await this.prisma.habit.findMany({
      where: {
        OR: [
          { userId, isShared: false },
          { isShared: true, groupId: { in: sharedGroupIds } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        checkIns: {
          where: { userId, date: { gte: addDays(today, -60) } },
          select: { date: true, completed: true },
        },
      },
    });
    return habits.map((h) => {
      const streak = calcStreak(h.checkIns, today, h.streakShieldEnabled);
      const todayKey = today.toISOString().slice(0, 10);
      const doneToday = h.checkIns.some(
        (c) => c.completed && c.date.toISOString().slice(0, 10) === todayKey,
      );
      return serializeHabit(h, doneToday, streak);
    });
  }

  async create(userId: string, dto: CreateHabitDto) {
    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        emoji: dto.emoji,
        color: dto.color,
        frequency: dto.frequency,
        reminderTime: dto.reminderTime,
        groupId: dto.groupId,
        category: dto.category,
        streakShieldEnabled: dto.streakShieldEnabled ?? false,
        isShared: false,
      },
    });
    return serializeHabit(habit, false, 0);
  }

  async createShared(userId: string, groupId: string, dto: CreateHabitDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.ownerId !== userId) throw new ForbiddenException('Owner only');
    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        emoji: dto.emoji,
        color: dto.color,
        frequency: dto.frequency,
        reminderTime: dto.reminderTime,
        groupId,
        category: dto.category,
        streakShieldEnabled: dto.streakShieldEnabled ?? false,
        isShared: true,
      },
    });
    return serializeHabit(habit, false, 0);
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    const existing = await this.assertCanModify(userId, habitId);
    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        name: dto.name,
        emoji: dto.emoji,
        color: dto.color,
        frequency: dto.frequency,
        reminderTime: dto.reminderTime,
        groupId: existing.isShared ? existing.groupId : dto.groupId,
        category: dto.category,
        streakShieldEnabled: dto.streakShieldEnabled,
      },
    });
    const today = todayUtc();
    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, userId, date: { gte: addDays(today, -60) } },
      select: { date: true, completed: true },
    });
    const streak = calcStreak(checkIns, today, habit.streakShieldEnabled);
    const todayKey = today.toISOString().slice(0, 10);
    const doneToday = checkIns.some(
      (c) => c.completed && c.date.toISOString().slice(0, 10) === todayKey,
    );
    return serializeHabit(habit, doneToday, streak);
  }

  async remove(userId: string, habitId: string) {
    await this.assertCanModify(userId, habitId);
    await this.prisma.habit.delete({ where: { id: habitId } });
    return { ok: true };
  }

  async history(userId: string, habitId: string, days: number) {
    const habit = await this.assertCanCheck(userId, habitId);
    const today = todayUtc();
    const limit = Math.min(Math.max(days, 7), 365);
    const start = addDays(today, -(limit - 1));
    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, userId, date: { gte: start } },
      select: { date: true, completed: true, note: true },
    });
    const byDate = new Map(
      checkIns.map((c) => [c.date.toISOString().slice(0, 10), c]),
    );
    const entries: { date: string; completed: boolean; note: string | null }[] = [];
    for (let i = 0; i < limit; i++) {
      const d = addDays(start, i);
      const key = d.toISOString().slice(0, 10);
      const c = byDate.get(key);
      entries.push({
        date: key,
        completed: !!c?.completed,
        note: c?.note ?? null,
      });
    }

    const currentStreak = calcStreak(checkIns, today, habit.streakShieldEnabled);
    let longestStreak = 0;
    let running = 0;
    for (const e of entries) {
      if (e.completed) {
        running++;
        if (running > longestStreak) longestStreak = running;
      } else {
        running = 0;
      }
    }
    const totalDone = entries.filter((e) => e.completed).length;
    return { habitId, days: limit, entries, currentStreak, longestStreak, totalDone };
  }

  async toggleCheckIn(userId: string, habitId: string, note?: string) {
    const habit = await this.assertCanCheck(userId, habitId);
    const today = todayUtc();

    const existing = await this.prisma.checkIn.findUnique({
      where: { habitId_userId_date: { habitId, userId, date: today } },
    });

    let resultNote: string | null = null;
    if (existing) {
      const updated = await this.prisma.checkIn.update({
        where: { habitId_userId_date: { habitId, userId, date: today } },
        data: { completed: !existing.completed, note: note ?? existing.note },
      });
      resultNote = updated.note;
    } else {
      const created = await this.prisma.checkIn.create({
        data: { habitId, userId, date: today, completed: true, note: note ?? null },
      });
      resultNote = created.note;
    }

    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, userId, date: { gte: addDays(today, -60) } },
      select: { date: true, completed: true },
    });
    const streak = calcStreak(checkIns, today, habit.streakShieldEnabled);
    const todayKey = today.toISOString().slice(0, 10);
    const doneToday = checkIns.some(
      (c) => c.completed && c.date.toISOString().slice(0, 10) === todayKey,
    );

    // Nếu là shared habit và user vừa hoàn thành → push notify members khác.
    if (habit.isShared && habit.groupId && doneToday && !existing?.completed) {
      void this.notifySharedCheckIn(habit.id, habit.name, habit.emoji, habit.groupId, userId);
    }

    return {
      habitId,
      date: todayKey,
      done: doneToday,
      currentStreak: streak,
      note: resultNote,
    };
  }

  private async notifySharedCheckIn(
    habitId: string,
    habitName: string,
    habitEmoji: string,
    groupId: string,
    actorUserId: string,
  ) {
    const [actor, members] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: actorUserId },
        select: { displayName: true },
      }),
      this.prisma.groupMember.findMany({
        where: { groupId, userId: { not: actorUserId } },
        select: { userId: true },
      }),
    ]);
    if (!actor || members.length === 0) return;
    await this.push.sendToUsers(
      members.map((m) => m.userId),
      {
        title: `${habitEmoji} ${actor.displayName} vừa check-in`,
        body: `"${habitName}" — đến lượt bạn rồi!`,
        data: { type: 'shared-checkin', habitId, groupId },
      },
    );
  }

  private async assertCanCheck(userId: string, habitId: string): Promise<Habit> {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (!habit.isShared) {
      if (habit.userId !== userId) throw new ForbiddenException('Not your habit');
      return habit;
    }
    if (!habit.groupId) throw new ForbiddenException('Shared habit missing group');
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: habit.groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a group member');
    return habit;
  }

  private async assertCanModify(userId: string, habitId: string): Promise<Habit> {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (!habit.isShared) {
      if (habit.userId !== userId) throw new ForbiddenException('Not your habit');
      return habit;
    }
    if (!habit.groupId) throw new ForbiddenException('Shared habit missing group');
    const group = await this.prisma.group.findUnique({ where: { id: habit.groupId } });
    if (!group || group.ownerId !== userId) {
      throw new ForbiddenException('Owner only');
    }
    return habit;
  }
}

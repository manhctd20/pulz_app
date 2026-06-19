import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Habit, CheckIn } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
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
    // Cho phép 1 ngày miss được "che" bằng shield (chỉ 1 lần / streak).
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
    createdAt: h.createdAt.toISOString(),
    doneToday,
    currentStreak,
  };
}

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const today = todayUtc();
    const habits = await this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        checkIns: {
          where: { date: { gte: addDays(today, -60) } },
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
      },
    });
    return serializeHabit(habit, false, 0);
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.assertOwned(userId, habitId);
    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: dto,
    });
    const today = todayUtc();
    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, date: { gte: addDays(today, -60) } },
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
    await this.assertOwned(userId, habitId);
    await this.prisma.habit.delete({ where: { id: habitId } });
    return { ok: true };
  }

  async history(userId: string, habitId: string, days: number) {
    await this.assertOwned(userId, habitId);
    const habit = await this.prisma.habit.findUniqueOrThrow({ where: { id: habitId } });
    const today = todayUtc();
    const limit = Math.min(Math.max(days, 7), 365);
    const start = addDays(today, -(limit - 1));
    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, date: { gte: start } },
      select: { date: true, completed: true },
    });
    const doneSet = new Set(
      checkIns.filter((c) => c.completed).map((c) => c.date.toISOString().slice(0, 10)),
    );
    const entries: { date: string; completed: boolean }[] = [];
    for (let i = 0; i < limit; i++) {
      const d = addDays(start, i);
      const key = d.toISOString().slice(0, 10);
      entries.push({ date: key, completed: doneSet.has(key) });
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

  async toggleCheckIn(userId: string, habitId: string) {
    await this.assertOwned(userId, habitId);
    const today = todayUtc();

    const existing = await this.prisma.checkIn.findUnique({
      where: { habitId_date: { habitId, date: today } },
    });

    if (existing) {
      await this.prisma.checkIn.update({
        where: { habitId_date: { habitId, date: today } },
        data: { completed: !existing.completed },
      });
    } else {
      await this.prisma.checkIn.create({
        data: { habitId, userId, date: today, completed: true },
      });
    }

    const habit = await this.prisma.habit.findUniqueOrThrow({ where: { id: habitId } });
    const checkIns = await this.prisma.checkIn.findMany({
      where: { habitId, date: { gte: addDays(today, -60) } },
      select: { date: true, completed: true },
    });
    const streak = calcStreak(checkIns, today, habit.streakShieldEnabled);
    const todayKey = today.toISOString().slice(0, 10);
    const doneToday = checkIns.some(
      (c) => c.completed && c.date.toISOString().slice(0, 10) === todayKey,
    );
    return {
      habitId,
      date: todayKey,
      done: doneToday,
      currentStreak: streak,
    };
  }

  private async assertOwned(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.userId !== userId) throw new ForbiddenException('Not your habit');
  }
}

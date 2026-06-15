import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const USERS = [
  { email: 'minh@pulz.dev', displayName: 'Minh' },
  { email: 'lan@pulz.dev', displayName: 'Lan' },
  { email: 'huy@pulz.dev', displayName: 'Huy' },
  { email: 'mai@pulz.dev', displayName: 'Mai' },
  { email: 'an@pulz.dev', displayName: 'An' },
];

const HABIT_TEMPLATES = [
  { name: 'Uống đủ nước', emoji: '💧' },
  { name: 'Tập thể dục', emoji: '🏃' },
  { name: 'Ngủ trước 11h', emoji: '😴' },
  { name: 'Đọc sách 15 phút', emoji: '📖' },
  { name: 'Thiền 5 phút', emoji: '🧘' },
];

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

async function main() {
  console.log('🌱 Seeding...');

  await prisma.checkIn.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('password123');

  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: { email: u.email, displayName: u.displayName, passwordHash },
      }),
    ),
  );

  const group = await prisma.group.create({
    data: {
      code: 'DEMO01',
      name: 'Bạn thân',
      ownerId: users[0].id,
      members: {
        create: users.map((u, i) => ({
          userId: u.id,
          role: i === 0 ? 'owner' : 'member',
        })),
      },
    },
  });
  console.log(`  Group "${group.name}" — code: ${group.code}`);

  const today = todayUtc();

  for (const user of users) {
    const templates = pickRandom(HABIT_TEMPLATES, 3);
    for (const tpl of templates) {
      const habit = await prisma.habit.create({
        data: {
          userId: user.id,
          name: tpl.name,
          emoji: tpl.emoji,
          frequency: 'daily',
          groupId: Math.random() < 0.4 ? group.id : null,
        },
      });

      const checkIns: { habitId: string; userId: string; date: Date; completed: boolean }[] = [];
      for (let d = 0; d < 30; d++) {
        if (Math.random() < 0.72) {
          checkIns.push({
            habitId: habit.id,
            userId: user.id,
            date: addDays(today, -d),
            completed: true,
          });
        }
      }
      if (checkIns.length > 0) {
        await prisma.checkIn.createMany({ data: checkIns });
      }
    }
    console.log(`  ${user.displayName} — ${templates.length} habits`);
  }

  console.log('✅ Seed done. Login: minh@pulz.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

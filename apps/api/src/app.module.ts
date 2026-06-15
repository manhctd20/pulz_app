import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GroupsModule } from './groups/groups.module';
import { HabitsModule } from './habits/habits.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      skipIf: (context) => {
        const req = context.switchToHttp().getRequest();
        const url: string = req?.originalUrl ?? req?.url ?? '';
        return url.startsWith('/docs');
      },
    }),
    PrismaModule,
    AuthModule,
    HabitsModule,
    GroupsModule,
    LeaderboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private prisma: PrismaService) {}

  async saveToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });
    return { ok: true as const };
  }

  async clearToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: null },
    });
    return { ok: true as const };
  }

  // Gửi notification tới list user qua Expo Push Service (free, không cần SDK).
  async sendToUsers(userIds: string[], payload: { title: string; body: string; data?: Record<string, unknown> }) {
    if (userIds.length === 0) return;
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, expoPushToken: { not: null } },
      select: { expoPushToken: true },
    });
    const messages: ExpoPushMessage[] = users
      .filter((u): u is { expoPushToken: string } => !!u.expoPushToken)
      .map((u) => ({
        to: u.expoPushToken,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
      }));
    if (messages.length === 0) return;
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push failed: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      this.logger.error('Expo push error', e);
    }
  }
}

import type { HabitWithStatus } from '@pulz/shared';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SCHEDULED_PREFIX = 'pulz-habit-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function parseHHmm(s: string | null | undefined): { hour: number; minute: number } | null {
  if (!s) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

export async function syncHabitReminders(habits: HabitWithStatus[]): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => typeof n.identifier === 'string' && n.identifier.startsWith(SCHEDULED_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  for (const habit of habits) {
    const t = parseHHmm(habit.reminderTime);
    if (!t) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${SCHEDULED_PREFIX}${habit.id}`,
      content: {
        title: `${habit.emoji} ${habit.name}`,
        body: habit.doneToday ? 'Hôm nay đã check-in ✓' : 'Đã đến giờ check-in!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: t.hour,
        minute: t.minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  }
}

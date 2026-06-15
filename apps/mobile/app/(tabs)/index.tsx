import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { HabitCard } from '../../components/HabitCard';
import { HabitCardSkeleton } from '../../components/Skeleton';
import { PillBadge } from '../../components/PillBadge';
import { ProgressBar } from '../../components/ProgressBar';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useHabits, useToggleCheckIn } from '../../lib/api/queries';
import { hapticSuccess, hapticTap } from '../../lib/haptics';
import { syncHabitReminders } from '../../lib/notifications';
import { useColors } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';

const USER_RANK = 2;

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const habitsQuery = useHabits();
  const toggleMutation = useToggleCheckIn();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const habits = habitsQuery.data ?? [];

  useEffect(() => {
    if (habitsQuery.data) {
      void syncHabitReminders(habitsQuery.data);
    }
  }, [habitsQuery.data]);

  const done = habits.filter((h) => h.doneToday).length;
  const total = habits.length;
  const progress = total === 0 ? 0 : done / total;
  const userStreak = habits.reduce((m, h) => Math.max(m, h.currentStreak), 0);

  const userName = user?.displayName ?? 'Bạn';

  const onToggleHabit = (habitId: string, wasDone: boolean) => {
    if (wasDone) hapticTap();
    else hapticSuccess();
    toggleMutation.mutate(habitId);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={habitsQuery.isRefetching && !habitsQuery.isLoading}
            onRefresh={() => {
              hapticTap();
              void habitsQuery.refetch();
            }}
            tintColor={colors.primaryLight}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[Typography.headline, styles.greeting]}>
            {t('home.greeting', { name: userName })}
          </Text>
          <View style={styles.headerRight}>
            <PillBadge label={t('home.streakBadge', { days: userStreak })} tone="tertiary" />
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{userName.slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <GlassCard style={styles.progressCard}>
          <Text style={Typography.title}>{t('home.progressTitle')}</Text>
          <Text style={[Typography.bodySm, styles.progressSubtitle]}>
            {t('home.progressSubtitle', { done, total })}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarWrap}>
              <ProgressBar value={progress} gradient />
            </View>
            <View style={styles.progressStats}>
              <Text style={[Typography.number, styles.progressNumber]}>
                {done}/{total}
              </Text>
              <Text style={[Typography.label, styles.rank]}>
                {t('home.rank', { rank: USER_RANK })}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('home.habitsTitle')}</Text>
          {habitsQuery.isLoading ? (
            <View style={styles.habitList}>
              <HabitCardSkeleton />
              <HabitCardSkeleton />
              <HabitCardSkeleton />
            </View>
          ) : habitsQuery.isError ? (
            <Text style={[Typography.bodySm, styles.errorText]}>{t('home.errorLoading')}</Text>
          ) : habits.length === 0 ? (
            <EmptyState
              icon="add-circle-outline"
              emoji="✨"
              title={t('home.emptyTitle')}
              subtitle={t('home.empty')}
            />
          ) : (
            <View style={styles.habitList}>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  emoji={habit.emoji}
                  name={habit.name}
                  color={habit.color ?? undefined}
                  streakDays={habit.currentStreak}
                  done={habit.doneToday}
                  onToggle={() => onToggleHabit(habit.id, habit.doneToday)}
                  onPress={() => router.push(`/habit/${habit.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface.lowest },
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.base,
      paddingBottom: 140,
      gap: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing.md,
    },
    greeting: { flex: 1 },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    progressCard: { gap: Spacing.sm },
    progressSubtitle: { color: c.text.secondary },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      marginTop: Spacing.sm,
    },
    progressBarWrap: { flex: 1 },
    progressStats: { alignItems: 'flex-end', gap: 2 },
    progressNumber: { fontSize: 22, color: c.text.primary },
    rank: {
      color: c.primaryLight,
      backgroundColor: 'rgba(127, 119, 221, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    section: { gap: Spacing.md },
    habitList: { gap: Spacing.md },
    errorText: { color: c.error, textAlign: 'center', marginTop: Spacing.base },
  });
}


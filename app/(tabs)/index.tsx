import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '../../components/GlassCard';
import { HabitCard } from '../../components/HabitCard';
import { PillBadge } from '../../components/PillBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useHabitStore } from '../../store/useHabitStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const USER_RANK = 2;
const USER_STREAK_DAYS = 12;

export default function HomeScreen() {
  const { t } = useTranslation();
  const userName = useSettingsStore((s) => s.userName);
  const habits = useHabitStore((s) => s.habits);
  const toggleCheckIn = useHabitStore((s) => s.toggleCheckIn);

  const done = habits.filter((h) => h.done).length;
  const total = habits.length;
  const progress = total === 0 ? 0 : done / total;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[Typography.headline, styles.greeting]}>
            {t('home.greeting', { name: userName })}
          </Text>
          <View style={styles.headerRight}>
            <PillBadge label={t('home.streakBadge', { days: USER_STREAK_DAYS })} tone="tertiary" />
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
              <Text style={[Typography.label, styles.rank]}>{t('home.rank', { rank: USER_RANK })}</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('home.habitsTitle')}</Text>
          <View style={styles.habitList}>
            {habits.map((habit) => {
              const name = habit.nameKey ? t(habit.nameKey) : habit.nameRaw ?? '';
              return (
                <HabitCard
                  key={habit.id}
                  emoji={habit.emoji}
                  name={name}
                  streakDays={habit.streakDays}
                  done={habit.done}
                  onToggle={() => toggleCheckIn(habit.id)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.lowest,
  },
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
  greeting: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.manrope.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressCard: {
    gap: Spacing.sm,
  },
  progressSubtitle: {
    color: Colors.text.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
  progressBarWrap: {
    flex: 1,
  },
  progressStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  progressNumber: {
    fontSize: 22,
    color: Colors.text.primary,
  },
  rank: {
    color: Colors.primaryLight,
    backgroundColor: 'rgba(127, 119, 221, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  section: {
    gap: Spacing.md,
  },
  habitList: {
    gap: Spacing.md,
  },
});

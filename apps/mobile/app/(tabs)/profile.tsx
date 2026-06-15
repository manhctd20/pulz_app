import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useGroups, useHabits } from '../../lib/api/queries';
import { useColors } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

type Achievement = {
  key: string;
  emoji: string;
  labelKey: string;
  unlocked: boolean;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const cycleTheme = useSettingsStore((s) => s.cycleTheme);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const habits = useHabits();
  const groups = useGroups();

  const habitList = habits.data ?? [];
  const groupList = groups.data ?? [];

  const longestStreak = habitList.reduce((m, h) => Math.max(m, h.currentStreak), 0);
  const habitCount = habitList.length;
  const firstGroupName = groupList[0]?.name ?? '—';

  const joinedMonth = formatJoinedMonth(user?.createdAt, language);

  const achievements: Achievement[] = [
    {
      key: 'streak7',
      emoji: '🔥',
      labelKey: 'profile.achievementStreak7',
      unlocked: longestStreak >= 7,
    },
    {
      key: 'habit5',
      emoji: '⭐',
      labelKey: 'profile.achievementHabit5',
      unlocked: habitCount >= 5,
    },
    {
      key: 'group',
      emoji: '🏆',
      labelKey: 'profile.achievementGroup',
      unlocked: groupList.length >= 1,
    },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const onLogout = () => {
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  const comingSoon = () => Alert.alert(t('profile.comingSoon'));

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={Typography.headline}>{t('profile.title')}</Text>
          <Pressable hitSlop={8} onPress={comingSoon} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.userBlock}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {(user?.displayName ?? '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={Typography.title}>{user?.displayName}</Text>
          <Text style={[Typography.bodySm, { color: colors.text.muted }]}>{user?.email}</Text>
          {joinedMonth && (
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('profile.joinedMonth', { month: joinedMonth })}
            </Text>
          )}
          <Pressable onPress={comingSoon} style={styles.editBtn}>
            <Text style={styles.editText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={longestStreak} label={t('profile.statsLongestStreak')} emoji="🔥" />
          <StatCard value={habitCount} label={t('profile.statsHabitCount')} emoji="✨" />
          <StatCard value={firstGroupName} label={t('profile.statsRank')} emoji="👥" />
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('profile.achievementsTitle')}</Text>
          <View style={styles.achievementGrid}>
            {achievements.map((a) => (
              <View
                key={a.key}
                style={[styles.achievement, !a.unlocked && styles.achievementLocked]}
              >
                <Text style={{ fontSize: 32, opacity: a.unlocked ? 1 : 0.3 }}>{a.emoji}</Text>
                <Text
                  style={[Typography.label, { color: a.unlocked ? colors.text.primary : colors.text.muted, textAlign: 'center' }]}
                >
                  {t(a.labelKey)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('profile.settingsTitle')}</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="notifications-outline"
              label={t('profile.settingNotifications')}
              value={t('profile.comingSoon')}
              onPress={comingSoon}
            />
            <SettingRow
              icon={theme === 'light' ? 'sunny-outline' : theme === 'system' ? 'phone-portrait-outline' : 'moon-outline'}
              label={t('profile.settingTheme')}
              value={
                theme === 'light'
                  ? t('profile.settingThemeLight')
                  : theme === 'system'
                    ? t('profile.settingThemeSystem')
                    : t('profile.settingThemeDark')
              }
              onPress={cycleTheme}
            />
            <SettingRow
              icon="language-outline"
              label={t('profile.settingLanguage')}
              value={language === 'vi' ? t('profile.settingLanguageVi') : t('profile.settingLanguageEn')}
              onPress={toggleLanguage}
            />
            <SettingRow
              icon="person-circle-outline"
              label={t('profile.settingAccount')}
              value={t('profile.comingSoon')}
              onPress={comingSoon}
              showDivider={false}
            />
          </View>

          <View style={styles.settingsCard}>
            <SettingRow
              icon="help-circle-outline"
              label={t('profile.settingHelp')}
              onPress={comingSoon}
              showDivider={false}
            />
          </View>
        </View>

        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  emoji,
}: {
  value: number | string;
  label: string;
  emoji: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={[Typography.number, styles.statValue]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[Typography.label, { color: colors.text.muted, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  showDivider = true,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <>
      <Pressable onPress={onPress} style={styles.settingRow}>
        <Ionicons name={icon} size={20} color={colors.text.secondary} />
        <Text style={[Typography.bodyLg, { flex: 1 }]}>{label}</Text>
        {value && (
          <Text style={[Typography.bodySm, { color: colors.text.muted }]}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.text.inactive} />
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

function formatJoinedMonth(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userBlock: {
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.base,
    },
    avatarLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    avatarText: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 36,
      color: '#FFFFFF',
    },
    editBtn: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.base,
      paddingVertical: 8,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.glass.border,
    },
    editText: {
      fontFamily: FontFamily.manrope.semibold,
      fontSize: 13,
      color: c.text.primary,
    },
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statCard: {
      flex: 1,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    statValue: { fontSize: 22 },
    section: { gap: Spacing.md },
    achievementGrid: { flexDirection: 'row', gap: Spacing.sm },
    achievement: {
      flex: 1,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    achievementLocked: { backgroundColor: c.surface.base },
    settingsCard: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: Spacing.base + 20 + Spacing.md,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 180, 171, 0.3)',
      marginTop: Spacing.base,
    },
    logoutText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.error,
    },
  });
}

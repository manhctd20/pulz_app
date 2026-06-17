import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../../components/Toast';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useGroups, useHabits } from '../../lib/api/queries';
import { hapticSelection, hapticTap } from '../../lib/haptics';
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
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const cycleTheme = useSettingsStore((s) => s.cycleTheme);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const habits = useHabits();
  const groups = useGroups();

  const habitList = habits.data ?? [];
  const groupList = groups.data ?? [];

  const longestStreak = habitList.reduce((m, h) => Math.max(m, h.currentStreak), 0);
  const habitCount = habitList.length;
  const firstGroupName = groupList[0]?.name ?? '—';

  const joinedMonth = formatJoinedMonth(user?.createdAt, language);

  const achievements: Achievement[] = [
    { key: 'streak7', emoji: '🔥', labelKey: 'profile.achievementStreak7', unlocked: longestStreak >= 7 },
    { key: 'habit5', emoji: '⭐', labelKey: 'profile.achievementHabit5', unlocked: habitCount >= 5 },
    { key: 'group', emoji: '🏆', labelKey: 'profile.achievementGroup', unlocked: groupList.length >= 1 },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const toggleLanguage = () => {
    hapticSelection();
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const onCycleTheme = () => {
    hapticSelection();
    cycleTheme();
  };

  const onLogout = () => {
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const comingSoon = () => {
    hapticTap();
    Alert.alert(t('profile.comingSoon'));
  };

  const openEdit = () => {
    hapticTap();
    setEditName(user?.displayName ?? '');
    setEditError(null);
    setEditVisible(true);
  };

  const submitEdit = async () => {
    setEditError(null);
    setEditSaving(true);
    try {
      await updateProfile(editName.trim());
      setEditVisible(false);
      toast.show(t('profile.editSaved'), 'success');
    } catch (e: any) {
      setEditError(e?.response?.data?.message ?? e?.message ?? 'Error');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleNotifications = (value: boolean) => {
    hapticSelection();
    setNotificationsEnabled(value);
    toast.show(value ? t('profile.notifEnabled') : t('profile.notifDisabled'), 'info');
  };

  const goAccount = () => {
    hapticTap();
    router.push('/account');
  };
  const goHelp = () => {
    hapticTap();
    router.push('/help');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[
              colors.primary + '38',
              colors.secondary + '22',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
            pointerEvents="none"
          />
          <View style={styles.heroContent}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarInner}
              >
                <Text style={styles.avatarText}>
                  {(user?.displayName ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <Text style={[Typography.headline, styles.userName]}>{user?.displayName}</Text>
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>{user?.email}</Text>
            {joinedMonth && (
              <Text style={[Typography.bodySm, styles.joined]}>
                {t('profile.joinedMonth', { month: joinedMonth })}
              </Text>
            )}
            <Pressable onPress={openEdit} style={styles.editBtn}>
              <Ionicons name="create-outline" size={14} color={colors.text.primary} />
              <Text style={styles.editText}>{t('profile.editProfile')}</Text>
            </Pressable>
          </View>
        </View>

        {/* STATS — hero streak + 2 small */}
        <View style={styles.statsBlock}>
          <View style={styles.heroStat}>
            <LinearGradient
              colors={['rgba(255, 159, 135, 0.22)', 'rgba(255, 159, 135, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={{ fontSize: 32 }}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('profile.longestStreakLabel')}
              </Text>
              <View style={styles.heroStatNumberRow}>
                <Text style={styles.heroStatNumber}>{longestStreak}</Text>
                <Text style={[Typography.bodySm, { color: colors.text.muted, marginBottom: 6 }]}>
                  {' '}
                  {t('profile.longestStreakUnit')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.smallStatsRow}>
            <View style={styles.smallStat}>
              <Text style={{ fontSize: 18 }}>✨</Text>
              <Text style={[Typography.number, styles.smallStatValue]}>{habitCount}</Text>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('profile.statsHabitCount')}
              </Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={{ fontSize: 18 }}>👥</Text>
              <Text style={[Typography.bodyLgMedium, styles.smallStatGroup]} numberOfLines={1}>
                {firstGroupName}
              </Text>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('profile.statsRank')}
              </Text>
            </View>
          </View>
        </View>

        {/* ACHIEVEMENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={Typography.title}>{t('profile.achievementsTitle')}</Text>
            <Text style={[Typography.label, { color: colors.text.muted }]}>
              {t('profile.achievementProgress', {
                done: unlockedCount,
                total: achievements.length,
              })}
            </Text>
          </View>
          <View style={styles.achievementGrid}>
            {achievements.map((a) => (
              <View key={a.key} style={styles.achievementWrap}>
                {a.unlocked ? (
                  <LinearGradient
                    colors={['rgba(127, 119, 221, 0.22)', 'rgba(93, 202, 165, 0.18)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.achievement}
                  >
                    <Text style={{ fontSize: 34 }}>{a.emoji}</Text>
                    <Text style={[Typography.label, styles.achievementLabel]}>
                      {t(a.labelKey)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.achievement, styles.achievementLocked]}>
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={10} color={colors.text.muted} />
                    </View>
                    <Text style={{ fontSize: 34, opacity: 0.25 }}>{a.emoji}</Text>
                    <Text
                      style={[
                        Typography.label,
                        styles.achievementLabel,
                        { color: colors.text.muted },
                      ]}
                    >
                      {t(a.labelKey)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* SETTINGS */}
        <View style={styles.section}>
          <Text style={Typography.title}>{t('profile.settingsTitle')}</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="notifications-outline"
              iconBg="rgba(255, 159, 135, 0.2)"
              iconFg="#FF9F87"
              label={t('profile.settingNotifications')}
              trailing={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ true: colors.primary, false: colors.surface.high }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingRow
              icon={theme === 'light' ? 'sunny-outline' : theme === 'system' ? 'phone-portrait-outline' : 'moon-outline'}
              iconBg="rgba(127, 119, 221, 0.2)"
              iconFg="#C5C0FF"
              label={t('profile.settingTheme')}
              value={
                theme === 'light'
                  ? t('profile.settingThemeLight')
                  : theme === 'system'
                    ? t('profile.settingThemeSystem')
                    : t('profile.settingThemeDark')
              }
              onPress={onCycleTheme}
            />
            <SettingRow
              icon="language-outline"
              iconBg="rgba(93, 202, 165, 0.2)"
              iconFg="#6EDAB4"
              label={t('profile.settingLanguage')}
              value={
                language === 'vi'
                  ? t('profile.settingLanguageVi')
                  : t('profile.settingLanguageEn')
              }
              onPress={toggleLanguage}
            />
            <SettingRow
              icon="person-circle-outline"
              iconBg="rgba(140, 132, 235, 0.2)"
              iconFg="#C5C0FF"
              label={t('profile.settingAccount')}
              onPress={goAccount}
              showDivider={false}
            />
          </View>

          <View style={styles.settingsCard}>
            <SettingRow
              icon="help-circle-outline"
              iconBg="rgba(127, 119, 221, 0.15)"
              iconFg={colors.text.secondary}
              label={t('profile.settingHelp')}
              onPress={goHelp}
              showDivider={false}
            />
          </View>
        </View>

        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalSheet}>
            <Text style={Typography.title}>{t('profile.editTitle')}</Text>
            <View style={{ gap: Spacing.xs }}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('profile.editNameLabel')}
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={colors.text.muted}
                style={styles.modalInput}
                autoFocus
                maxLength={50}
              />
            </View>
            {editError && (
              <Text style={[Typography.bodySm, { color: colors.error }]}>{editError}</Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmBtn,
                  (editSaving || !editName.trim()) && { opacity: 0.6 },
                ]}
                onPress={submitEdit}
                disabled={editSaving || !editName.trim()}
              >
                {editSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  iconBg,
  iconFg,
  label,
  value,
  trailing,
  onPress,
  showDivider = true,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconFg: string;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Inner = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIconBubble, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconFg} />
      </View>
      <Text style={[Typography.bodyLg, { flex: 1 }]}>{label}</Text>
      {trailing
        ? trailing
        : (
          <>
            {value && (
              <Text style={[Typography.bodySm, { color: colors.text.muted }]}>{value}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.text.inactive} />
          </>
        )}
    </View>
  );
  return (
    <>
      {onPress ? <Pressable onPress={onPress}>{Inner}</Pressable> : Inner}
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
      paddingTop: Spacing.sm,
      paddingBottom: 140,
      gap: Spacing.lg,
    },
    // HERO
    hero: {
      marginHorizontal: -Spacing.screen,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      position: 'relative',
    },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    heroContent: { alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.screen },
    avatarRing: {
      width: 108,
      height: 108,
      borderRadius: 54,
      padding: 4,
      backgroundColor: c.glass.border,
      marginBottom: Spacing.sm,
      shadowColor: c.primary,
      shadowOpacity: 0.4,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    avatarInner: {
      flex: 1,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 42,
      color: '#FFFFFF',
    },
    userName: { marginTop: Spacing.xs },
    joined: { color: c.text.muted, marginTop: 2 },
    editBtn: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: 8,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.glass.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: c.surface.container,
    },
    editText: {
      fontFamily: FontFamily.manrope.semibold,
      fontSize: 13,
      color: c.text.primary,
    },
    // STATS
    statsBlock: { gap: Spacing.sm },
    heroStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.lg,
      overflow: 'hidden',
    },
    heroStatNumberRow: { flexDirection: 'row', alignItems: 'flex-end' },
    heroStatNumber: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 40,
      color: c.text.primary,
      lineHeight: 44,
    },
    smallStatsRow: { flexDirection: 'row', gap: Spacing.sm },
    smallStat: {
      flex: 1,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    smallStatValue: { fontSize: 24, color: c.text.primary },
    smallStatGroup: { fontSize: 16, color: c.text.primary },
    // ACHIEVEMENTS
    section: { gap: Spacing.md },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    achievementGrid: { flexDirection: 'row', gap: Spacing.sm },
    achievementWrap: { flex: 1 },
    achievement: {
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: Spacing.xs,
      overflow: 'hidden',
      minHeight: 110,
      justifyContent: 'center',
    },
    achievementLocked: { backgroundColor: c.surface.base, position: 'relative' },
    lockBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.surface.high,
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementLabel: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
    // SETTINGS
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
      paddingVertical: 12,
    },
    settingIconBubble: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: Spacing.base + 32 + Spacing.md,
    },
    // LOGOUT
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
    // MODAL
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.surface.container,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      gap: Spacing.base,
      paddingBottom: Spacing.xl,
    },
    modalInput: {
      backgroundColor: c.surface.high,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      height: 52,
      color: c.text.primary,
      fontFamily: FontFamily.beVietnam.regular,
      fontSize: 16,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.sm },
    modalCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.glass.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: { fontFamily: FontFamily.manrope.bold, color: c.text.primary },
    modalConfirmBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.xl,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalConfirmText: { fontFamily: FontFamily.manrope.bold, color: '#FFFFFF' },
  });
}

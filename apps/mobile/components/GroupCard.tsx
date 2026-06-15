import { Ionicons } from '@expo/vector-icons';
import { GroupSummary } from '@pulz/shared';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import { useColors } from '../lib/theme';
import { ProgressBar } from './ProgressBar';

type Props = {
  group: GroupSummary;
};

export function GroupCard({ group }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = group.todayTotal === 0 ? 0 : group.todayCheckIns / group.todayTotal;

  return (
    <Link href={`/group/${group.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name="people" size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={Typography.title}>{group.name}</Text>
            <Text style={[Typography.bodySm, styles.meta]}>
              {t('groups.memberCount', { count: group.memberCount })} ·{' '}
              {t('groups.habitCount', { count: group.habitCount })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </View>

        <View style={styles.progressBlock}>
          <ProgressBar value={progress} gradient />
          <Text style={[Typography.bodySm, styles.progressText]}>
            {t('groups.todayProgress', { done: group.todayCheckIns, total: group.todayTotal })}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.avatarStack}>
            {group.memberAvatars.slice(0, 3).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.avatar,
                  { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
                ]}
              >
                <Text style={styles.avatarText}>{'?'}</Text>
              </View>
            ))}
            {group.memberCount > 3 && (
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.avatarText}>+{group.memberCount - 3}</Text>
              </View>
            )}
          </View>
          <Text style={[Typography.label, styles.code]}>{group.code}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(127,119,221,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    meta: { color: c.text.muted },
    progressBlock: { gap: Spacing.xs },
    progressText: { color: c.text.secondary },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    avatarStack: { flexDirection: 'row' },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surface.high,
      borderWidth: 2,
      borderColor: c.surface.container,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarMore: { backgroundColor: c.primaryContainer, marginLeft: -10 },
    avatarText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 11,
      color: '#FFFFFF',
    },
    code: {
      color: c.primaryLight,
      backgroundColor: 'rgba(127,119,221,0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
  });
}

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

type Props = {
  emoji: string;
  name: string;
  streakDays: number;
  done: boolean;
  color?: string;
  onToggle: () => void;
  onPress?: () => void;
};

export function HabitCard({ emoji, name, streakDays, done, color, onToggle, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const iconBg = color ? hexToRgba(color, 0.18) : undefined;
  const iconBorder = color ? hexToRgba(color, 0.5) : undefined;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.card}>
      <View
        style={[
          styles.iconBox,
          iconBg && { backgroundColor: iconBg, borderWidth: 1, borderColor: iconBorder },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={Typography.bodyLgMedium}>{name}</Text>
        <Text style={Typography.bodySm}>{t('home.streakSuffix', { days: streakDays })}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? t('home.checkedIn') : t('home.notCheckedIn')}
        style={[styles.check, done ? styles.checkDone : styles.checkPending]}
      >
        {done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </Pressable>
    </Pressable>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: c.surface.high,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 22 },
    info: { flex: 1, gap: 2 },
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: { backgroundColor: c.secondary },
    checkPending: {
      borderWidth: 1.5,
      borderColor: c.text.inactive,
    },
  });
}

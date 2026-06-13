import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

type Props = {
  emoji: string;
  name: string;
  streakDays: number;
  done: boolean;
  onToggle: () => void;
};

export function HabitCard({ emoji, name, streakDays, done, onToggle }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.container,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface.high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: Colors.secondary,
  },
  checkPending: {
    borderWidth: 1.5,
    borderColor: Colors.text.inactive,
  },
});

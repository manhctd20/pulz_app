import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  action?: ReactNode;
  emoji?: string;
};

export function EmptyState({ icon, title, subtitle, action, emoji }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[
          'rgba(127, 119, 221, 0.18)',
          'rgba(93, 202, 165, 0.18)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBubble}
      >
        {emoji ? (
          <Text style={{ fontSize: 48 }}>{emoji}</Text>
        ) : (
          <Ionicons name={icon} size={52} color={colors.primaryLight} />
        )}
      </LinearGradient>
      <Text style={[Typography.title, styles.title]}>{title}</Text>
      {subtitle && (
        <Text style={[Typography.bodySm, { color: colors.text.muted, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  iconBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: { textAlign: 'center' },
  action: { marginTop: Spacing.base },
});

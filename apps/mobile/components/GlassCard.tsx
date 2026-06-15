import { BlurView } from 'expo-blur';
import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { useColors, useScheme } from '../lib/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassCard({ children, style, intensity = 20 }: Props) {
  const colors = useColors();
  const scheme = useScheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.shadow, style]}>
      <BlurView intensity={intensity} tint={scheme} style={styles.blur}>
        <View style={styles.overlay}>{children}</View>
      </BlurView>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    shadow: {
      borderRadius: Radius.lg,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    blur: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glass.border,
    },
    overlay: {
      backgroundColor: c.glass.bg,
      padding: Spacing.base,
    },
  });
}

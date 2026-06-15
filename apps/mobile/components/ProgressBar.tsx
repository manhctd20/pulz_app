import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ColorPalette } from '../constants/colors';
import { useColors } from '../lib/theme';

type Props = {
  value: number;
  gradient?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ value, gradient = false, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, style]}>
      {gradient ? (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${clamped * 100}%` }]}
        />
      ) : (
        <View style={[styles.fill, styles.solidFill, { width: `${clamped * 100}%` }]} />
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: c.surface.high,
      overflow: 'hidden',
    },
    fill: {
      height: 4,
      borderRadius: 2,
    },
    solidFill: {
      backgroundColor: c.secondary,
    },
  });
}

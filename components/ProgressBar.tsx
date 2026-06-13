import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors } from '../constants/colors';

type Props = {
  value: number;
  gradient?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ value, gradient = false, style }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, style]}>
      {gradient ? (
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
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

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface.high,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  solidFill: {
    backgroundColor: Colors.secondary,
  },
});

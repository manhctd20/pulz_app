import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import { useColors } from '../lib/theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 14, radius = 6, style }: Props) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surface.high,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HabitCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface.container,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <Skeleton width={36} height={36} radius={8} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width={'70%' as `${number}%`} height={16} />
        <Skeleton width={'40%' as `${number}%`} height={12} />
      </View>
      <Skeleton width={22} height={22} radius={11} />
    </View>
  );
}

export function GroupCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={{
        gap: 12,
        backgroundColor: colors.surface.container,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={36} height={36} radius={8} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width={'60%' as `${number}%`} height={18} />
          <Skeleton width={'40%' as `${number}%`} height={12} />
        </View>
      </View>
      <Skeleton height={4} radius={2} />
      <Skeleton width={'80%' as `${number}%`} height={12} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={80} height={20} radius={999} />
        <Skeleton width={60} height={20} radius={999} />
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ColorPalette } from '../constants/colors';
import { Radius } from '../constants/spacing';
import { hapticSelection, hapticTap } from '../lib/haptics';
import { useColors, useScheme } from '../lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  groups: { active: 'people', inactive: 'people-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const scheme = useScheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tabWidth, setTabWidth] = useState(0);
  const dotX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth === 0) return;
    const target = state.index * tabWidth + tabWidth / 2 - 2;
    dotX.value = withSpring(target, { damping: 18, stiffness: 200, mass: 0.6 });
  }, [state.index, tabWidth, dotX]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dotX.value }],
  }));

  const onPillLayout = (e: LayoutChangeEvent) => {
    const total = e.nativeEvent.layout.width - 18; // trừ paddingHorizontal 9*2
    setTabWidth(total / state.routes.length);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + 4 }]}
    >
      <View style={styles.row}>
        <View style={styles.pillShadow}>
          <BlurView intensity={40} tint={scheme} style={styles.pill}>
            <View style={styles.pillOverlay} onLayout={onPillLayout}>
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const icons = TAB_ICONS[route.name] ?? TAB_ICONS.index;
                const iconName = isFocused ? icons.active : icons.inactive;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    hapticSelection();
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={styles.tab}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                  >
                    <Ionicons
                      name={iconName}
                      size={26}
                      color={isFocused ? colors.primaryLight : colors.text.inactive}
                    />
                  </Pressable>
                );
              })}
              {tabWidth > 0 && (
                <Animated.View style={[styles.dot, dotStyle]} pointerEvents="none" />
              )}
            </View>
          </BlurView>
        </View>

        <Pressable
          onPress={() => {
            hapticTap();
            router.push('/add-habit');
          }}
          style={styles.fabShadow}
          accessibilityRole="button"
          accessibilityLabel="Add habit"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 14,
      right: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pillShadow: {
      flex: 1,
      borderRadius: Radius.full,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.55,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
        },
        android: { elevation: 12 },
        default: {},
      }),
    },
    pill: {
      height: 64,
      borderRadius: Radius.full,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glass.border,
    },
    pillOverlay: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.glass.pillBg,
      paddingHorizontal: 9,
    },
    tab: {
      flex: 1,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      position: 'absolute',
      bottom: 12,
      left: 9,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.primaryLight,
    },
    fabShadow: {
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOpacity: 0.6,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 10 },
        default: {},
      }),
    },
    fab: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

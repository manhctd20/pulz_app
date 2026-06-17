import { Ionicons } from '@expo/vector-icons';
import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

type Variant = 'success' | 'info' | 'error';

type ToastState = {
  message: string;
  variant: Variant;
  visible: boolean;
};

type ToastContextValue = {
  show: (message: string, variant?: Variant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    message: '',
    variant: 'info',
    visible: false,
  });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => setState((s) => ({ ...s, visible: false })));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, variant: Variant = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setState({ message, variant, visible: true });
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 200,
          mass: 0.6,
          useNativeDriver: true,
        }),
      ]).start();
      timer.current = setTimeout(hide, 2200);
    },
    [opacity, translateY, hide],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {state.visible && <ToastView state={state} opacity={opacity} translateY={translateY} />}
    </ToastContext.Provider>
  );
}

function ToastView({
  state,
  opacity,
  translateY,
}: {
  state: ToastState;
  opacity: Animated.Value;
  translateY: Animated.Value;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const accent =
    state.variant === 'success'
      ? colors.success
      : state.variant === 'error'
        ? colors.error
        : colors.primary;
  const icon =
    state.variant === 'success'
      ? 'checkmark-circle'
      : state.variant === 'error'
        ? 'alert-circle'
        : 'information-circle';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { top: insets.top + 8, opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface.container,
            borderColor: accent + '88',
            shadowColor: '#000',
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={accent} />
        <Text style={[Typography.bodyLgMedium, styles.text]} numberOfLines={2}>
          {state.message}
        </Text>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.screen,
    right: Spacing.screen,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    maxWidth: '100%',
  },
  text: { flexShrink: 1 },
});

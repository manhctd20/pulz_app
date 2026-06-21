import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import { hapticSelection } from '../lib/haptics';
import { useColors } from '../lib/theme';
import { useSettingsStore } from '../store/useSettingsStore';

const { width: SCREEN_W } = Dimensions.get('window');

type Slide = {
  heroEmoji: string;
  smallEmojis: string[];
  gradient: [string, string, string];
  titleKey: string;
  subtitleKey: string;
};

const SLIDES: Slide[] = [
  {
    heroEmoji: '🔥',
    smallEmojis: ['💧', '🏃', '📖'],
    gradient: ['#7F77DD', '#C5C0FF', '#5DCAA5'],
    titleKey: 'onboarding.s1Title',
    subtitleKey: 'onboarding.s1Subtitle',
  },
  {
    heroEmoji: '✨',
    smallEmojis: ['📝', '🎯', '⏰'],
    gradient: ['#5DCAA5', '#6EDAB4', '#7F77DD'],
    titleKey: 'onboarding.s2Title',
    subtitleKey: 'onboarding.s2Subtitle',
  },
  {
    heroEmoji: '👥',
    smallEmojis: ['🤝', '💬', '🎉'],
    gradient: ['#FF9F87', '#C5C0FF', '#7F77DD'],
    titleKey: 'onboarding.s3Title',
    subtitleKey: 'onboarding.s3Subtitle',
  },
  {
    heroEmoji: '🏆',
    smallEmojis: ['🥇', '🥈', '🥉'],
    gradient: ['#FFD700', '#FF9F87', '#7F77DD'],
    titleKey: 'onboarding.s4Title',
    subtitleKey: 'onboarding.s4Subtitle',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const markOnboarded = useSettingsStore((s) => s.markOnboarded);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) {
      hapticSelection();
      setIndex(i);
    }
  };

  const goToRegister = () => {
    markOnboarded();
    router.replace('/register');
  };
  const goToLogin = () => {
    markOnboarded();
    router.replace('/login');
  };
  const next = () => {
    if (isLast) return goToRegister();
    scrollRef.current?.scrollTo({ x: SCREEN_W * (index + 1), animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ width: 60 }} />
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        {isLast ? (
          <View style={{ width: 60 }} />
        ) : (
          <Pressable onPress={goToRegister} hitSlop={10} style={styles.skipBtn}>
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('onboarding.skip')}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.scroll}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.heroWrap}>
              <LinearGradient
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroInner}>
                  <Text style={styles.heroEmoji}>{s.heroEmoji}</Text>
                  <View style={styles.heroSmallRow}>
                    {s.smallEmojis.map((e, j) => (
                      <Text key={j} style={styles.heroEmojiSmall}>
                        {e}
                      </Text>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.copy}>
              <Text style={Typography.display}>{t(s.titleKey)}</Text>
              <Text style={[Typography.bodyLg, styles.subtitle]}>{t(s.subtitleKey)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable onPress={next} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>
            {isLast ? t('onboarding.primaryCta') : t('onboarding.next')}
          </Text>
        </Pressable>
        {isLast && (
          <Pressable onPress={goToLogin} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>{t('onboarding.secondaryCta')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface.lowest,
      paddingBottom: Spacing.xl,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    dots: { flexDirection: 'row', gap: 6 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.surface.container,
    },
    dotActive: {
      width: 24,
      backgroundColor: c.primaryLight,
    },
    skipBtn: {
      width: 60,
      alignItems: 'flex-end',
      paddingVertical: Spacing.xs,
    },
    scroll: { flex: 1 },
    slide: { width: SCREEN_W, paddingHorizontal: Spacing.screen },
    heroWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 260,
    },
    heroGradient: {
      width: 220,
      height: 220,
      borderRadius: 110,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOpacity: 0.5,
      shadowRadius: 36,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    heroInner: {
      alignItems: 'center',
      gap: Spacing.sm,
    },
    heroEmoji: { fontSize: 88 },
    heroSmallRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    heroEmojiSmall: { fontSize: 26 },
    copy: {
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    subtitle: {
      color: c.text.secondary,
    },
    actions: { gap: Spacing.sm, paddingHorizontal: Spacing.screen },
    primaryBtn: {
      backgroundColor: c.primary,
      height: 56,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    secondaryBtn: {
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryText: {
      fontFamily: FontFamily.beVietnam.medium,
      fontSize: 14,
      color: c.primaryLight,
    },
  });
}

import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import { useColors } from '../lib/theme';
import { useSettingsStore } from '../store/useSettingsStore';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const markOnboarded = useSettingsStore((s) => s.markOnboarded);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goToRegister = () => {
    markOnboarded();
    router.replace('/register');
  };
  const goToLogin = () => {
    markOnboarded();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={[colors.primary, colors.primaryContainer, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroInner}>
            <Text style={styles.heroEmoji}>🔥</Text>
            <View style={styles.heroSmallRow}>
              <Text style={styles.heroEmojiSmall}>💧</Text>
              <Text style={styles.heroEmojiSmall}>🏃</Text>
              <Text style={styles.heroEmojiSmall}>📖</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.copy}>
        <Text style={Typography.display}>{t('onboarding.title')}</Text>
        <Text style={[Typography.bodyLg, styles.subtitle]}>{t('onboarding.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={goToRegister} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>{t('onboarding.primaryCta')}</Text>
        </Pressable>
        <Pressable onPress={goToLogin} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>{t('onboarding.secondaryCta')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface.lowest,
      paddingHorizontal: Spacing.screen,
      paddingBottom: Spacing.xl,
    },
    heroWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 280,
    },
    heroGradient: {
      width: 240,
      height: 240,
      borderRadius: 120,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOpacity: 0.5,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    heroInner: {
      alignItems: 'center',
      gap: Spacing.sm,
    },
    heroEmoji: { fontSize: 92 },
    heroSmallRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    heroEmojiSmall: { fontSize: 28 },
    copy: {
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    subtitle: {
      color: c.text.secondary,
    },
    actions: { gap: Spacing.sm },
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

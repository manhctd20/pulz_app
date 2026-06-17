import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

export default function HelpScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const faqs = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
  ];

  const email = t('help.contactEmail');
  const onContact = () => {
    void Linking.openURL(`mailto:${email}?subject=PulzApp%20feedback`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={Typography.title}>{t('help.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[Typography.bodyLg, { color: colors.text.secondary }]}>
          {t('help.intro')}
        </Text>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('help.faqTitle')}</Text>
          <View style={{ gap: Spacing.md }}>
            {faqs.map((item, i) => (
              <View key={i} style={styles.card}>
                <Text style={[Typography.bodyLgMedium, styles.q]}>{item.q}</Text>
                <Text style={[Typography.bodySm, { color: colors.text.secondary }]}>
                  {item.a}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('help.contactTitle')}</Text>
          <Text style={[Typography.bodySm, { color: colors.text.secondary }]}>
            {t('help.contactBody')}
          </Text>
          <Pressable style={styles.contactBtn} onPress={onContact}>
            <Ionicons name="mail" size={18} color={colors.primaryLight} />
            <Text style={styles.contactText}>{email}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface.lowest },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingBottom: Spacing.xl,
      gap: Spacing.lg,
    },
    section: { gap: Spacing.sm },
    card: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: Spacing.xs,
    },
    q: { fontSize: 15 },
    contactBtn: {
      marginTop: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(127, 119, 221, 0.4)',
      backgroundColor: 'rgba(127, 119, 221, 0.1)',
    },
    contactText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.primaryLight,
      fontSize: 14,
    },
  });
}

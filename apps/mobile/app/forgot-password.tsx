import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../components/Toast';
import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import * as authApi from '../lib/api/auth';
import { useColors } from '../lib/theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      toast.show(t('auth.forgotSent'), 'success');
      if (res.devToken) setDevToken(res.devToken);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ width: 36 }} />
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header2}>
          <Text style={Typography.display}>{t('auth.forgotTitle')}</Text>
          <Text style={[Typography.bodyLg, styles.subtitle]}>{t('auth.forgotSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[Typography.label, styles.label]}>{t('auth.forgotEmailLabel')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={loading || !email.trim()}
            style={[styles.button, (loading || !email.trim()) && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.forgotSubmit')}</Text>
            )}
          </Pressable>

          {devToken && (
            <View style={styles.devBox}>
              <Text style={[Typography.label, { color: colors.tertiary }]}>
                {t('auth.forgotDevTokenLabel')}
              </Text>
              <Text selectable style={styles.devToken}>
                {devToken}
              </Text>
            </View>
          )}

          <Pressable
            style={styles.linkBtn}
            onPress={() => router.push({ pathname: '/reset-password', params: { token: devToken ?? '' } })}
          >
            <Text style={[Typography.bodySm, styles.linkText]}>{t('auth.haveToken')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    inner: {
      flex: 1,
      paddingHorizontal: Spacing.screen,
      justifyContent: 'center',
      gap: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    header2: { gap: Spacing.sm },
    subtitle: { color: c.text.secondary },
    form: { gap: Spacing.base },
    field: { gap: Spacing.xs },
    label: { color: c.text.muted },
    input: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      height: 52,
      color: c.text.primary,
      fontFamily: FontFamily.beVietnam.regular,
      fontSize: 16,
    },
    error: { color: c.error, fontFamily: FontFamily.beVietnam.regular },
    button: {
      backgroundColor: c.primary,
      height: 52,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
    },
    buttonText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    devBox: {
      gap: Spacing.xs,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 159, 135, 0.4)',
      backgroundColor: 'rgba(255, 159, 135, 0.08)',
    },
    devToken: {
      fontFamily: FontFamily.manrope.bold,
      color: c.text.primary,
      fontSize: 12,
    },
    linkBtn: { alignSelf: 'center', padding: Spacing.sm },
    linkText: { color: c.primaryLight },
  });
}

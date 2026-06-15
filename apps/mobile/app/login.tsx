import { Link } from 'expo-router';
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

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import { useColors } from '../lib/theme';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('minh@pulz.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? t('auth.loginError');
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={Typography.display}>PulzApp</Text>
          <Text style={[Typography.bodyLg, styles.subtitle]}>{t('auth.loginSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[Typography.label, styles.label]}>{t('auth.email')}</Text>
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

          <View style={styles.field}>
            <Text style={[Typography.label, styles.label]}>{t('auth.password')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.login')}</Text>
            )}
          </Pressable>

          <Link href="/register" asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={[Typography.bodySm, styles.linkText]}>
                {t('auth.noAccount')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface.lowest },
    inner: {
      flex: 1,
      paddingHorizontal: Spacing.screen,
      justifyContent: 'center',
      gap: Spacing.xl,
    },
    header: { gap: Spacing.sm },
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
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    linkBtn: { alignSelf: 'center', padding: Spacing.sm },
    linkText: { color: c.primaryLight },
  });
}

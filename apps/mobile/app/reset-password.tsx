import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword });
      toast.show(t('auth.resetSuccess'), 'success');
      router.replace('/login');
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
          <Text style={Typography.display}>{t('auth.resetTitle')}</Text>
          <Text style={[Typography.bodyLg, styles.subtitle]}>{t('auth.resetSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[Typography.label, styles.label]}>{t('auth.resetTokenLabel')}</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder="abc123..."
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              multiline={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={[Typography.label, styles.label]}>
              {t('auth.resetNewPasswordLabel')}
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.text.muted}
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={loading || token.length < 8 || newPassword.length < 8}
            style={[
              styles.button,
              (loading || token.length < 8 || newPassword.length < 8) && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.resetSubmit')}</Text>
            )}
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
  });
}

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { useColors } from '../lib/theme';
import { useAuthStore } from '../store/useAuthStore';

export default function AccountScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const changePassword = useAuthStore((s) => s.changePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onChangePassword = async () => {
    setChangeError(null);
    setChanging(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast.show(t('account.changeSuccess'), 'success');
    } catch (e: any) {
      setChangeError(
        e?.response?.data?.message ?? e?.message ?? t('home.errorLoading'),
      );
    } finally {
      setChanging(false);
    }
  };

  const onDelete = () => {
    Alert.alert(t('account.deleteConfirmTitle'), t('account.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.deleteButton'),
        style: 'destructive',
        onPress: async () => {
          setDeleteError(null);
          setDeleting(true);
          try {
            await deleteAccount(deletePassword);
            // sau xoá, AuthGate sẽ redirect /onboarding
          } catch (e: any) {
            setDeleteError(
              e?.response?.data?.message ?? e?.message ?? t('home.errorLoading'),
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={Typography.title}>{t('account.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Email row */}
          <View style={styles.section}>
            <Text style={[Typography.label, { color: colors.text.muted }]}>
              {t('account.emailLabel')}
            </Text>
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
              <Text style={Typography.bodyLg}>{user?.email}</Text>
            </View>
          </View>

          {/* Change password */}
          <View style={styles.section}>
            <Text style={Typography.title}>{t('account.changePasswordTitle')}</Text>
            <View style={styles.field}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('account.currentPassword')}
              </Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.text.muted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('account.newPassword')}
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
            {changeError && <Text style={styles.error}>{changeError}</Text>}
            <Pressable
              onPress={onChangePassword}
              disabled={changing || !currentPassword || newPassword.length < 8}
              style={[
                styles.primaryBtn,
                (changing || !currentPassword || newPassword.length < 8) && {
                  opacity: 0.6,
                },
              ]}
            >
              {changing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>{t('account.changeButton')}</Text>
              )}
            </Pressable>
          </View>

          {/* Delete account */}
          <View style={styles.dangerZone}>
            <Text style={[Typography.title, { color: colors.error }]}>
              {t('account.deleteTitle')}
            </Text>
            <Text style={[Typography.bodySm, { color: colors.text.secondary }]}>
              {t('account.deleteWarning')}
            </Text>
            <View style={styles.field}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('account.deletePasswordLabel')}
              </Text>
              <TextInput
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.text.muted}
                style={styles.input}
              />
            </View>
            {deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <Pressable
              onPress={onDelete}
              disabled={deleting || !deletePassword}
              style={[
                styles.dangerBtn,
                (deleting || !deletePassword) && { opacity: 0.5 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={styles.dangerText}>{t('account.deleteButton')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
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
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingBottom: Spacing.xl,
      gap: Spacing.lg,
    },
    section: { gap: Spacing.sm },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surface.container,
      paddingHorizontal: Spacing.base,
      height: 52,
      borderRadius: Radius.lg,
    },
    field: { gap: Spacing.xs },
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
    primaryBtn: {
      backgroundColor: c.primary,
      height: 48,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
    },
    primaryText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    dangerZone: {
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 180, 171, 0.35)',
      backgroundColor: 'rgba(255, 180, 171, 0.06)',
    },
    dangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 180, 171, 0.55)',
      marginTop: Spacing.sm,
    },
    dangerText: { fontFamily: FontFamily.manrope.bold, color: c.error },
  });
}

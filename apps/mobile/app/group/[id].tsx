import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '../../components/GlassCard';
import { ProgressBar } from '../../components/ProgressBar';
import { useToast } from '../../components/Toast';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import {
  useDeleteGroup,
  useGroupDetail,
  useKickMember,
  useLeaveGroup,
  useUpdateGroup,
} from '../../lib/api/queries';
import { useColors } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const modalStyles = useMemo(() => makeModalStyles(colors), [colors]);
  const detail = useGroupDetail(id);
  const leaveMutation = useLeaveGroup();
  const kickMutation = useKickMember();
  const deleteGroupMutation = useDeleteGroup();
  const updateMutation = useUpdateGroup();
  const toast = useToast();

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  if (detail.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primaryLight} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[Typography.bodyLg, styles.error]}>{t('home.errorLoading')}</Text>
      </SafeAreaView>
    );
  }

  const group = detail.data;
  const progress = group.todayTotal === 0 ? 0 : group.todayCheckIns / group.todayTotal;
  const isOwner = group.ownerId === user?.id;

  const onLeave = () => {
    Alert.alert(group.name, t('groupDetail.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.leave'),
        style: 'destructive',
        onPress: async () => {
          await leaveMutation.mutateAsync(group.id);
          router.back();
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert(group.name, t('groupDetail.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteGroupMutation.mutateAsync(group.id);
          router.back();
        },
      },
    ]);
  };

  const onKick = (memberUserId: string, memberName: string) => {
    Alert.alert(t('groupDetail.kickMember'), t('groupDetail.kickConfirm', { name: memberName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groupDetail.kickMember'),
        style: 'destructive',
        onPress: () => {
          void kickMutation.mutateAsync({ groupId: group.id, userId: memberUserId });
        },
      },
    ]);
  };

  const openRename = () => {
    setRenameValue(group.name);
    setRenameError(null);
    setRenameVisible(true);
  };

  const submitRename = async () => {
    setRenameError(null);
    try {
      await updateMutation.mutateAsync({ id: group.id, dto: { name: renameValue.trim() } });
      setRenameVisible(false);
    } catch (e: any) {
      setRenameError(e?.response?.data?.message ?? e?.message ?? 'Error');
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(group.code);
    toast.show(t('groups.codeCopied'), 'success');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={Typography.title} numberOfLines={1}>
          {group.name}
        </Text>
        {isOwner ? (
          <Pressable onPress={openRename} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={22} color={colors.text.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.infoCard}>
          <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
            {t('groups.memberCount', { count: group.memberCount })} ·{' '}
            {t('groups.habitCount', { count: group.habitCount })}
          </Text>
          <Pressable style={styles.codeRow} onPress={copyCode} hitSlop={6}>
            <Text style={Typography.label}>
              {t('groups.inviteCode', { code: group.code })}
            </Text>
            <Ionicons name="copy-outline" size={16} color={colors.primaryLight} />
          </Pressable>
          <View style={styles.progressBlock}>
            <ProgressBar value={progress} gradient />
            <Text style={[Typography.bodySm, { color: colors.text.secondary }]}>
              {t('groups.todayProgress', {
                done: group.todayCheckIns,
                total: group.todayTotal,
              })}
            </Text>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={Typography.title}>{t('groupDetail.sharedHabitsTitle')}</Text>
            {isOwner && (
              <Pressable
                onPress={() => router.push(`/add-habit?sharedGroupId=${id}`)}
                hitSlop={10}
                style={styles.addSharedBtn}
              >
                <Ionicons name="add" size={18} color={colors.primaryLight} />
                <Text style={[Typography.label, { color: colors.primaryLight }]}>
                  {t('groupDetail.addShared')}
                </Text>
              </Pressable>
            )}
          </View>
          {group.sharedHabits.length === 0 ? (
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('groupDetail.noSharedHabits')}
            </Text>
          ) : (
            <View style={styles.list}>
              {group.sharedHabits.map((h) => (
                <View key={h.id} style={styles.habitRow}>
                  <View style={styles.habitIcon}>
                    <Text style={{ fontSize: 22 }}>{h.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.bodyLgMedium}>{h.name}</Text>
                    <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
                      {t('groupDetail.sharedHabitsCount', {
                        done: h.doneCount,
                        total: h.totalMembers,
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('groupDetail.membersTitle')}</Text>
          <View style={styles.list}>
            {group.members.map((m) => {
              const isMe = m.user.id === user?.id;
              const canKick = isOwner && !isMe;
              return (
                <Pressable
                  key={m.user.id}
                  onLongPress={canKick ? () => onKick(m.user.id, m.user.displayName) : undefined}
                  style={styles.memberRow}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {m.user.displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.bodyLgMedium}>{m.user.displayName}</Text>
                    <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
                      {t(`groupDetail.role${capitalize(m.role)}`)} · 🔥 {m.currentStreak}
                    </Text>
                  </View>
                  <Text style={[Typography.label, styles.memberStat]}>
                    {m.todayDone}/{m.todayTotal}
                  </Text>
                  {canKick && (
                    <Pressable
                      onPress={() => onKick(m.user.id, m.user.displayName)}
                      hitSlop={8}
                      style={styles.kickBtn}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {isOwner ? (
          <Pressable onPress={onDelete} style={styles.dangerBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.dangerText}>{t('groupDetail.deleteGroup')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onLeave} style={styles.dangerBtn}>
            <Ionicons name="exit-outline" size={18} color={colors.error} />
            <Text style={styles.dangerText}>{t('common.leave')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal
        visible={renameVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRenameVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={modalStyles.backdrop}
        >
          <View style={modalStyles.sheet}>
            <Text style={Typography.title}>{t('groupDetail.renameTitle')}</Text>
            <View style={{ gap: Spacing.xs }}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('groupDetail.renameLabel')}
              </Text>
              <TextInput
                value={renameValue}
                onChangeText={setRenameValue}
                placeholderTextColor={colors.text.muted}
                style={modalStyles.input}
                autoFocus
              />
            </View>
            {renameError && <Text style={modalStyles.error}>{renameError}</Text>}
            <View style={modalStyles.actions}>
              <Pressable
                style={modalStyles.cancelBtn}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={modalStyles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  modalStyles.confirmBtn,
                  (updateMutation.isPending || !renameValue.trim()) && { opacity: 0.6 },
                ]}
                onPress={submitRename}
                disabled={updateMutation.isPending || !renameValue.trim()}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.confirmText}>{t('common.save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
      paddingBottom: 60,
      gap: Spacing.lg,
    },
    infoCard: { gap: Spacing.sm },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(127,119,221,0.15)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.full,
    },
    progressBlock: { gap: Spacing.xs, marginTop: Spacing.xs },
    section: { gap: Spacing.md },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addSharedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(127,119,221,0.15)',
    },
    list: { gap: Spacing.sm },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.surface.container,
      padding: Spacing.md,
      borderRadius: Radius.lg,
    },
    habitIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: c.surface.high,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.surface.container,
      padding: Spacing.md,
      borderRadius: Radius.lg,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInitial: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    memberStat: {
      color: c.primaryLight,
      backgroundColor: 'rgba(127,119,221,0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    kickBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 180, 171, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 180, 171, 0.3)',
    },
    dangerText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.error,
    },
    error: { color: c.error, textAlign: 'center', marginTop: 80 },
  });
}

function makeModalStyles(c: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface.container,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      gap: Spacing.base,
      paddingBottom: Spacing.xl,
    },
    input: {
      backgroundColor: c.surface.high,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      height: 52,
      color: c.text.primary,
      fontFamily: FontFamily.beVietnam.regular,
      fontSize: 16,
    },
    error: { color: c.error, fontFamily: FontFamily.beVietnam.regular },
    actions: { flexDirection: 'row', gap: Spacing.sm },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.text.primary,
    },
    confirmBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.xl,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmText: {
      fontFamily: FontFamily.manrope.bold,
      color: '#FFFFFF',
    },
  });
}

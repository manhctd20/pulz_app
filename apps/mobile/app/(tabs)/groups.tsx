import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState';
import { GroupCard } from '../../components/GroupCard';
import { GroupCardSkeleton } from '../../components/Skeleton';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useCreateGroup, useGroups, useJoinGroup } from '../../lib/api/queries';
import { hapticSelection, hapticTap } from '../../lib/haptics';
import { useColors } from '../../lib/theme';

type ModalKind = 'create' | 'join' | null;

export default function GroupsScreen() {
  const { t } = useTranslation();
  const groupsQuery = useGroups();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [modal, setModal] = useState<ModalKind>(null);

  const groups = groupsQuery.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={groupsQuery.isRefetching && !groupsQuery.isLoading}
            onRefresh={() => {
              hapticTap();
              void groupsQuery.refetch();
            }}
            tintColor={colors.primaryLight}
          />
        }
      >
        <Text style={Typography.headline}>{t('groups.title')}</Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              hapticSelection();
              setModal('create');
            }}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{t('groups.createNew')}</Text>
          </Pressable>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              hapticSelection();
              setModal('join');
            }}
          >
            <Ionicons name="enter-outline" size={18} color={colors.text.primary} />
            <Text style={styles.ghostBtnText}>{t('groups.joinByCode')}</Text>
          </Pressable>
        </View>

        {groupsQuery.isLoading ? (
          <View style={styles.list}>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </View>
        ) : groupsQuery.isError ? (
          <Text style={styles.error}>{t('home.errorLoading')}</Text>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            emoji="👥"
            title={t('groups.emptyTitle')}
            subtitle={t('groups.emptySubtitle')}
          />
        ) : (
          <View style={styles.list}>
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateGroupModal visible={modal === 'create'} onClose={() => setModal(null)} />
      <JoinGroupModal visible={modal === 'join'} onClose={() => setModal(null)} />
    </SafeAreaView>
  );
}

function CreateGroupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const modalStyles = useMemo(() => makeModalStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateGroup();

  const onSubmit = async () => {
    setError(null);
    try {
      await mutation.mutateAsync({ name: name.trim() });
      setName('');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.backdrop}
      >
        <View style={modalStyles.sheet}>
          <Text style={Typography.title}>{t('groups.createTitle')}</Text>
          <View style={{ gap: Spacing.xs }}>
            <Text style={[Typography.label, { color: colors.text.muted }]}>
              {t('groups.createNameLabel')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('groups.createNamePlaceholder')}
              placeholderTextColor={colors.text.muted}
              style={modalStyles.input}
              autoFocus
            />
          </View>
          {error && <Text style={modalStyles.error}>{error}</Text>}
          <View style={modalStyles.actions}>
            <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.confirmBtn, mutation.isPending && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.confirmText}>{t('common.create')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function JoinGroupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const modalStyles = useMemo(() => makeModalStyles(colors), [colors]);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useJoinGroup();

  const onSubmit = async () => {
    setError(null);
    try {
      await mutation.mutateAsync({ code: code.trim().toUpperCase() });
      setCode('');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.backdrop}
      >
        <View style={modalStyles.sheet}>
          <Text style={Typography.title}>{t('groups.joinTitle')}</Text>
          <View style={{ gap: Spacing.xs }}>
            <Text style={[Typography.label, { color: colors.text.muted }]}>
              {t('groups.joinCodeLabel')}
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder={t('groups.joinCodePlaceholder')}
              placeholderTextColor={colors.text.muted}
              style={modalStyles.input}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
          </View>
          {error && <Text style={modalStyles.error}>{error}</Text>}
          <View style={modalStyles.actions}>
            <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.confirmBtn, mutation.isPending && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={mutation.isPending || code.length !== 6}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.confirmText}>{t('common.join')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface.lowest },
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.base,
      paddingBottom: 140,
      gap: Spacing.lg,
    },
    actions: { flexDirection: 'row', gap: Spacing.sm },
    primaryBtn: {
      flex: 1,
      backgroundColor: c.primary,
      height: 48,
      borderRadius: Radius.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    primaryBtnText: {
      fontFamily: FontFamily.manrope.bold,
      color: '#FFFFFF',
      fontSize: 14,
    },
    ghostBtn: {
      flex: 1,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    ghostBtnText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.text.primary,
      fontSize: 14,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    emptySub: { color: c.text.muted, textAlign: 'center' },
    list: { gap: Spacing.md },
    error: { color: c.error, textAlign: 'center' },
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

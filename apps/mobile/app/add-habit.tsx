import { Ionicons } from '@expo/vector-icons';
import { HabitFrequency } from '@pulz/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

import type { ColorPalette } from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';
import { FontFamily, Typography } from '../constants/typography';
import {
  useCreateHabit,
  useDeleteHabit,
  useGroups,
  useHabits,
  useUpdateHabit,
} from '../lib/api/queries';
import { useColors } from '../lib/theme';

const EMOJIS = ['💧', '🏃', '😴', '📚', '🧘', '🥗', '✏️', '🎵', '🌱'];
const COLORS = ['#7F77DD', '#5DCAA5', '#FF9F87', '#C5C0FF', '#6EDAB4'];

export default function AddHabitScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ habitId?: string }>();
  const editingId = params.habitId;
  const isEdit = !!editingId;

  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const groupsQuery = useGroups();
  const habitsQuery = useHabits();
  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();
  const deleteMutation = useDeleteHabit();

  const existing = useMemo(
    () => habitsQuery.data?.find((h) => h.id === editingId),
    [habitsQuery.data, editingId],
  );

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💧');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [reminderTime, setReminderTime] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isEdit || hydrated || !existing) return;
    setName(existing.name);
    setEmoji(existing.emoji);
    setColor(existing.color ?? undefined);
    setFrequency((existing.frequency as HabitFrequency) ?? 'daily');
    setReminderTime(existing.reminderTime ?? '');
    setGroupId(existing.groupId ?? undefined);
    setHydrated(true);
  }, [isEdit, hydrated, existing]);

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSave = async () => {
    setError(null);
    try {
      const dto = {
        name: name.trim(),
        emoji,
        color,
        frequency,
        reminderTime: reminderTime.trim() || undefined,
        groupId,
      };
      if (isEdit && editingId) {
        await updateMutation.mutateAsync({ id: editingId, dto });
      } else {
        await createMutation.mutateAsync(dto);
      }
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? t('addHabit.saveError'));
    }
  };

  const onDelete = () => {
    if (!editingId) return;
    Alert.alert(t('addHabit.deleteTitle'), t('addHabit.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(editingId);
            router.back();
          } catch (e: any) {
            setError(e?.message ?? 'Error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={Typography.title}>
          {isEdit ? t('addHabit.editTitle') : t('addHabit.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.nameLabel')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('addHabit.namePlaceholder')}
              placeholderTextColor={colors.text.muted}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.emojiLabel')}</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[styles.emojiBox, emoji === e && styles.emojiBoxActive]}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.colorLabel')}</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.frequencyLabel')}</Text>
            <View style={styles.segment}>
              {(['daily', 'weekly'] as HabitFrequency[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={[styles.segmentBtn, frequency === f && styles.segmentBtnActive]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      frequency === f && styles.segmentTextActive,
                    ]}
                  >
                    {f === 'daily' ? t('addHabit.frequencyDaily') : t('addHabit.frequencyWeekly')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.reminderLabel')}</Text>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder={t('addHabit.reminderPlaceholder')}
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>

          <View style={styles.section}>
            <Text style={[Typography.label, styles.label]}>{t('addHabit.groupLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Pressable
                onPress={() => setGroupId(undefined)}
                style={[styles.chip, !groupId && styles.chipActive]}
              >
                <Text style={[styles.chipText, !groupId && styles.chipTextActive]}>
                  {t('addHabit.groupNone')}
                </Text>
              </Pressable>
              {(groupsQuery.data ?? []).map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setGroupId(g.id)}
                  style={[styles.chip, groupId === g.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, groupId === g.id && styles.chipTextActive]}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSave}
            disabled={!name.trim() || busy}
            style={[styles.saveBtn, (!name.trim() || busy) && { opacity: 0.6 }]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{t('addHabit.save')}</Text>
            )}
          </Pressable>

          {isEdit && (
            <Pressable onPress={onDelete} disabled={busy} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>{t('addHabit.delete')}</Text>
            </Pressable>
          )}
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
    section: { gap: Spacing.xs },
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
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    emojiBox: {
      width: 52,
      height: 52,
      borderRadius: Radius.md,
      backgroundColor: c.surface.container,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiBoxActive: { borderColor: c.primary },
    colorRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    colorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorDotActive: { borderColor: '#FFFFFF' },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.surface.container,
      borderRadius: Radius.full,
      padding: 4,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radius.full,
      alignItems: 'center',
    },
    segmentBtnActive: { backgroundColor: c.primary },
    segmentText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.text.muted,
      fontSize: 13,
    },
    segmentTextActive: { color: '#FFFFFF' },
    chipRow: { gap: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 10,
      borderRadius: Radius.full,
      backgroundColor: c.surface.container,
    },
    chipActive: { backgroundColor: 'rgba(127,119,221,0.18)' },
    chipText: {
      fontFamily: FontFamily.manrope.semibold,
      color: c.text.muted,
      fontSize: 13,
    },
    chipTextActive: { color: c.primaryLight },
    error: { color: c.error, textAlign: 'center' },
    saveBtn: {
      backgroundColor: c.primary,
      height: 52,
      borderRadius: Radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      height: 48,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 180, 171, 0.3)',
    },
    deleteText: {
      fontFamily: FontFamily.manrope.bold,
      color: c.error,
    },
  });
}

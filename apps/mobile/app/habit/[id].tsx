import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../../components/Toast';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useHabitHistory, useHabits, useToggleCheckIn } from '../../lib/api/queries';
import { hapticSuccess } from '../../lib/haptics';
import { useColors } from '../../lib/theme';

const DAYS = 30;
const COLUMNS = 7;
const CELL_SIZE = 36;
const CELL_GAP = 6;

export default function HabitDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habits = useHabits();
  const historyQuery = useHabitHistory(id, DAYS);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const toggleMutation = useToggleCheckIn();
  const toast = useToast();
  const [noteDraft, setNoteDraft] = useState('');
  const [noteHydrated, setNoteHydrated] = useState(false);

  const habit = useMemo(() => habits.data?.find((h) => h.id === id), [habits.data, id]);

  // Nếu habits đã load xong mà không tìm thấy habit (vd vừa xoá) → tự back về.
  useEffect(() => {
    if (!habits.isLoading && habits.data && !habit) {
      router.back();
    }
  }, [habits.isLoading, habits.data, habit]);

  const todayEntry = historyQuery.data?.entries[historyQuery.data.entries.length - 1];
  useEffect(() => {
    if (!noteHydrated && todayEntry) {
      setNoteDraft(todayEntry.note ?? '');
      setNoteHydrated(true);
    }
  }, [noteHydrated, todayEntry]);

  if (historyQuery.isLoading || habits.isLoading || !habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={Typography.title}>{t('habitDetail.title')}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ActivityIndicator color={colors.primaryLight} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const h = historyQuery.data!;
  const grid = buildGrid(h.entries);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={Typography.title} numberOfLines={1}>
          {habit.emoji} {habit.name}
        </Text>
        <Pressable
          onPress={() => router.push(`/add-habit?habitId=${habit.id}`)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name="create-outline" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard
            value={h.currentStreak}
            label={t('habitDetail.currentStreak')}
            emoji="🔥"
            styles={styles}
            mutedColor={colors.text.muted}
          />
          <StatCard
            value={h.longestStreak}
            label={t('habitDetail.longestStreak')}
            emoji="🏆"
            styles={styles}
            mutedColor={colors.text.muted}
          />
          <StatCard
            value={h.totalDone}
            label={t('habitDetail.totalDone')}
            emoji="✨"
            styles={styles}
            mutedColor={colors.text.muted}
          />
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('habitDetail.heatmapTitle')}</Text>
          <View style={styles.grid}>
            {grid.map((cell, i) => (
              <View
                key={i}
                style={[
                  styles.cell,
                  cell ? (cell.completed ? styles.cellDone : styles.cellPending) : styles.cellEmpty,
                ]}
              >
                {cell && (
                  <Text
                    style={[
                      styles.cellLabel,
                      cell.completed ? styles.cellLabelDone : styles.cellLabelPending,
                    ]}
                  >
                    {parseInt(cell.date.slice(8, 10), 10)}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, styles.cellPending]} />
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('home.notCheckedIn')}
            </Text>
            <View style={[styles.legendDot, styles.cellDone, { marginLeft: Spacing.base }]} />
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('home.checkedIn')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={Typography.title}>{t('habitDetail.todayNoteTitle')}</Text>
          <TextInput
            value={noteDraft}
            onChangeText={(v) => setNoteDraft(v.slice(0, 280))}
            placeholder={t('habitDetail.todayNotePlaceholder')}
            placeholderTextColor={colors.text.muted}
            style={styles.noteInput}
            multiline
            maxLength={280}
          />
          <View style={styles.noteFooter}>
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {noteDraft.length}/280
            </Text>
            <Pressable
              onPress={() => {
                if (!habit) return;
                toggleMutation.mutate(
                  { habitId: habit.id, note: noteDraft },
                  {
                    onSuccess: () => {
                      hapticSuccess();
                      toast.show(t('habitDetail.noteSaved'), 'success');
                    },
                  },
                );
              }}
              disabled={toggleMutation.isPending}
              style={[styles.noteSaveBtn, toggleMutation.isPending && { opacity: 0.6 }]}
            >
              <Text style={styles.noteSaveText}>{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>

        {(h.entries.some((e) => e.note) || false) && (
          <View style={styles.section}>
            <Text style={Typography.title}>{t('habitDetail.notesHistoryTitle')}</Text>
            <View style={styles.notesList}>
              {h.entries
                .filter((e) => !!e.note)
                .reverse()
                .map((e, i) => (
                  <View key={`${e.date}-${i}`} style={styles.noteRow}>
                    <Text style={[Typography.label, { color: colors.text.muted }]}>
                      {e.date.slice(5)}
                    </Text>
                    <Text style={[Typography.bodySm, { color: colors.text.primary }]}>
                      {e.note}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={() => router.push(`/add-habit?habitId=${habit.id}`)}
          style={styles.editBtn}
        >
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.editText}>{t('habitDetail.edit')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildGrid(
  entries: { date: string; completed: boolean }[],
): ({ date: string; completed: boolean } | null)[] {
  const total = Math.ceil(entries.length / COLUMNS) * COLUMNS;
  const pad = total - entries.length;
  const grid: ({ date: string; completed: boolean } | null)[] = [];
  for (let i = 0; i < pad; i++) grid.push(null);
  for (const e of entries) grid.push(e);
  return grid;
}

function StatCard({
  value,
  label,
  emoji,
  styles,
  mutedColor,
}: {
  value: number;
  label: string;
  emoji: string;
  styles: ReturnType<typeof makeStyles>;
  mutedColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={[Typography.number, { fontSize: 22 }]}>{value}</Text>
      <Text style={[Typography.label, { color: mutedColor, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
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
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    statCard: {
      flex: 1,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    section: { gap: Spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
    cell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellEmpty: { opacity: 0 },
    cellPending: { backgroundColor: c.surface.container },
    cellDone: { backgroundColor: c.secondary },
    cellLabel: { fontFamily: FontFamily.manrope.bold, fontSize: 11 },
    cellLabelDone: { color: '#0E0E0E' },
    cellLabelPending: { color: c.text.muted },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    legendDot: { width: 14, height: 14, borderRadius: Radius.sm },
    editBtn: {
      backgroundColor: c.primary,
      height: 52,
      borderRadius: Radius.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    editText: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    noteInput: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      minHeight: 80,
      color: c.text.primary,
      fontFamily: FontFamily.beVietnam.regular,
      fontSize: 14,
      textAlignVertical: 'top',
    },
    noteFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteSaveBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.base,
      paddingVertical: 8,
      borderRadius: Radius.full,
    },
    noteSaveText: {
      fontFamily: FontFamily.manrope.bold,
      color: '#FFFFFF',
      fontSize: 13,
    },
    notesList: { gap: Spacing.sm },
    noteRow: {
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: 4,
    },
  });
}

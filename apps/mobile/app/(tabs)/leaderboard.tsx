import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry, LeaderboardPeriod } from '@pulz/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import type { ColorPalette } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontFamily, Typography } from '../../constants/typography';
import { useGroups, useLeaderboard } from '../../lib/api/queries';
import { hapticSelection, hapticTap } from '../../lib/haptics';
import { useColors } from '../../lib/theme';
import { useAuthStore } from '../../store/useAuthStore';

const PERIODS: LeaderboardPeriod[] = ['today', 'week', 'all'];

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const groupsQuery = useGroups();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);

  const groups = groupsQuery.data ?? [];
  const activeGroup = groups[activeGroupIdx];
  const lbQuery = useLeaderboard(activeGroup?.id, period);

  if (groupsQuery.isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={[styles.scrollContent, { gap: Spacing.lg }]}>
          <Skeleton width={180 as number} height={28} radius={8} />
          <Skeleton height={48} radius={Radius.full} />
          <Skeleton height={200} radius={Radius.lg} />
          <Skeleton height={56} radius={Radius.lg} />
          <Skeleton height={56} radius={Radius.lg} />
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <EmptyState
          icon="trophy-outline"
          emoji="🏆"
          title={t('leaderboard.noGroupTitle')}
          subtitle={t('leaderboard.noGroupSubtitle')}
        />
      </SafeAreaView>
    );
  }

  const entries = lbQuery.data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={lbQuery.isRefetching && !lbQuery.isLoading}
            onRefresh={() => {
              hapticTap();
              void lbQuery.refetch();
            }}
            tintColor={colors.primaryLight}
          />
        }
      >
        <View>
          <Text style={Typography.headline}>{t('leaderboard.title')}</Text>
          {groups.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupTabs}
            >
              {groups.map((g, i) => (
                <Pressable
                  key={g.id}
                  onPress={() => {
                    hapticSelection();
                    setActiveGroupIdx(i);
                  }}
                  style={[styles.groupChip, activeGroupIdx === i && styles.groupChipActive]}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      activeGroupIdx === i && styles.groupChipTextActive,
                    ]}
                  >
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={[Typography.bodySm, { color: colors.text.muted, marginTop: 4 }]}>
              {activeGroup.name} · {t('groups.memberCount', { count: activeGroup.memberCount })}
            </Text>
          )}
        </View>

        <View style={styles.segment}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                hapticSelection();
                setPeriod(p);
              }}
              style={[styles.segmentBtn, period === p && styles.segmentBtnActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  period === p && styles.segmentTextActive,
                ]}
              >
                {t(`leaderboard.period${capitalize(p)}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {lbQuery.isLoading ? (
          <ActivityIndicator color={colors.primaryLight} />
        ) : (
          <>
            <Podium entries={top3} />
            {rest.length > 0 && (
              <View style={styles.list}>
                {rest.map((e) => (
                  <RankRow key={e.userId} entry={e} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (entries.length === 0) return null;
  const order = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];
  const heights = [110, 140, 90];

  return (
    <View style={styles.podium}>
      {order.map((e, i) => {
        const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
        return (
          <View key={e.userId} style={styles.podiumCol}>
            <View style={styles.podiumAvatar}>
              <Text style={styles.podiumInitial}>
                {e.displayName.slice(0, 1).toUpperCase()}
              </Text>
              {realIdx === 0 && (
                <View style={styles.crown}>
                  <Ionicons name="star" size={14} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={Typography.bodyLgMedium} numberOfLines={1}>
              {e.displayName}
            </Text>
            <Text style={[Typography.label, { color: colors.primaryLight }]}>
              {t('leaderboard.points', { count: e.totalCheckIns })}
            </Text>
            <View
              style={[
                styles.podiumBar,
                {
                  height: heights[i],
                  backgroundColor:
                    realIdx === 0
                      ? colors.primary
                      : realIdx === 1
                        ? colors.surface.highest
                        : colors.surface.high,
                },
              ]}
            >
              <Text style={styles.podiumRank}>{realIdx + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RankRow({ entry }: { entry: LeaderboardEntry }) {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isMe = me?.id === entry.userId;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[Typography.label, styles.rank]}>#{entry.rank}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{entry.displayName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <Text style={[Typography.bodyLgMedium, { flex: 1 }]}>
        {entry.displayName}
        {isMe ? ` (${t('leaderboard.youLabel')})` : ''}
      </Text>
      <Text style={[Typography.label, { color: colors.primaryLight }]}>
        {t('leaderboard.points', { count: entry.totalCheckIns })}
      </Text>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 120,
      gap: Spacing.sm,
      paddingHorizontal: Spacing.screen,
    },
    emptySub: { color: c.text.muted, textAlign: 'center' },
    groupTabs: { gap: Spacing.sm, paddingTop: Spacing.sm },
    groupChip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: c.surface.container,
    },
    groupChipActive: { backgroundColor: 'rgba(127,119,221,0.18)' },
    groupChipText: {
      fontFamily: FontFamily.manrope.semibold,
      color: c.text.muted,
      fontSize: 13,
    },
    groupChipTextActive: { color: c.primaryLight },
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
    podium: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingVertical: Spacing.base,
    },
    podiumCol: {
      alignItems: 'center',
      gap: Spacing.xs,
      flex: 1,
    },
    podiumAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    podiumInitial: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 24,
      color: '#FFFFFF',
    },
    crown: {
      position: 'absolute',
      top: -8,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    podiumBar: {
      width: '100%',
      borderTopLeftRadius: Radius.md,
      borderTopRightRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.xs,
    },
    podiumRank: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 24,
      color: '#FFFFFF',
    },
    list: { gap: Spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.surface.container,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
      borderRadius: Radius.lg,
    },
    rowMe: {
      borderWidth: 1,
      borderColor: 'rgba(127,119,221,0.4)',
    },
    rank: {
      minWidth: 32,
      color: c.text.muted,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: FontFamily.manrope.bold,
      fontSize: 14,
      color: '#FFFFFF',
    },
  });
}

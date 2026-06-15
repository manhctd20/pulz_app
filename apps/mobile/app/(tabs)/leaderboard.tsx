import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry, LeaderboardPeriod } from '@pulz/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

const MEDAL = ['🥇', '🥈', '🥉'] as const;

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const groupsQuery = useGroups();
  const me = useAuthStore((s) => s.user);
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
          <Skeleton height={220} radius={Radius.lg} />
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
  const myEntry = entries.find((e) => e.userId === me?.id);
  const leaderPoints = entries[0]?.totalCheckIns ?? 0;
  const totalCheckIns = entries.reduce((sum, e) => sum + e.totalCheckIns, 0);

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
        {/* HEADER */}
        <View>
          <Text style={Typography.headline}>{t('leaderboard.title')}</Text>
          <View style={styles.metaRow}>
            <View style={styles.groupChipMain}>
              <Ionicons name="people" size={12} color={colors.primaryLight} />
              <Text style={[Typography.label, { color: colors.primaryLight }]}>
                {activeGroup.name}
              </Text>
            </View>
            <Text style={[Typography.bodySm, { color: colors.text.muted }]}>
              {t('leaderboard.memberCountChip', { count: activeGroup.memberCount })}
            </Text>
          </View>
          {groups.length > 1 && (
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
          )}
        </View>

        {/* PERIOD SEGMENT */}
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
                style={[styles.segmentText, period === p && styles.segmentTextActive]}
              >
                {t(`leaderboard.period${capitalize(p)}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* YOUR RANK HERO */}
        {myEntry && totalCheckIns > 0 && (
          <View style={styles.yourRankWrap}>
            <LinearGradient
              colors={[colors.primary + '38', colors.secondary + '20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.yourRankBadge}>
              <Text style={styles.yourRankNumber}>#{myEntry.rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.label, { color: colors.text.muted }]}>
                {t('leaderboard.yourRankTitle')}
              </Text>
              <Text style={[Typography.title, { marginTop: 2 }]}>
                {t('leaderboard.points', { count: myEntry.totalCheckIns })}
              </Text>
              <Text style={[Typography.bodySm, { color: colors.text.secondary, marginTop: 2 }]}>
                {myEntry.rank === 1
                  ? t('leaderboard.youAreLeader')
                  : t('leaderboard.behindLeader', {
                      gap: leaderPoints - myEntry.totalCheckIns,
                    })}
              </Text>
            </View>
          </View>
        )}

        {totalCheckIns === 0 ? (
          <EmptyState
            icon="trophy-outline"
            emoji="✨"
            title={t('leaderboard.noActivityTitle')}
            subtitle={t('leaderboard.noActivitySub')}
          />
        ) : (
          <>
            {/* PODIUM */}
            <Podium entries={top3} styles={styles} colors={colors} t={t} />

            {/* REST */}
            {rest.length > 0 && (
              <View style={styles.list}>
                {rest.map((e) => (
                  <RankRow
                    key={e.userId}
                    entry={e}
                    isMe={me?.id === e.userId}
                    styles={styles}
                    colors={colors}
                    t={t}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Podium({
  entries,
  styles,
  colors,
  t,
}: {
  entries: LeaderboardEntry[];
  styles: ReturnType<typeof makeStyles>;
  colors: ColorPalette;
  t: (key: string, opts?: any) => string;
}) {
  if (entries.length === 0) return null;
  // Visual order: 2nd left, 1st middle, 3rd right
  const slots = [entries[1], entries[0], entries[2]];

  const PODIUM_HEIGHTS = [110, 150, 90];
  const PODIUM_GRADIENT: Array<[string, string]> = [
    ['rgba(192, 192, 192, 0.35)', 'rgba(192, 192, 192, 0.08)'], // silver
    [colors.primary + '60', colors.primaryContainer + '30'], // gold-ish (use brand)
    ['rgba(205, 127, 50, 0.35)', 'rgba(205, 127, 50, 0.08)'], // bronze
  ];

  return (
    <View style={styles.podium}>
      {slots.map((e, slotIdx) => {
        if (!e) return <View key={`slot-${slotIdx}`} style={styles.podiumCol} />;
        const realRank = slotIdx === 0 ? 1 : slotIdx === 1 ? 0 : 2; // index in MEDAL/gradient
        const isFirst = realRank === 0;
        return (
          <View key={e.userId} style={styles.podiumCol}>
            <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.podiumAvatarInner, isFirst && styles.podiumAvatarInnerFirst]}
              >
                <Text style={[styles.podiumInitial, isFirst && styles.podiumInitialFirst]}>
                  {e.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={[styles.medalBadge, isFirst && styles.medalBadgeFirst]}>
                <Text style={styles.medalEmoji}>{MEDAL[realRank]}</Text>
              </View>
            </View>
            <Text style={[Typography.bodyLgMedium, styles.podiumName]} numberOfLines={1}>
              {e.displayName}
            </Text>
            <Text style={[Typography.label, { color: colors.primaryLight, marginTop: 2 }]}>
              {t('leaderboard.points', { count: e.totalCheckIns })}
            </Text>
            <View
              style={[
                styles.podiumBar,
                { height: PODIUM_HEIGHTS[slotIdx], marginTop: Spacing.sm },
              ]}
            >
              <LinearGradient
                colors={PODIUM_GRADIENT[realRank]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.podiumRankNumber}>{realRank + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RankRow({
  entry,
  isMe,
  styles,
  colors,
  t,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: ColorPalette;
  t: (key: string, opts?: any) => string;
}) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[Typography.label, styles.rank]}>#{entry.rank}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{entry.displayName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <Text style={[Typography.bodyLgMedium, { flex: 1 }]} numberOfLines={1}>
        {entry.displayName}
        {isMe ? ` · ${t('leaderboard.youLabel')}` : ''}
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
    // HEADER
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    groupChipMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(127, 119, 221, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    groupTabs: { gap: Spacing.sm, paddingTop: Spacing.sm },
    groupChip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: c.surface.container,
    },
    groupChipActive: { backgroundColor: 'rgba(127,119,221,0.22)' },
    groupChipText: {
      fontFamily: FontFamily.manrope.semibold,
      color: c.text.muted,
      fontSize: 13,
    },
    groupChipTextActive: { color: c.primaryLight },
    // SEGMENT
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
    // YOUR RANK HERO
    yourRankWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      backgroundColor: c.surface.container,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(127, 119, 221, 0.35)',
    },
    yourRankBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yourRankNumber: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 20,
      color: '#FFFFFF',
    },
    // PODIUM
    podium: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingTop: Spacing.lg,
    },
    podiumCol: {
      alignItems: 'center',
      flex: 1,
    },
    podiumAvatar: {
      position: 'relative',
      marginBottom: Spacing.sm,
    },
    podiumAvatarFirst: { marginBottom: Spacing.md },
    podiumAvatarInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    podiumAvatarInnerFirst: {
      width: 76,
      height: 76,
      borderRadius: 38,
      shadowColor: c.primary,
      shadowOpacity: 0.55,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    podiumInitial: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 22,
      color: '#FFFFFF',
    },
    podiumInitialFirst: { fontSize: 28 },
    medalBadge: {
      position: 'absolute',
      top: -6,
      right: -4,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surface.lowest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.surface.container,
    },
    medalBadgeFirst: {
      width: 32,
      height: 32,
      borderRadius: 16,
      top: -10,
    },
    medalEmoji: { fontSize: 16 },
    podiumName: { textAlign: 'center', maxWidth: 90 },
    podiumBar: {
      width: '100%',
      borderTopLeftRadius: Radius.md,
      borderTopRightRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.glass.border,
    },
    podiumRankNumber: {
      fontFamily: FontFamily.manrope.extrabold,
      fontSize: 28,
      color: c.text.primary,
    },
    // LIST
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
      borderWidth: 1.5,
      borderColor: 'rgba(127,119,221,0.55)',
      backgroundColor: 'rgba(127, 119, 221, 0.12)',
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

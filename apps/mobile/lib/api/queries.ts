import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateGroupDto,
  CreateHabitDto,
  HabitWithStatus,
  JoinGroupDto,
  LeaderboardPeriod,
  UpdateGroupDto,
  UpdateHabitDto,
} from '@pulz/shared';

import * as groupsApi from './groups';
import * as habitsApi from './habits';
import * as leaderboardApi from './leaderboard';

const HABITS_KEY = ['habits'] as const;
const GROUPS_KEY = ['groups'] as const;
const GROUP_DETAIL_KEY = (id: string) => ['groups', id] as const;
const LEADERBOARD_KEY = (id: string, period: LeaderboardPeriod) =>
  ['leaderboard', id, period] as const;

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: habitsApi.listHabits,
    staleTime: 30_000,
  });
}

export function useToggleCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => habitsApi.toggleCheckIn(habitId),
    onMutate: async (habitId: string) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<HabitWithStatus[]>(HABITS_KEY);
      if (prev) {
        qc.setQueryData<HabitWithStatus[]>(
          HABITS_KEY,
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  doneToday: !h.doneToday,
                  currentStreak: h.doneToday
                    ? Math.max(0, h.currentStreak - 1)
                    : h.currentStreak + 1,
                }
              : h,
          ),
        );
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: HABITS_KEY });
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateHabitDto) => habitsApi.createHabit(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: HABITS_KEY });
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateHabitDto }) =>
      habitsApi.updateHabit(id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: HABITS_KEY });
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.deleteHabit(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: HABITS_KEY });
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useHabitHistory(id: string | undefined, days = 30) {
  return useQuery({
    queryKey: id ? ['habit-history', id, days] : ['habit-history', 'noop'],
    queryFn: () => habitsApi.getHabitHistory(id!, days),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: groupsApi.listGroups,
    staleTime: 30_000,
  });
}

export function useGroupDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? GROUP_DETAIL_KEY(id) : ['groups', 'noop'],
    queryFn: () => groupsApi.getGroupDetail(id!),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGroupDto) => groupsApi.createGroup(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: JoinGroupDto) => groupsApi.joinGroup(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.leaveGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGroupDto }) =>
      groupsApi.updateGroup(id, dto),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
      void qc.invalidateQueries({ queryKey: GROUP_DETAIL_KEY(id) });
    },
  });
}

export function useKickMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.kickMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      void qc.invalidateQueries({ queryKey: GROUP_DETAIL_KEY(groupId) });
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.deleteGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useLeaderboard(groupId: string | undefined, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: groupId ? LEADERBOARD_KEY(groupId, period) : ['leaderboard', 'noop'],
    queryFn: () => leaderboardApi.getLeaderboard(groupId!, period),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

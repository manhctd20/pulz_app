import {
  CreateGroupDto,
  CreateHabitDto,
  GroupDetailSchema,
  GroupSummarySchema,
  HabitWithStatusSchema,
  JoinGroupDto,
  UpdateGroupDto,
} from '@pulz/shared';
import { z } from 'zod';

import { api } from './client';

const GroupListSchema = z.array(GroupSummarySchema);

export async function listGroups() {
  const { data } = await api.get('/groups');
  return GroupListSchema.parse(data);
}

export async function getGroupDetail(id: string) {
  const { data } = await api.get(`/groups/${id}`);
  return GroupDetailSchema.parse(data);
}

export async function createGroup(dto: CreateGroupDto) {
  const { data } = await api.post('/groups', dto);
  return GroupSummarySchema.parse(data);
}

export async function joinGroup(dto: JoinGroupDto) {
  const { data } = await api.post('/groups/join', dto);
  return GroupSummarySchema.parse(data);
}

export async function leaveGroup(id: string) {
  await api.post(`/groups/${id}/leave`);
}

export async function deleteGroup(id: string) {
  await api.delete(`/groups/${id}`);
}

export async function updateGroup(id: string, dto: UpdateGroupDto) {
  const { data } = await api.patch(`/groups/${id}`, dto);
  return GroupSummarySchema.parse(data);
}

export async function kickMember(groupId: string, userId: string) {
  await api.delete(`/groups/${groupId}/members/${userId}`);
}

export async function createSharedHabit(groupId: string, dto: CreateHabitDto) {
  const { data } = await api.post(`/groups/${groupId}/habits`, dto);
  return HabitWithStatusSchema.parse(data);
}

import {
  CheckInResponseSchema,
  CreateHabitDto,
  HabitHistoryResponseSchema,
  HabitWithStatusSchema,
  UpdateHabitDto,
} from '@pulz/shared';
import { z } from 'zod';

import { api } from './client';

const HabitListSchema = z.array(HabitWithStatusSchema);

export async function listHabits() {
  const { data } = await api.get('/habits');
  return HabitListSchema.parse(data);
}

export async function createHabit(dto: CreateHabitDto) {
  const { data } = await api.post('/habits', dto);
  return HabitWithStatusSchema.parse(data);
}

export async function updateHabit(id: string, dto: UpdateHabitDto) {
  const { data } = await api.patch(`/habits/${id}`, dto);
  return HabitWithStatusSchema.parse(data);
}

export async function deleteHabit(id: string) {
  await api.delete(`/habits/${id}`);
}

export async function toggleCheckIn(id: string) {
  const { data } = await api.post(`/habits/${id}/checkin`);
  return CheckInResponseSchema.parse(data);
}

export async function getHabitHistory(id: string, days = 30) {
  const { data } = await api.get(`/habits/${id}/history`, { params: { days } });
  return HabitHistoryResponseSchema.parse(data);
}

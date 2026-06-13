import { create } from 'zustand';

export type Group = {
  id: string;
  name: string;
  memberCount: number;
  progress: number;
};

type GroupState = {
  groups: Group[];
};

export const useGroupStore = create<GroupState>(() => ({
  groups: [],
}));

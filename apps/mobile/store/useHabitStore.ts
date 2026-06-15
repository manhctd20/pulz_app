import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Habit = {
  id: string;
  /** i18n key dưới namespace `habits.*`; nếu rỗng, dùng `nameRaw` */
  nameKey?: string;
  nameRaw?: string;
  emoji: string;
  streakDays: number;
  done: boolean;
};

type HabitState = {
  habits: Habit[];
  toggleCheckIn: (id: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'streakDays' | 'done'>) => void;
};

const SEED_HABITS: Habit[] = [
  { id: 'water', nameKey: 'habits.water', emoji: '💧', streakDays: 12, done: true },
  { id: 'exercise', nameKey: 'habits.exercise', emoji: '🏃', streakDays: 5, done: true },
  { id: 'sleep', nameKey: 'habits.sleep', emoji: '😴', streakDays: 3, done: false },
];

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: SEED_HABITS,
      toggleCheckIn: (id) =>
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
        })),
      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...habit,
              id: `habit_${state.habits.length + 1}_${habit.emoji}`,
              streakDays: 0,
              done: false,
            },
          ],
        })),
    }),
    {
      name: 'pulzapp-habits',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

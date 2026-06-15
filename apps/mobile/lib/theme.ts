import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { ColorPalette, ColorScheme, DarkColors, LightColors } from '../constants/colors';
import { setTypographyScheme } from '../constants/typography';
import { useSettingsStore } from '../store/useSettingsStore';

export type ThemePreference = 'dark' | 'light' | 'system';

function resolveScheme(
  pref: ThemePreference,
  system: 'light' | 'dark' | null | undefined,
): ColorScheme {
  if (pref === 'system') return system === 'light' ? 'light' : 'dark';
  return pref;
}

// Khởi tạo 1 lần ở module-load — sync Typography theo state hiện tại.
const initialPref = useSettingsStore.getState().theme;
const initialSystem = Appearance.getColorScheme();
setTypographyScheme(resolveScheme(initialPref, initialSystem));

// Subscribe ngoài React lifecycle: khi pref đổi → update typography scheme ngay.
useSettingsStore.subscribe((state, prev) => {
  if (state.theme === prev.theme) return;
  setTypographyScheme(resolveScheme(state.theme, Appearance.getColorScheme()));
});

// Lắng nghe OS color scheme cho mode 'system'.
Appearance.addChangeListener(({ colorScheme }) => {
  const pref = useSettingsStore.getState().theme;
  if (pref !== 'system') return;
  setTypographyScheme(resolveScheme(pref, colorScheme));
});

/**
 * useColors: trả về palette hiện tại + tự re-render khi pref/system đổi.
 * Typography getter tự đọc current scheme — không cần mutate object frozen.
 */
export function useColors(): ColorPalette {
  const scheme = useScheme();
  return scheme === 'light' ? LightColors : DarkColors;
}

export function useScheme(): ColorScheme {
  const pref = useSettingsStore((s) => s.theme);
  const [system, setSystem] = useState<'light' | 'dark' | null | undefined>(() =>
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    if (pref !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme));
    return () => sub.remove();
  }, [pref]);

  return resolveScheme(pref, system);
}

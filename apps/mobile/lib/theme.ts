import { useColorScheme } from 'react-native';

import { ColorPalette, ColorScheme, DarkColors, LightColors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useSettingsStore } from '../store/useSettingsStore';

export type ThemePreference = 'dark' | 'light' | 'system';

let lastSyncedScheme: ColorScheme | null = null;

function syncTypography(colors: ColorPalette) {
  // Đồng bộ inline Typography.X.color để mọi Text dùng Typography pick up
  // màu mới ngay ở render đầu tiên (không cần useEffect chậm 1 frame).
  if (lastSyncedScheme === colors.scheme) return;
  lastSyncedScheme = colors.scheme;
  Object.assign(Typography.display, { color: colors.text.primary });
  Object.assign(Typography.headline, { color: colors.text.primary });
  Object.assign(Typography.title, { color: colors.text.primary });
  Object.assign(Typography.bodyLg, { color: colors.text.primary });
  Object.assign(Typography.bodyLgMedium, { color: colors.text.primary });
  Object.assign(Typography.bodySm, { color: colors.text.secondary });
  Object.assign(Typography.label, { color: colors.text.primary });
  Object.assign(Typography.number, { color: colors.text.primary });
}

export function useColors(): ColorPalette {
  const pref = useSettingsStore((s) => s.theme);
  const system = useColorScheme();
  const resolved = resolveScheme(pref, system);
  const colors = resolved === 'light' ? LightColors : DarkColors;
  syncTypography(colors);
  return colors;
}

export function useScheme(): ColorScheme {
  const pref = useSettingsStore((s) => s.theme);
  const system = useColorScheme();
  return resolveScheme(pref, system);
}

function resolveScheme(
  pref: ThemePreference,
  system: 'light' | 'dark' | null | undefined,
): ColorScheme {
  if (pref === 'system') return system === 'light' ? 'light' : 'dark';
  return pref;
}

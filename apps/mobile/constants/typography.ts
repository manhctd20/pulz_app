import { TextStyle } from 'react-native';

import { DarkColors, LightColors } from './colors';

export const FontFamily = {
  manrope: {
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
  },
  beVietnam: {
    regular: 'BeVietnamPro_400Regular',
    medium: 'BeVietnamPro_500Medium',
    semibold: 'BeVietnamPro_600SemiBold',
  },
} as const;

type TypographyKey =
  | 'display'
  | 'headline'
  | 'title'
  | 'bodyLg'
  | 'bodyLgMedium'
  | 'bodySm'
  | 'label'
  | 'number';

type BaseStyle = Omit<TextStyle, 'color'>;

const BASE: Record<TypographyKey, BaseStyle> = {
  display: {
    fontFamily: FontFamily.manrope.extrabold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  headline: {
    fontFamily: FontFamily.manrope.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28,
  },
  title: {
    fontFamily: FontFamily.manrope.semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: FontFamily.beVietnam.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLgMedium: {
    fontFamily: FontFamily.beVietnam.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: FontFamily.beVietnam.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: FontFamily.manrope.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  number: {
    fontFamily: FontFamily.manrope.bold,
  },
};

// `currentScheme` được set bởi setTypographyScheme() từ theme subscription.
// Getter trả về object MỚI mỗi lần access → tránh RN dev mode deep-freeze
// (RN freeze object truyền vào style prop, nếu mutate sau sẽ throw).
let currentScheme: 'dark' | 'light' = 'dark';

export function setTypographyScheme(scheme: 'dark' | 'light') {
  currentScheme = scheme;
}

function colorFor(key: TypographyKey): string {
  const c = currentScheme === 'light' ? LightColors : DarkColors;
  return key === 'bodySm' ? c.text.secondary : c.text.primary;
}

function build(key: TypographyKey): TextStyle {
  return { ...BASE[key], color: colorFor(key) };
}

export const Typography = {
  get display(): TextStyle {
    return build('display');
  },
  get headline(): TextStyle {
    return build('headline');
  },
  get title(): TextStyle {
    return build('title');
  },
  get bodyLg(): TextStyle {
    return build('bodyLg');
  },
  get bodyLgMedium(): TextStyle {
    return build('bodyLgMedium');
  },
  get bodySm(): TextStyle {
    return build('bodySm');
  },
  get label(): TextStyle {
    return build('label');
  },
  get number(): TextStyle {
    return build('number');
  },
};

import { TextStyle } from 'react-native';

import { Colors } from './colors';

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

export const Typography = {
  display: {
    fontFamily: FontFamily.manrope.extrabold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: Colors.text.primary,
  } satisfies TextStyle,
  headline: {
    fontFamily: FontFamily.manrope.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28,
    color: Colors.text.primary,
  } satisfies TextStyle,
  title: {
    fontFamily: FontFamily.manrope.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text.primary,
  } satisfies TextStyle,
  bodyLg: {
    fontFamily: FontFamily.beVietnam.regular,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.primary,
  } satisfies TextStyle,
  bodyLgMedium: {
    fontFamily: FontFamily.beVietnam.medium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.primary,
  } satisfies TextStyle,
  bodySm: {
    fontFamily: FontFamily.beVietnam.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.secondary,
  } satisfies TextStyle,
  label: {
    fontFamily: FontFamily.manrope.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: Colors.text.primary,
  } satisfies TextStyle,
  number: {
    fontFamily: FontFamily.manrope.bold,
    color: Colors.text.primary,
  } satisfies TextStyle,
} as const;

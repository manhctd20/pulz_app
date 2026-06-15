// Brand colors — không đổi giữa dark/light. Chọn để work trên cả 2 nền.
const Brand = {
  primary: '#7F77DD',
  primaryLight: '#C5C0FF',
  primaryContainer: '#8C84EB',
  secondary: '#5DCAA5',
  secondaryLight: '#6EDAB4',
  tertiary: '#FF9F87',
  error: '#FFB4AB',
  success: '#5DCAA5',
  warning: '#FF9F87',
} as const;

export const DarkColors = {
  ...Brand,
  scheme: 'dark' as const,
  surface: {
    lowest: '#0E0E0E',
    base: '#131313',
    low: '#1C1B1B',
    container: '#201F1F',
    high: '#2A2A2A',
    highest: '#353534',
  },
  text: {
    primary: '#E5E2E1',
    secondary: '#C8C4D4',
    muted: '#928F9D',
    inactive: '#7D7B85',
    onBrand: '#FFFFFF',
  },
  glass: {
    bg: 'rgba(20, 20, 20, 0.7)',
    border: 'rgba(255, 255, 255, 0.09)',
    pillBg: 'rgba(28, 28, 28, 0.96)',
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.3)',
    nav: 'rgba(0, 0, 0, 0.55)',
    fabGlow: 'rgba(127, 119, 221, 0.6)',
  },
  divider: 'rgba(255, 255, 255, 0.05)',
} as const;

export const LightColors = {
  ...Brand,
  scheme: 'light' as const,
  surface: {
    lowest: '#FAFAFC',
    base: '#F4F4F7',
    low: '#EEEEF2',
    container: '#FFFFFF',
    high: '#E8E8ED',
    highest: '#DEDEE5',
  },
  text: {
    primary: '#1A1A1F',
    secondary: '#3A3A45',
    muted: '#71717A',
    inactive: '#A1A1AA',
    onBrand: '#FFFFFF',
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.75)',
    border: 'rgba(0, 0, 0, 0.08)',
    pillBg: 'rgba(255, 255, 255, 0.96)',
  },
  shadow: {
    card: 'rgba(0, 0, 0, 0.08)',
    nav: 'rgba(0, 0, 0, 0.18)',
    fabGlow: 'rgba(127, 119, 221, 0.4)',
  },
  divider: 'rgba(0, 0, 0, 0.06)',
} as const;

export type ColorScheme = 'dark' | 'light';

type WidenColors = {
  primary: string;
  primaryLight: string;
  primaryContainer: string;
  secondary: string;
  secondaryLight: string;
  tertiary: string;
  error: string;
  success: string;
  warning: string;
  scheme: ColorScheme;
  surface: {
    lowest: string;
    base: string;
    low: string;
    container: string;
    high: string;
    highest: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inactive: string;
    onBrand: string;
  };
  glass: { bg: string; border: string; pillBg: string };
  shadow: { card: string; nav: string; fabGlow: string };
  divider: string;
};

export type ColorPalette = WidenColors;

// Legacy default — dark. File chưa migrate vẫn dùng được. Khuyến nghị `useColors()`.
export const Colors = DarkColors;

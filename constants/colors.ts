export const Colors = {
  surface: {
    lowest: '#0E0E0E',
    base: '#131313',
    low: '#1C1B1B',
    container: '#201F1F',
    high: '#2A2A2A',
    highest: '#353534',
  },
  primary: '#7F77DD',
  primaryLight: '#C5C0FF',
  primaryContainer: '#8C84EB',
  secondary: '#5DCAA5',
  secondaryLight: '#6EDAB4',
  tertiary: '#FF9F87',
  text: {
    primary: '#E5E2E1',
    secondary: '#C8C4D4',
    muted: '#928F9D',
    inactive: '#7D7B85',
  },
  error: '#FFB4AB',
  success: '#5DCAA5',
  warning: '#FF9F87',
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
} as const;

export type ColorTokens = typeof Colors;

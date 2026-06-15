import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ColorPalette } from '../constants/colors';
import { Radius } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

type Tone = 'primary' | 'secondary' | 'tertiary';

type Props = {
  label: string;
  tone?: Tone;
};

export function PillBadge({ label, tone = 'primary' }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toneStyles: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: 'rgba(127, 119, 221, 0.15)', fg: colors.primaryLight },
    secondary: { bg: 'rgba(93, 202, 165, 0.15)', fg: colors.secondaryLight },
    tertiary: { bg: 'rgba(255, 159, 135, 0.15)', fg: colors.tertiary },
  };
  const styleTokens = toneStyles[tone];
  return (
    <View style={[styles.container, { backgroundColor: styleTokens.bg }]}>
      <Text style={[Typography.label, { color: styleTokens.fg }]}>{label}</Text>
    </View>
  );
}

function makeStyles(_c: ColorPalette) {
  return StyleSheet.create({
    container: {
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
  });
}

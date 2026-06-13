import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/colors';
import { Radius } from '../constants/spacing';
import { Typography } from '../constants/typography';

type Tone = 'primary' | 'secondary' | 'tertiary';

const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: 'rgba(127, 119, 221, 0.15)', fg: Colors.primaryLight },
  secondary: { bg: 'rgba(93, 202, 165, 0.15)', fg: Colors.secondaryLight },
  tertiary: { bg: 'rgba(255, 159, 135, 0.15)', fg: Colors.tertiary },
};

type Props = {
  label: string;
  tone?: Tone;
};

export function PillBadge({ label, tone = 'primary' }: Props) {
  const styleTokens = TONE_STYLES[tone];
  return (
    <View style={[styles.container, { backgroundColor: styleTokens.bg }]}>
      <Text style={[Typography.label, { color: styleTokens.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});

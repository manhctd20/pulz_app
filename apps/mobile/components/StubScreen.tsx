import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ColorPalette } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { useColors } from '../lib/theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function StubScreen({ title, subtitle }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={Typography.headline}>{title}</Text>
        {subtitle && <Text style={[Typography.bodyLg, styles.subtitle]}>{subtitle}</Text>}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface.lowest },
    inner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.screen,
      gap: Spacing.sm,
    },
    subtitle: { color: c.text.secondary, textAlign: 'center' },
  });
}

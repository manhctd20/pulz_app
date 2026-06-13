import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

type Props = {
  title: string;
  subtitle?: string;
};

export function StubScreen({ title, subtitle }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={Typography.headline}>{title}</Text>
        {subtitle && <Text style={[Typography.bodyLg, styles.subtitle]}>{subtitle}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.lowest,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  subtitle: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

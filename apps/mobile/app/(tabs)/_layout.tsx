import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from '../../components/FloatingTabBar';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="leaderboard" options={{ title: t('tabs.leaderboard') }} />
      <Tabs.Screen name="groups" options={{ title: t('tabs.groups') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

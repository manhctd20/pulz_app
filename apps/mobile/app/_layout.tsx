import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../lib/i18n';
import { queryClient } from '../lib/queryClient';
import { useColors, useScheme } from '../lib/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

void SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'loading') return;
    const first = segments[0];
    const inAuthRoute = first === 'login' || first === 'register' || first === 'onboarding';
    if (status === 'unauthenticated') {
      if (!hasSeenOnboarding && first !== 'onboarding') {
        router.replace('/onboarding');
      } else if (hasSeenOnboarding && !inAuthRoute) {
        router.replace('/login');
      }
    } else if (status === 'authenticated' && inAuthRoute) {
      router.replace('/');
    }
  }, [status, segments, router, hasSeenOnboarding]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
  });

  const colors = useColors();
  const scheme = useScheme();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface.lowest }}>
        <SafeAreaProvider>
          <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
          <AuthGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.surface.lowest },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="add-habit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="group/[id]" />
            <Stack.Screen name="habit/[id]" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

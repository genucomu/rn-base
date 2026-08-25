import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { createQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';

SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient(router);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = useAuthStore.persist;
    if (store.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = store.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const target: Href = isAuthenticated ? ('/(tabs)' as Href) : ('/(auth)/login' as Href);
    router.replace(target);
    SplashScreen.hideAsync();
  }, [hydrated, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {hydrated && <Stack screenOptions={{ headerShown: false }} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

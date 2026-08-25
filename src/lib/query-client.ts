import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import type { ImperativeRouter } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';

// ── Online / focus managers ──────────────────────────────

export { httpClient } from '@/lib/http-client';

if (typeof window !== 'undefined' && window.addEventListener) {
  onlineManager.setEventListener((setOnline) => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  });
} else {
  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  AppState.addEventListener('change', onAppStateChange);
}

// ── Factory ──────────────────────────────────────────────

export function createQueryClient(_router: ImperativeRouter): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
  });

  return queryClient;
}

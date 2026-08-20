import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import type { ImperativeRouter } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { ApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

// ── Online / focus managers ──────────────────────────────

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

// ── 401 error detection ──────────────────────────────────

function is401Error(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401;
  }
  if (error != null && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 401;
  }
  return false;
}

// ── Factory ──────────────────────────────────────────────

export function createQueryClient(router: ImperativeRouter): QueryClient {
  let isLoggingOut = false;

  function handle401(error: unknown) {
    if (!is401Error(error) || isLoggingOut) return;

    isLoggingOut = true;
    useAuthStore.getState().logout();
    queryClient.clear();
    router.replace('/(auth)/login');
    setTimeout(() => {
      isLoggingOut = false;
    }, 1500);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
    queryCache: new QueryCache({ onError: handle401 }),
    mutationCache: new MutationCache({ onError: handle401 }),
  });

  return queryClient;
}

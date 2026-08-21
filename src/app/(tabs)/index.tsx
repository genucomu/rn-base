import { useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          queryClient.clear();
          logout();
        },
      },
    ]);
  }

  return (
    <ThemedView className="flex-1 justify-center flex-row">
      <SafeAreaView
        className="flex-1 px-4 items-center gap-3 max-w-200"
        style={{ paddingBottom: BottomTabInset + 16 }}
      >
        <View className="w-full flex-row justify-end">
          <Pressable
            onPress={handleLogout}
            className="rounded-lg bg-destructive px-4 py-2 border"
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Text className="text-sm font-semibold text-destructive-foreground">Cerrar sesión</Text>
          </Pressable>
        </View>

        <ThemedView className="flex-1 items-center justify-center gap-4 px-4">
          <AnimatedIcon />
          <ThemedText type="title" className="text-center">
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" className="uppercase">
          get started
        </ThemedText>

        <ThemedView type="backgroundElement" className="self-stretch gap-3 rounded-xl px-3 py-4">
          <HintRow
            title="Try editing"
            hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Fresh start"
            hint={<ThemedText type="code">npm run reset-project</ThemedText>}
          />
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

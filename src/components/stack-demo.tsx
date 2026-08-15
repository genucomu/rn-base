import { Pressable, Text, View } from 'react-native';

import { useHealth } from '@/hooks/use-health';
import { useSettingsStore } from '@/stores/settings-store';

export function StackDemo() {
  const { data, isError, isLoading } = useHealth();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  return (
    <View className="bg-amber-50 dark:bg-amber-950 rounded-2xl p-4 gap-2">
      <Text className="text-base font-bold text-amber-900 dark:text-amber-100">Stack demo</Text>
      <Text className="text-sm text-amber-800 dark:text-amber-200">
        TanStack Query: {isLoading ? 'loading…' : isError ? 'error' : data?.status} at {data?.time}
      </Text>
      <Pressable
        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        className="bg-amber-500 rounded-full px-4 py-2 self-start"
      >
        <Text className="text-white font-semibold">
          Notifications: {notificationsEnabled ? 'on' : 'off'}
        </Text>
      </Pressable>
    </View>
  );
}

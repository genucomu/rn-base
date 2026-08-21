import { Pressable, type PressableProps, Text, View } from 'react-native';

import { Avatar } from './avatar';

type ChatListItemProps = PressableProps & {
  name: string;
  avatarUri?: string | null;
  lastMessage: string;
  time: string;
  unreadCount?: number;
};

export function ChatListItem({
  name,
  avatarUri,
  lastMessage,
  time,
  unreadCount = 0,
  style,
  ...rest
}: ChatListItemProps) {
  return (
    <Pressable
      className="flex-row items-center px-4 py-3 bg-white active:bg-surface-50"
      style={style}
      {...rest}
    >
      <Avatar uri={avatarUri} initials={name} size="lg" />

      <View className="flex-1 ml-3 border-b border-surface-100 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-surface-900" numberOfLines={1}>
            {name}
          </Text>
          <Text
            className={`text-xs ${unreadCount > 0 ? 'text-primary-500 font-medium' : 'text-surface-400'}`}
          >
            {time}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm text-surface-500 flex-1 mr-2" numberOfLines={1}>
            {lastMessage}
          </Text>

          {unreadCount > 0 && (
            <View className="bg-primary-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-xs font-medium text-white">{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

import { type Href, useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';

import { ChatListItem, Header } from '@/components/ui';

type Chat = {
  id: string;
  name: string;
  avatarUri?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
};

const MOCK_CHATS: Chat[] = [
  {
    id: '1',
    name: 'María García',
    avatarUri: 'https://i.pravatar.cc/150?img=1',
    lastMessage: '¡Hola! ¿Cómo estás?',
    time: '10:30',
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Carlos López',
    lastMessage: 'Nos vemos mañana',
    time: '9:15',
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    avatarUri: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Perfecto, gracias',
    time: 'Ayer',
    unreadCount: 0,
  },
  {
    id: '4',
    name: 'Pedro Sánchez',
    lastMessage: '¿Ya viste el nuevo proyecto?',
    time: 'Ayer',
    unreadCount: 5,
  },
  {
    id: '5',
    name: 'Laura Fernández',
    avatarUri: 'https://i.pravatar.cc/150?img=9',
    lastMessage: 'Jaja, muy gracioso',
    time: 'Lun',
    unreadCount: 0,
  },
];

export default function ChatsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <Header title="Chats" />

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            name={item.name}
            avatarUri={item.avatarUri}
            lastMessage={item.lastMessage}
            time={item.time}
            unreadCount={item.unreadCount}
            onPress={() => router.push(`/chat/${item.id}` as Href)}
          />
        )}
      />
    </View>
  );
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ChatBubble, Header } from '@/components/ui';

type Message = {
  id: string;
  text: string;
  isOwn: boolean;
  time: string;
  status: 'sent' | 'delivered' | 'read';
};

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', text: '¡Hola! ¿Cómo estás?', isOwn: false, time: '10:28', status: 'read' },
    { id: '2', text: '¡Muy bien! ¿Y vos?', isOwn: true, time: '10:29', status: 'read' },
    {
      id: '3',
      text: 'Todo genial, trabajando en el nuevo proyecto',
      isOwn: false,
      time: '10:30',
      status: 'read',
    },
  ],
  '2': [
    { id: '1', text: '¿Nos vemos mañana?', isOwn: false, time: '9:14', status: 'read' },
    { id: '2', text: 'Sí, perfecto. ¿A qué hora?', isOwn: true, time: '9:15', status: 'delivered' },
  ],
  '3': [
    { id: '1', text: 'Te envié el archivo', isOwn: false, time: '18:20', status: 'read' },
    { id: '2', text: 'Perfecto, gracias', isOwn: true, time: '18:25', status: 'read' },
  ],
  '4': [
    { id: '1', text: '¿Ya viste el nuevo proyecto?', isOwn: false, time: '16:00', status: 'read' },
    { id: '2', text: 'Sí, se ve increíble', isOwn: true, time: '16:05', status: 'sent' },
  ],
  '5': [
    { id: '1', text: 'Mirá lo que me pasó hoy', isOwn: false, time: '14:00', status: 'read' },
    { id: '2', text: '¿Qué fue?', isOwn: true, time: '14:02', status: 'read' },
    {
      id: '3',
      text: 'Me traje el café por todo el monitor',
      isOwn: false,
      time: '14:03',
      status: 'read',
    },
    { id: '4', text: 'Jaja, muy gracioso', isOwn: true, time: '14:05', status: 'read' },
  ],
};

const CHAT_NAMES: Record<string, string> = {
  '1': 'María García',
  '2': 'Carlos López',
  '3': 'Ana Martínez',
  '4': 'Pedro Sánchez',
  '5': 'Laura Fernández',
};

const CHAT_AVATARS: Record<string, string | undefined> = {
  '1': 'https://i.pravatar.cc/150?img=1',
  '2': undefined,
  '3': 'https://i.pravatar.cc/150?img=5',
  '4': undefined,
  '5': 'https://i.pravatar.cc/150?img=9',
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES[id ?? '1'] ?? []);

  const chatName = CHAT_NAMES[id ?? '1'] ?? 'Chat';
  const chatAvatar = CHAT_AVATARS[id ?? '1'];

  function handleSend() {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: String(Date.now()),
      text: inputText.trim(),
      isOwn: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-50" edges={['bottom']}>
      <Header title="" leftAction={{ label: '←', onPress: () => router.back() }} />

      <View className="flex-row items-center px-4 py-2 bg-white border-b border-surface-100">
        <Avatar uri={chatAvatar} initials={chatName} size="md" />
        <Text className="ml-3 text-lg font-semibold text-surface-900">{chatName}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="py-4"
          renderItem={({ item }) => (
            <ChatBubble
              isOwn={item.isOwn}
              message={item.text}
              time={item.time}
              status={item.status}
            />
          )}
        />

        <View className="flex-row items-center gap-2 px-4 py-3 bg-white border-t border-surface-100">
          <TextInput
            className="flex-1 bg-surface-100 rounded-full px-4 py-2 text-base"
            placeholder="Mensaje..."
            value={inputText}
            onChangeText={setInputText}
          />
          <Pressable
            onPress={handleSend}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() ? 'bg-primary-500' : 'bg-surface-200'
            }`}
          >
            <Text className="text-white text-lg">↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

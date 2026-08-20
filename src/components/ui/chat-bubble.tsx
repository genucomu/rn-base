import { Text, View, type ViewProps } from 'react-native';

type ChatBubbleProps = ViewProps & {
  isOwn?: boolean;
  message: string;
  time?: string;
  status?: 'sent' | 'delivered' | 'read';
};

export function ChatBubble({
  isOwn = false,
  message,
  time,
  status,
  style,
  ...rest
}: ChatBubbleProps) {
  return (
    <View
      className={`flex-row ${isOwn ? 'justify-end' : 'justify-start'} mb-2 px-4`}
      style={style}
      {...rest}
    >
      <View
        className={`max-w-[80%] px-3 py-2 ${
          isOwn ? 'bg-primary-500 rounded-2xl rounded-br-md' : 'bg-white rounded-2xl rounded-bl-md'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text className={`text-base ${isOwn ? 'text-white' : 'text-surface-900'}`}>{message}</Text>

        {(time || status) && (
          <View className="flex-row items-center justify-end mt-1 gap-1">
            {time && (
              <Text className={`text-xs ${isOwn ? 'text-primary-100' : 'text-surface-400'}`}>
                {time}
              </Text>
            )}
            {status && isOwn && <StatusIcon status={status} />}
          </View>
        )}
      </View>
    </View>
  );
}

function StatusIcon({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  const icon = status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓';

  return (
    <Text className={`text-xs ${status === 'read' ? 'text-primary-200' : 'text-primary-100'}`}>
      {icon}
    </Text>
  );
}

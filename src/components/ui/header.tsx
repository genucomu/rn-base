import { Pressable, Text, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderProps = ViewProps & {
  title: string;
  leftAction?: {
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    label: string;
    onPress: () => void;
  };
};

export function Header({ title, leftAction, rightAction, style, ...rest }: HeaderProps) {
  return (
    <SafeAreaView className="bg-white" edges={['top']}>
      <View
        className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-surface-100"
        style={style}
        {...rest}
      >
        {leftAction ? (
          <Pressable onPress={leftAction.onPress} className="p-2 -ml-2">
            <Text className="text-primary-500 text-base">{leftAction.label}</Text>
          </Pressable>
        ) : (
          <View className="w-12" />
        )}

        <Text
          className="text-lg font-semibold text-surface-900 flex-1 text-center"
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightAction ? (
          <Pressable onPress={rightAction.onPress} className="p-2 -mr-2">
            <Text className="text-primary-500 text-base">{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View className="w-12" />
        )}
      </View>
    </SafeAreaView>
  );
}

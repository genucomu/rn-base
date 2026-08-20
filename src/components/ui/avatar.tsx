import { Image, Text, View, type ViewProps } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = ViewProps & {
  uri?: string | null;
  initials?: string;
  size?: AvatarSize;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ uri, initials, size = 'md', style, ...rest }: AvatarProps) {
  const initialsText = initials ? getInitials(initials) : '??';

  return (
    <View
      className={`${sizeClasses[size]} items-center justify-center overflow-hidden rounded-full bg-primary-100`}
      style={style}
      {...rest}
    >
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className={`${textSizeClasses[size]} font-semibold text-primary-700`}>
          {initialsText}
        </Text>
      )}
    </View>
  );
}

import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-surface-100 active:bg-surface-200',
  outline: 'bg-transparent border border-surface-300 active:bg-surface-50',
  danger: 'bg-danger-500 active:bg-danger-600',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-surface-900',
  outline: 'text-surface-700',
  danger: 'text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      className={`rounded-lg items-center justify-center flex-row gap-2 ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      style={style}
      {...rest}
    >
      {loading && (
        <ActivityIndicator size="small" color={variant === 'primary' ? 'white' : '#525252'} />
      )}
      <Text className={`font-semibold ${textSizeClasses[size]} ${textVariantClasses[variant]}`}>
        {children}
      </Text>
    </Pressable>
  );
}

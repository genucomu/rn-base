import { Text, View, type ViewProps } from 'react-native';

type BadgeVariant = 'primary' | 'secondary' | 'danger' | 'accent';

type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  children: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100',
  secondary: 'bg-surface-100',
  danger: 'bg-danger-100',
  accent: 'bg-accent-100',
};

const textVariantClasses: Record<BadgeVariant, string> = {
  primary: 'text-primary-700',
  secondary: 'text-surface-700',
  danger: 'text-danger-700',
  accent: 'text-accent-700',
};

export function Badge({ variant = 'primary', children, style, ...rest }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variantClasses[variant]}`} style={style} {...rest}>
      <Text className={`text-xs font-medium ${textVariantClasses[variant]}`}>{children}</Text>
    </View>
  );
}

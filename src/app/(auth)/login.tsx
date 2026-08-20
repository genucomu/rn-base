import { type Href, useRouter } from 'expo-router';
import { createElement, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLoginMutation } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const authStore = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      authStore.login(data.token, data.user);
      router.replace('/(tabs)' as Href);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLogin = () => {
    setError(null);

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Ingresá un email válido');
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  return createElement(
    View,
    { className: 'flex-1 justify-center bg-background px-6' },
    createElement(
      View,
      { className: 'gap-4' },
      createElement(
        Text,
        { className: 'text-2xl font-bold text-foreground text-center' },
        'Iniciar sesión',
      ),
      createElement(TextInput, {
        className: 'border border-border rounded-lg px-4 py-3 text-foreground bg-card',
        placeholder: 'Email',
        placeholderClassName: 'text-muted-foreground',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        autoComplete: 'email',
        value: email,
        onChangeText: setEmail,
        accessibilityLabel: 'Email',
      }),
      createElement(TextInput, {
        className: 'border border-border rounded-lg px-4 py-3 text-foreground bg-card',
        placeholder: 'Contraseña',
        placeholderClassName: 'text-muted-foreground',
        secureTextEntry: true,
        autoComplete: 'password',
        value: password,
        onChangeText: setPassword,
        accessibilityLabel: 'Contraseña',
      }),
      error && createElement(Text, { className: 'text-destructive text-sm text-center' }, error),
      createElement(
        TouchableOpacity,
        {
          className: 'bg-primary rounded-lg py-3 items-center',
          activeOpacity: 0.7,
          onPress: handleLogin,
          disabled: loginMutation.isPending,
          accessibilityRole: 'button',
          accessibilityLabel: 'Iniciar sesión',
        },
        loginMutation.isPending
          ? createElement(ActivityIndicator, { color: '#fff' })
          : createElement(
              Text,
              { className: 'text-primary-foreground font-semibold text-base' },
              'Iniciar sesión',
            ),
      ),
    ),
  );
}

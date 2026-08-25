import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useLoginMutation } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
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

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: theme.background }}>
      <View className="gap-4">
        <Text className="text-2xl font-bold text-center" style={{ color: theme.text }}>
          Iniciar sesión
        </Text>
        <TextInput
          className="rounded-lg px-4 py-3"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email"
        />
        <TextInput
          className="rounded-lg px-4 py-3"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Contraseña"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Contraseña"
        />
        {error && (
          <Text className="text-sm text-center" style={styles.error}>
            {error}
          </Text>
        )}
        <TouchableOpacity
          className="rounded-lg py-3 items-center"
          style={styles.button}
          activeOpacity={0.7}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Iniciar sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#60646C',
  },
  error: {
    color: '#EF4444',
  },
  button: {
    backgroundColor: '#25D366',
  },
});

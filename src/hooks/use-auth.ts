import { useMutation } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthResponse, LoginUserDto } from '@/types/api';

const HOME_ROUTE = '/' as Href;
const LOGIN_ROUTE = '/' as Href;

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginUserDto) => authService.login(data),
    onSuccess: (data) => {
      const response = data as AuthResponse;
      if (response.accessToken) {
        setAuth(response.accessToken, response.refreshToken, response.user);
        router.replace(HOME_ROUTE);
      }
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data: AuthResponse) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      router.replace(HOME_ROUTE);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      router.replace(LOGIN_ROUTE);
    },
  });
}

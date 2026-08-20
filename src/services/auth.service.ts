import type {
  AuthResponse,
  LoginUserDto,
  RefreshTokenDto,
  RegisterUserDto,
  TenantSelectionResponse,
} from '@/types/api';
import { http } from './http';

export const authService = {
  register(data: RegisterUserDto): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/register', data);
  },

  login(data: LoginUserDto): Promise<AuthResponse | TenantSelectionResponse> {
    return http.post<AuthResponse | TenantSelectionResponse>('/auth/login', data);
  },

  refresh(data: RefreshTokenDto): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/refresh', data);
  },

  logout(): Promise<void> {
    return http.post<void>('/auth/logout');
  },
};

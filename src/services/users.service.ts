import type { User } from '@/types/api';
import { http } from './http';

export const usersService = {
  getProfile(): Promise<User> {
    return http.get<User>('/users/me');
  },
};

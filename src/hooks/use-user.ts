import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { usersService } from '@/services/users.service';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: usersService.getProfile,
  });
}

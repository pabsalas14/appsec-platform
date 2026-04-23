import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, User } from '@/types';

async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

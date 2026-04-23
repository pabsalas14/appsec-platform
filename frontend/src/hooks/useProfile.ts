import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import type { ApiResponse, User } from '@/types';

export type ProfileUpdateInput = {
  full_name?: string | null;
  email?: string | null;
};

export type PasswordChangeInput = {
  current_password: string;
  new_password: string;
};

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfileUpdateInput) => {
      const res = await api.patch<ApiResponse<User>>('/auth/me', payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: PasswordChangeInput) => {
      await api.post('/auth/me/password', payload);
    },
  });
}

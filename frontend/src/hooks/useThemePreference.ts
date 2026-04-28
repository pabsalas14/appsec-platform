import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api';

export interface UserThemePreference {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export function useThemePreference() {
  return useQuery({
    queryKey: ['theme-preference'],
    queryFn: async () => {
      try {
        const response = await api.get('/me/theme-preference');
        return response.data as UserThemePreference;
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateThemePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (theme: 'light' | 'dark' | 'system') => {
      const response = await api.put('/me/theme-preference', { theme });
      return response.data as UserThemePreference;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['theme-preference'], data);
    },
  });
}

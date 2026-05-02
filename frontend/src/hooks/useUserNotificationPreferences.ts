'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import type {
  UserNotificationPreferences,
  UserNotificationPreferencesPatch,
} from '@/lib/schemas/user_notification_preferences.schema';
import {
  userNotificationPreferencesPatchSchema,
  userNotificationPreferencesSchema,
} from '@/lib/schemas/user_notification_preferences.schema';

type Envelope<T> = { status: string; data: T };

const KEY = ['user-preferences'] as const;

export function useUserNotificationPreferences() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<UserNotificationPreferences>>('/user-preferences');
      if (data.status !== 'success') {
        throw new Error('Preferencias no disponibles');
      }
      return userNotificationPreferencesSchema.parse(data.data);
    },
  });
}

export function useUpdateUserNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UserNotificationPreferencesPatch) => {
      const payload = userNotificationPreferencesPatchSchema.parse(patch);
      const { data } = await api.patch<Envelope<UserNotificationPreferences>>('/user-preferences', payload);
      if (data.status !== 'success') {
        throw new Error('No se pudieron guardar las preferencias');
      }
      return userNotificationPreferencesSchema.parse(data.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err: unknown) => {
      logger.error('user_preferences.patch_failed', { err });
    },
  });
}

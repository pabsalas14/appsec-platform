import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

export type IAConfig = {
  proveedor_activo: string;
  modelo: string;
  temperatura: number;
  max_tokens: number;
  timeout_segundos: number;
  sanitizar_datos_paga: boolean;
};

export type IAConfigUpdate = Partial<IAConfig>;

export type IATestCallPayload = {
  prompt: string;
  dry_run: boolean;
};

export type IATestCallResult = {
  provider: string;
  model: string;
  content: string;
  usage: Record<string, unknown> | null;
  dry_run: boolean;
};

const KEY = ['admin', 'ia-config'] as const;

export function useIAConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Envelope<IAConfig>>('/admin/ia-config');
      return data.data;
    },
  });
}

export function useUpdateIAConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: IAConfigUpdate) => {
      const { data } = await api.put<Envelope<IAConfig>>('/admin/ia-config', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useIATestCall() {
  return useMutation({
    mutationFn: async (payload: IATestCallPayload) => {
      const { data } = await api.post<Envelope<IATestCallResult>>('/admin/ia-config/test-call', payload);
      return data.data;
    },
  });
}


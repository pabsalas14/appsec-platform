import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

type Envelope<T> = { status: 'success'; data: T };

export type ServiceReleaseOperacionConfig = {
  transiciones: Record<string, string[]>;
  kanban: { columnas_orden?: string[] };
};

export function useServiceReleaseOperacionConfig() {
  return useQuery({
    queryKey: ['operacion', 'service_releases', 'config'],
    queryFn: async () => {
      const { data } = await api.get<Envelope<ServiceReleaseOperacionConfig>>(
        '/service_releases/config/operacion',
      );
      return data.data;
    },
  });
}

export type EstatusVulnItem = {
  id: string;
  label: string;
  clasificacion_ciclo?: string;
  transiciones_permitidas?: string[];
  es_terminal?: boolean;
};

export type VulnerabilidadFlujoConfig = {
  estatus: EstatusVulnItem[];
};

export function useVulnerabilidadFlujoConfig() {
  return useQuery({
    queryKey: ['vulnerabilidads', 'config', 'flujo'],
    queryFn: async () => {
      const { data } = await api.get<Envelope<VulnerabilidadFlujoConfig>>(
        '/vulnerabilidads/config/flujo',
      );
      return data.data;
    },
  });
}

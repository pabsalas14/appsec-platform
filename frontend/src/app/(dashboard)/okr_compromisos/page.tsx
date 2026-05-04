'use client';

import { ClipboardList } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrCompromisos } from '@/hooks/useOkrCompromisos';
import type { OkrCompromiso } from '@/lib/schemas/okr_compromiso.schema';
import { formatDate } from '@/lib/utils';

export default function OkrCompromisosPage() {
  const { data, isLoading, error } = useOkrCompromisos();

  return (
    <OkrRegistryListPage<OkrCompromiso>
      title="Compromisos OKR"
      description="Objetivos del colaborador dentro del plan anual (vinculados a plan y categoría)."
      emptyIcon={ClipboardList}
      emptyTitle="Sin compromisos"
      emptyDescription="Cuando existan planes y categorías, aquí verás los compromisos registrados para el ciclo OKR/MBO."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar compromisos OKR."
      data={data}
      columns={[
        { id: 'obj', header: 'Objetivo', cell: (r) => r.nombre_objetivo },
        { id: 'peso', header: 'Peso', cell: (r) => String(r.peso_global) },
        { id: 'tipo', header: 'Medición', cell: (r) => r.tipo_medicion },
        { id: 'ini', header: 'Inicio', cell: (r) => formatDate(r.fecha_inicio) },
        { id: 'fin', header: 'Fin', cell: (r) => formatDate(r.fecha_fin) },
      ]}
    />
  );
}

'use client';

import { Flag } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrCierreQs } from '@/hooks/useOkrCierreQs';
import type { OkrCierreQ } from '@/lib/schemas/okr_cierre_q.schema';
import { formatDate } from '@/lib/utils';

export default function OkrCierreQsPage() {
  const { data, isLoading, error } = useOkrCierreQs();

  return (
    <OkrRegistryListPage<OkrCierreQ>
      title="Cierres trimestrales OKR"
      description="Retroalimentación de cierre por plan y trimestre."
      emptyIcon={Flag}
      emptyTitle="Sin cierres"
      emptyDescription="Los cierres se registran al finalizar el trimestre en el flujo MBO."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar cierres trimestrales OKR."
      data={data}
      columns={[
        { id: 'q', header: 'Trimestre', cell: (r) => r.quarter },
        {
          id: 'retro',
          header: 'Retroalimentación',
          cell: (r) => <span className="line-clamp-2 text-muted-foreground">{r.retroalimentacion_general}</span>,
        },
        { id: 'cerr', header: 'Cerrado', cell: (r) => formatDate(r.cerrado_at) },
      ]}
    />
  );
}

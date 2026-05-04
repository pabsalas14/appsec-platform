'use client';

import { LineChart } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrRevisionQs } from '@/hooks/useOkrRevisionQs';
import type { OkrRevisionQ } from '@/lib/schemas/okr_revision_q.schema';

export default function OkrRevisionQsPage() {
  const { data, isLoading, error } = useOkrRevisionQs();

  return (
    <OkrRegistryListPage<OkrRevisionQ>
      title="Revisiones trimestrales OKR"
      description="Avance reportado y validado por trimestre para cada subcompromiso."
      emptyIcon={LineChart}
      emptyTitle="Sin revisiones"
      emptyDescription="Las revisiones aparecen cuando existan subcompromisos y cierres de trimestre."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar revisiones trimestrales OKR."
      data={data}
      columns={[
        { id: 'q', header: 'Trimestre', cell: (r) => r.quarter },
        { id: 'rep', header: 'Avance reportado', cell: (r) => String(r.avance_reportado) },
        { id: 'val', header: 'Avance validado', cell: (r) => String(r.avance_validado ?? '—') },
        { id: 'est', header: 'Estado', cell: (r) => r.estado },
      ]}
    />
  );
}

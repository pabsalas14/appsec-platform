'use client';

import { CalendarRange } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrPlanAnuals } from '@/hooks/useOkrPlanAnuals';
import type { OkrPlanAnual } from '@/lib/schemas/okr_plan_anual.schema';

export default function OkrPlanAnualsPage() {
  const { data, isLoading, error } = useOkrPlanAnuals();

  return (
    <OkrRegistryListPage<OkrPlanAnual>
      title="Planes OKR anuales"
      description="Un plan por colaborador y año fiscal; estado de aprobación y evaluador asignado."
      emptyIcon={CalendarRange}
      emptyTitle="Sin planes anuales"
      emptyDescription="Crea planes desde los flujos de OKR o importaciones habilitadas en tu entorno."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar planes OKR anuales."
      data={data}
      columns={[
        { id: 'ano', header: 'Año', cell: (r) => String(r.ano) },
        { id: 'estado', header: 'Estado', cell: (r) => r.estado },
        {
          id: 'colab',
          header: 'Colaborador (id)',
          cell: (r) => <span className="font-mono text-xs">{r.colaborador_id.slice(0, 8)}…</span>,
        },
        {
          id: 'eval',
          header: 'Evaluador (id)',
          cell: (r) => <span className="font-mono text-xs">{r.evaluador_id.slice(0, 8)}…</span>,
        },
      ]}
    />
  );
}

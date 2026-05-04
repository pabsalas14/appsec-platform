'use client';

import { Paperclip } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrEvidencias } from '@/hooks/useOkrEvidencias';
import type { OkrEvidencia } from '@/lib/schemas/okr_evidencia.schema';
import { formatDate } from '@/lib/utils';

export default function OkrEvidenciasPage() {
  const { data, isLoading, error } = useOkrEvidencias();

  return (
    <OkrRegistryListPage<OkrEvidencia>
      title="Evidencias OKR"
      description="Adjuntos o enlaces asociados a una revisión trimestral."
      emptyIcon={Paperclip}
      emptyTitle="Sin evidencias"
      emptyDescription="Las evidencias se adjuntan al reportar avance en revisiones trimestrales."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar evidencias OKR."
      data={data}
      columns={[
        { id: 'tipo', header: 'Tipo', cell: (r) => r.tipo_evidencia },
        {
          id: 'nom',
          header: 'Archivo / URL',
          cell: (r) => r.nombre_archivo ?? r.url_evidencia ?? '—',
        },
        { id: 'fecha', header: 'Registro', cell: (r) => formatDate(r.created_at) },
      ]}
    />
  );
}

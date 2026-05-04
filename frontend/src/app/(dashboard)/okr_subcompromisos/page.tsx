'use client';

import { ListTree } from 'lucide-react';

import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrSubcompromisos } from '@/hooks/useOkrSubcompromisos';
import type { OkrSubcompromiso } from '@/lib/schemas/okr_subcompromiso.schema';

export default function OkrSubcompromisosPage() {
  const { data, isLoading, error } = useOkrSubcompromisos();

  return (
    <OkrRegistryListPage<OkrSubcompromiso>
      title="Subcompromisos OKR"
      description="Desglose de cada compromiso en ítems medibles con peso interno y evidencia requerida."
      emptyIcon={ListTree}
      emptyTitle="Sin subcompromisos"
      emptyDescription="Los subcompromisos cuelgan de un compromiso padre en el modelo MBO."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar subcompromisos OKR."
      data={data}
      columns={[
        { id: 'nom', header: 'Ítem', cell: (r) => r.nombre_sub_item },
        { id: 'peso', header: 'Peso interno', cell: (r) => String(r.peso_interno) },
        { id: 'ev', header: 'Evidencia', cell: (r) => (r.evidencia_requerida ? 'Sí' : 'No') },
      ]}
    />
  );
}

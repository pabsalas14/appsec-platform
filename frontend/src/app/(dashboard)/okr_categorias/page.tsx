'use client';

import { Tags } from 'lucide-react';

import { Badge } from '@/components/ui';
import { OkrRegistryListPage } from '@/components/okr/OkrRegistryListPage';
import { useOkrCategorias } from '@/hooks/useOkrCategorias';
import type { OkrCategoria } from '@/lib/schemas/okr_categoria.schema';

export default function OkrCategoriasPage() {
  const { data, isLoading, error } = useOkrCategorias();

  return (
    <OkrRegistryListPage<OkrCategoria>
      title="Categorías OKR"
      description="Clasificación de compromisos (nombre, descripción y si está activo)."
      emptyIcon={Tags}
      emptyTitle="Sin categorías"
      emptyDescription="Define categorías para agrupar compromisos en el tablero OKR."
      isLoading={isLoading}
      error={error}
      errorFallback="Error al cargar categorías OKR."
      data={data}
      columns={[
        { id: 'nom', header: 'Nombre', cell: (r) => r.nombre },
        {
          id: 'desc',
          header: 'Descripción',
          cell: (r) => <span className="text-muted-foreground">{r.descripcion ?? '—'}</span>,
        },
        {
          id: 'act',
          header: 'Activo',
          cell: (r) => (
            <Badge variant={r.activo ? 'default' : 'secondary'}>{r.activo ? 'Sí' : 'No'}</Badge>
          ),
        },
      ]}
    />
  );
}

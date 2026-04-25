'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { Badge, Card, CardContent, Input, PageHeader, PageWrapper, Select, Skeleton } from '@/components/ui';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { formatDate } from '@/lib/utils';

const SEVERIDAD_OPTS = [
  { value: '', label: 'Todas' },
  { value: 'Critica', label: 'Crítica' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

export default function VulnerabilidadsPage() {
  const { data, isLoading, error } = useVulnerabilidads();
  const { getParam, setParam, setParams } = useUrlFilters();
  const q = (getParam('q') ?? '').trim().toLowerCase();
  const severidad = getParam('severidad') ?? '';
  const sla = getParam('sla') ?? '';

  const filtered = useMemo(() => {
    if (!data?.length) return data ?? [];
    const now = Date.now();
    return data.filter((item) => {
      if (severidad && item.severidad !== severidad) return false;
      if (q) {
        const blob = `${item.titulo} ${item.descripcion ?? ''} ${item.fuente} ${item.estado}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (sla === 'vencida') {
        if (!item.fecha_limite_sla) return false;
        const lim = new Date(item.fecha_limite_sla).getTime();
        if (Number.isNaN(lim) || lim >= now) return false;
      }
      return true;
    });
  }, [data, q, severidad, sla]);

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title="Vulnerabilidades" description="Cargando…" />
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-24 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <p className="p-2 text-destructive">Error al cargar vulnerabilidades.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Vulnerabilidades"
        description="Hallazgos unificados (Módulo 9). Filtros y enlaces se sincronizan con la URL (compartir vista, drill-down desde el dashboard)."
      />
      <div className="mb-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Buscar</label>
          <Input
            className="mt-1"
            placeholder="Título, descripción, fuente, estado…"
            value={getParam('q') ?? ''}
            onChange={(e) => setParam('q', e.target.value || null)}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium">Severidad</label>
          <Select
            className="mt-1"
            value={severidad}
            onChange={(e) => setParam('severidad', e.target.value || null)}
            options={SEVERIDAD_OPTS}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium">SLA</label>
          <Select
            className="mt-1"
            value={sla}
            onChange={(e) => setParam('sla', e.target.value || null)}
            options={[
              { value: '', label: 'Todas' },
              { value: 'vencida', label: 'Vencida' },
            ]}
          />
        </div>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setParams({ q: null, severidad: null, sla: null })}
        >
          Limpiar filtros
        </button>
      </div>
      <ul className="space-y-3">
        {filtered?.map((item) => (
          <li key={item.id}>
            <Link href={`/vulnerabilidads/${item.id}`} className="block">
              <Card className="transition-colors hover:border-primary/30 hover:bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium leading-snug">{item.titulo}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="default">{item.fuente}</Badge>
                      <Badge variant="severity" severityName={item.severidad.toLowerCase()}>
                        {item.severidad}
                      </Badge>
                      <Badge variant="default">{item.estado}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.id}</p>
                  {item.descripcion && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.descripcion}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Actualizado {formatDate(item.updated_at)}
                    {item.fecha_limite_sla && (
                      <span className="ml-2">
                        · SLA {formatDate(item.fecha_limite_sla)}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {filtered?.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Ningún registro con los filtros actuales.</p>
      )}
    </PageWrapper>
  );
}

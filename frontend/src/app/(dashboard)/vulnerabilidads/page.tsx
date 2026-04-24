'use client';

import Link from 'next/link';

import { Badge, Card, CardContent, PageHeader, PageWrapper, Skeleton } from '@/components/ui';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { formatDate } from '@/lib/utils';

export default function VulnerabilidadsPage() {
  const { data, isLoading, error } = useVulnerabilidads();

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
        description="Hallazgos unificados (Módulo 9). Abre un registro para triaje IA de falsos positivos según el motor (SAST, DAST, etc.)."
      />
      <ul className="space-y-3">
        {data?.map((item) => (
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
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </PageWrapper>
  );
}

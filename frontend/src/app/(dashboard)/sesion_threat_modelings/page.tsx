'use client';

import Link from 'next/link';

import { Badge, Card, CardContent, PageHeader, PageWrapper, Skeleton } from '@/components/ui';
import { useSesionThreatModelings } from '@/hooks/useSesionThreatModelings';
import { formatDate } from '@/lib/utils';

export default function SesionThreatModelingsPage() {
  const { data, isLoading, error } = useSesionThreatModelings();

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title="Sesiones de threat modeling" description="Cargando…" />
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <p className="p-2 text-destructive">Error al cargar las sesiones de threat modeling.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Sesiones de threat modeling"
        description="Listado de sesiones. Abre una sesión para ver amenazas y ejecutar análisis asistido por IA."
      />
      <ul className="space-y-3">
        {data?.map((item) => (
          <li key={item.id}>
            <Link href={`/sesion_threat_modelings/${item.id}`} className="block">
              <Card className="transition-colors hover:border-primary/30 hover:bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Sesión {formatDate(item.fecha)}</span>
                    <Badge variant="default">{item.estado}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.id}</p>
                  {item.contexto && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.contexto}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </PageWrapper>
  );
}

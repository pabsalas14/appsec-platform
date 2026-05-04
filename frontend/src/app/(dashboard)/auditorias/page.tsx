'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, PageHeader, PageWrapper } from '@/components/ui';
import { useAuditorias } from '@/hooks/useAuditorias';

const ESTADOS = ['Planificada', 'En Progreso', 'Completada', 'Cancelada', 'En Revisión'] as const;

export default function AuditoriasTableroPage() {
  const { data: items = [], isLoading } = useAuditorias();
  const byEstado = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of ESTADOS) m[e] = 0;
    for (const it of items) {
      m[it.estado] = (m[it.estado] ?? 0) + 1;
    }
    return m;
  }, [items]);

  if (isLoading) {
    return (
      <PageWrapper className="space-y-6 p-0">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-0">
      <PageHeader
        title="Auditorías"
        description={
          <>
            Resumen por estado. Alta, edición y listado en la pestaña Registros. Los{' '}
            <Link href="/plan_remediacions" className="font-medium text-primary underline-offset-4 hover:underline">
              planes de remediación
            </Link>{' '}
            son acciones de cierre ligadas a cada auditoría (módulo aparte para tablero y seguimiento).
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        {ESTADOS.map((est) => (
          <Card key={est}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {est}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{byEstado[est] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}

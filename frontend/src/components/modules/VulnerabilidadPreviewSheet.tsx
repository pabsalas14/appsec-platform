'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useVulnerabilidad } from '@/hooks/useVulnerabilidads';
import { useVulnerabilidadFlujoConfig } from '@/hooks/useOperacionConfig';
import { labelForEstatusId } from '@/lib/vulnerabilidadFlujo';
import { formatDate } from '@/lib/utils';

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VulnerabilidadPreviewSheet({ id, open, onOpenChange }: Props) {
  const { data: v, isLoading, error } = useVulnerabilidad(id ?? undefined);
  const { data: flujo } = useVulnerabilidadFlujoConfig();
  const estatus = flujo?.estatus;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Vista rápida</SheetTitle>
          <SheetDescription>
            Detalle técnico resumido. Abre la página completa para acciones, historial e IA.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col gap-4 border-t border-border/60 p-1 pt-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">No se pudo cargar el registro.</p>}
          {v && (
            <>
              <div className="flex flex-wrap items-start gap-2">
                <Badge variant="severity" severityName={v.severidad.toLowerCase()}>
                  {v.severidad}
                </Badge>
                <Badge variant="default">{v.fuente}</Badge>
                <Badge variant="default">
                  {estatus?.length ? labelForEstatusId(estatus, v.estado) : v.estado}
                </Badge>
              </div>
              <div>
                <h3 className="text-base font-semibold leading-snug">{v.titulo}</h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{v.id}</p>
              </div>
              {v.descripcion && (
                <p className="line-clamp-6 text-sm text-muted-foreground whitespace-pre-wrap">{v.descripcion}</p>
              )}
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">OWASP / CWE</dt>
                  <dd>
                    {v.owasp_categoria ?? '—'} {v.cwe_id ? `· ${v.cwe_id}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CVSS</dt>
                  <dd>{v.cvss_score != null ? String(v.cvss_score) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">SLA</dt>
                  <dd className="whitespace-nowrap">{v.fecha_limite_sla ? formatDate(v.fecha_limite_sla) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Creado</dt>
                  <dd className="whitespace-nowrap">{formatDate(v.created_at)}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Link
                  href={`/vulnerabilidads/${v.id}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Abrir ficha completa
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

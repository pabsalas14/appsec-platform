'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { useActivoWebs } from '@/hooks/useActivoWebs';
import { useHallazgoTerceros } from '@/hooks/useHallazgoTerceros';
import { useRevisionTercero, useRevisionTerceroChecklistTemplate } from '@/hooks/useRevisionTerceros';
import { useServicios } from '@/hooks/useServicios';
import { cn, formatDate } from '@/lib/utils';

const btnOutline =
  'inline-flex items-center justify-center font-medium transition-all border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] text-sm py-1.5 px-3 rounded-lg';
const btnGhostSm = 'inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] text-sm py-1.5 px-3 rounded-lg';

export default function RevisionTerceroDetallePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { data: rev, isLoading, isError } = useRevisionTercero(id);
  const { data: checklistTmpl } = useRevisionTerceroChecklistTemplate();
  const { data: hallazgos } = useHallazgoTerceros(id ? { revision_tercero_id: id } : undefined);
  const { data: srvs } = useServicios();
  const { data: aws } = useActivoWebs();

  const srvName = useMemo(
    () => (rev?.servicio_id ? (srvs ?? []).find((s) => s.id === rev.servicio_id)?.nombre ?? '—' : '—'),
    [srvs, rev],
  );
  const awName = useMemo(
    () => (rev?.activo_web_id ? (aws ?? []).find((a) => a.id === rev.activo_web_id)?.nombre ?? '—' : '—'),
    [aws, rev],
  );

  const checklistRows = useMemo(() => {
    const items = checklistTmpl?.items ?? [];
    const cr = (rev?.checklist_resultados as Record<string, { ok?: boolean; nota?: string } | undefined>) ?? {};
    return items.map((it) => {
      const row = cr[it.id];
      return { ...it, ok: Boolean(row?.ok), nota: row?.nota?.trim() ?? '' };
    });
  }, [checklistTmpl, rev]);

  if (isLoading) {
    return (
      <PageWrapper className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageWrapper>
    );
  }
  if (isError || !rev) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive">No se pudo cargar la revisión.</p>
        <Link href="/revision_terceros" className={cn(btnOutline, 'mt-4')}>
          Volver al listado
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/revision_terceros" className={btnGhostSm}>
          <ArrowLeft className="h-4 w-4" />
          Revisiones tercero
        </Link>
      </div>
      <PageHeader title={rev.nombre_empresa} description={`${rev.tipo} · ${rev.estado}`} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="checklist">Checklist BRD 10.3</TabsTrigger>
          <TabsTrigger value="hallazgos">Hallazgos ({hallazgos?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Servicio:</span> {srvName}
              </p>
              <p>
                <span className="text-muted-foreground">Activo web:</span> {awName}
              </p>
              <p>
                <span className="text-muted-foreground">Inicio:</span> {formatDate(rev.fecha_inicio)}
              </p>
              {rev.fecha_fin && (
                <p>
                  <span className="text-muted-foreground">Fin:</span> {formatDate(rev.fecha_fin)}
                </p>
              )}
              {rev.responsable_revision && (
                <p>
                  <span className="text-muted-foreground">Responsable:</span> {rev.responsable_revision}
                </p>
              )}
              {rev.informe_filename && (
                <p>
                  <span className="text-muted-foreground">Informe:</span> {rev.informe_filename}
                  {rev.informe_sha256 && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">({rev.informe_sha256.slice(0, 12)}…)</span>
                  )}
                </p>
              )}
              {rev.observaciones && (
                <div className="rounded-md border border-border p-3 text-muted-foreground whitespace-pre-wrap">
                  {rev.observaciones}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ítems de checklist</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {!checklistRows.length ? (
                <p className="p-4 text-sm text-muted-foreground">Sin plantilla configurada.</p>
              ) : (
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <DataTableTh>Ítem</DataTableTh>
                      <DataTableTh className="w-[100px]">OK</DataTableTh>
                      <DataTableTh>Nota</DataTableTh>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {checklistRows.map((row) => (
                      <DataTableRow key={row.id}>
                        <DataTableCell className="text-sm">{row.label}</DataTableCell>
                        <DataTableCell>{row.ok ? <Badge variant="success">Sí</Badge> : <Badge variant="default">No</Badge>}</DataTableCell>
                        <DataTableCell className="text-sm text-muted-foreground max-w-[320px]">{row.nota || '—'}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hallazgos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hallazgos de la revisión</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              {!hallazgos?.length ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Sin hallazgos. Créalos en{' '}
                  <Link href="/hallazgo_terceros" className="text-primary underline">
                    Hallazgos tercero
                  </Link>
                  .
                </p>
              ) : (
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <DataTableTh>Título</DataTableTh>
                      <DataTableTh>Severidad</DataTableTh>
                      <DataTableTh>Estado</DataTableTh>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {hallazgos.map((h) => (
                      <DataTableRow key={h.id}>
                        <DataTableCell className="font-medium max-w-[280px]">{h.titulo}</DataTableCell>
                        <DataTableCell>
                          <Badge variant="outline">{h.severidad}</Badge>
                        </DataTableCell>
                        <DataTableCell className="text-sm">{h.estado}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}

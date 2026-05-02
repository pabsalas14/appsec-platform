'use client';

import { ArrowLeft, ExternalLink, GitBranch, Loader2, Shield } from 'lucide-react';
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
} from '@/components/ui';
import { useActivoWeb } from '@/hooks/useActivoWebs';
import { useCelulas } from '@/hooks/useCelulas';
import { usePipelineReleases } from '@/hooks/usePipelineReleases';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import { cn, formatDate } from '@/lib/utils';

const btnOutline =
  'inline-flex items-center justify-center font-medium transition-all border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] text-sm py-1.5 px-3 rounded-lg';
const btnGhostSm = 'inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] text-sm py-1.5 px-3 rounded-lg';
const btnGhostXs =
  'inline-flex items-center justify-center rounded-md text-xs py-1 px-2 font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06]';

export default function ActivoWebDetallePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { data: a, isLoading, isError } = useActivoWeb(id);
  const { data: cels } = useCelulas();
  const { data: pipes } = usePipelineReleases(id ? { activo_web_id: id } : undefined);
  const { data: vulns } = useVulnerabilidads();

  const celName = useMemo(() => (cels ?? []).find((c) => c.id === a?.celula_id)?.nombre ?? '—', [cels, a]);
  const vulnsAct = useMemo(
    () => (vulns ?? []).filter((v) => v.activo_web_id && v.activo_web_id === id).slice(0, 50),
    [vulns, id],
  );

  const pipesSorted = useMemo(() => {
    const list = pipes ?? [];
    return [...list].sort((x, y) => {
      const ta = new Date(x.updated_at).getTime();
      const tb = new Date(y.updated_at).getTime();
      return tb - ta;
    });
  }, [pipes]);

  if (isLoading) {
    return (
      <PageWrapper className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageWrapper>
    );
  }
  if (isError || !a) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive">No se pudo cargar el activo web.</p>
        <Link href="/activo_webs" className={cn(btnOutline, 'mt-4')}>
          Volver al listado
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/activo_webs" className={btnGhostSm}>
          <ArrowLeft className="h-4 w-4" />
          Activos web
        </Link>
      </div>
      <PageHeader title={a.nombre} description={`${a.ambiente} · ${a.tipo}`}>
        <a href={a.url} target="_blank" rel="noopener noreferrer" className={cn(btnOutline, 'gap-1')}>
          Abrir URL
          <ExternalLink className="h-4 w-4" />
        </a>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Célula:</span> {celName}
            </p>
            <p>
              <span className="text-muted-foreground">URL:</span>{' '}
              <a href={a.url} className="text-primary underline break-all" target="_blank" rel="noopener noreferrer">
                {a.url}
              </a>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Pipelines DAST
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {(pipes?.length ?? 0) === 0 ? (
              <p>Sin ejecuciones con este activo.</p>
            ) : (
              <p>
                {pipes?.length} ejecución(es). Los hallazgos de pipeline se correlacionan con{' '}
                <code className="text-xs">scan_id</code> + <code className="text-xs">rama</code>.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de escaneos (pipelines DAST)</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Ordenado por última actualización. Enlace al detalle del pipeline y hallazgos correlacionados.
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          {!pipesSorted.length ? (
            <p className="p-4 text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Actualizado</DataTableTh>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Rama</DataTableTh>
                  <DataTableTh>Scan</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh className="w-[140px]">Pipeline / hallazgos</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {pipesSorted.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(p.updated_at)}
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="primary">{p.tipo}</Badge>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs">{p.rama}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">{p.scan_id ?? '—'}</DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{p.resultado}</Badge>
                    </DataTableCell>
                    <DataTableCell className="space-y-1">
                      <Link
                        href={`/pipeline_releases?q=${encodeURIComponent(p.scan_id ?? p.rama ?? '')}`}
                        className={`${btnGhostXs} block text-left`}
                      >
                        Buscar en pipelines
                      </Link>
                      <Link href={`/hallazgo_pipelines?pipe=${p.id}`} className={btnGhostXs}>
                        Hallazgos
                      </Link>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Vulnerabilidades vinculadas (muestra)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          {!vulnsAct.length ? (
            <p className="p-4 text-sm text-muted-foreground">Ninguna en los últimos 100 del listado global.</p>
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Título</DataTableTh>
                  <DataTableTh>Severidad</DataTableTh>
                  <DataTableTh>Estado</DataTableTh>
                  <DataTableTh>Actualizado</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {vulnsAct.map((v) => (
                  <DataTableRow key={v.id}>
                    <DataTableCell className="max-w-[280px]">
                      <Link href={`/vulnerabilidads/${v.id}`} className="font-medium text-primary hover:underline">
                        {v.titulo}
                      </Link>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="outline">{v.severidad}</Badge>
                    </DataTableCell>
                    <DataTableCell className="text-sm">{v.estado}</DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(v.updated_at)}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <EntityCustomFieldsCard entityType="activo_web" entityId={a.id} />
    </PageWrapper>
  );
}

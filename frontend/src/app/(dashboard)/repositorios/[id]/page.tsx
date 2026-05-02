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
import { useCelulas } from '@/hooks/useCelulas';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { usePipelineReleases } from '@/hooks/usePipelineReleases';
import { useRepositorio } from '@/hooks/useRepositorios';
import { useVulnerabilidads } from '@/hooks/useVulnerabilidads';
import { EntityCustomFieldsCard } from '@/components/modules/EntityCustomFieldsCard';
import { cn, formatDate } from '@/lib/utils';

const btnOutline =
  'inline-flex items-center justify-center font-medium transition-all border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] text-sm py-1.5 px-3 rounded-lg';
const btnGhostSm = 'inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] text-sm py-1.5 px-3 rounded-lg';
const btnGhostXs =
  'inline-flex items-center justify-center rounded-md text-xs py-1 px-2 font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06]';

export default function RepositorioDetallePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { data: r, isLoading, isError } = useRepositorio(id);
  const { data: orgs } = useOrganizacions();
  const { data: cels } = useCelulas();
  const { data: pipes } = usePipelineReleases(id ? { repositorio_id: id } : undefined);
  const { data: vulns } = useVulnerabilidads();

  const orgName = useMemo(() => (orgs ?? []).find((o) => o.id === r?.organizacion_id)?.nombre ?? '—', [orgs, r]);
  const celName = useMemo(
    () => (r?.celula_id ? (cels ?? []).find((c) => c.id === r.celula_id)?.nombre ?? '—' : '—'),
    [cels, r],
  );
  const vulnsRepo = useMemo(
    () => (vulns ?? []).filter((v) => v.repositorio_id && v.repositorio_id === id).slice(0, 50),
    [vulns, id],
  );

  if (isLoading) {
    return (
      <PageWrapper className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageWrapper>
    );
  }
  if (isError || !r) {
    return (
      <PageWrapper className="p-6">
        <p className="text-destructive">No se pudo cargar el repositorio.</p>
        <Link href="/repositorios" className={cn(btnOutline, 'mt-4')}>
          Volver al listado
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/repositorios" className={btnGhostSm}>
          <ArrowLeft className="h-4 w-4" />
          Repositorios
        </Link>
      </div>
      <PageHeader title={r.nombre} description={`${r.plataforma} · rama por defecto ${r.rama_default}`}>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={cn(btnOutline, 'gap-1')}>
          Abrir URL
          <ExternalLink className="h-4 w-4" />
        </a>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Organización:</span> {orgName}
            </p>
            <p>
              <span className="text-muted-foreground">Célula:</span> {celName}
            </p>
            <p>
              <span className="text-muted-foreground">Activo en catálogo:</span>{' '}
              <Badge variant={r.activo ? 'success' : 'default'}>{r.activo ? 'Sí' : 'No'}</Badge>
            </p>
            {r.responsable_nombre && (
              <p>
                <span className="text-muted-foreground">Responsable:</span> {r.responsable_nombre}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Pipelines (SAST/SCA/DAST)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {(pipes?.length ?? 0) === 0 ? (
              <p>Sin ejecuciones registradas para este repositorio.</p>
            ) : (
              <p>
                {pipes?.length} ejecución(es). Correlación de hallazgos vía <code className="text-xs">scan_id</code> +{' '}
                <code className="text-xs">rama</code> en{' '}
                <Link href="/pipeline_releases" className="text-primary underline">
                  Pipelines
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ejecuciones de pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          {!pipes?.length ? (
            <p className="p-4 text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableTh>Tipo</DataTableTh>
                  <DataTableTh>Rama</DataTableTh>
                  <DataTableTh>Scan</DataTableTh>
                  <DataTableTh>Resultado</DataTableTh>
                  <DataTableTh className="w-[120px]">Hallazgos</DataTableTh>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {pipes.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableCell>
                      <Badge variant="primary">{p.tipo}</Badge>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-xs">{p.rama}</DataTableCell>
                    <DataTableCell className="text-xs text-muted-foreground">{p.scan_id ?? '—'}</DataTableCell>
                    <DataTableCell>
                      <Badge variant="default">{p.resultado}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Link href={`/hallazgo_pipelines?pipe=${p.id}`} className={btnGhostXs}>
                        Ver hallazgos
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
          {!vulnsRepo.length ? (
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
                {vulnsRepo.map((v) => (
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

      <EntityCustomFieldsCard entityType="repositorio" entityId={r.id} />
    </PageWrapper>
  );
}

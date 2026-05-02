'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, Info, Network, Package } from 'lucide-react';

import {
  Badge,
  EmptyState,
  PageWrapper,
  PremiumPageHeader,
  PremiumPanel,
  Skeleton,
  Card,
  CardContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { useCelulas } from '@/hooks/useCelulas';
import { useDireccions } from '@/hooks/useDireccions';
import { useGerencias } from '@/hooks/useGerencias';
import { useOrganizacions } from '@/hooks/useOrganizacions';
import { useMadurezCelulaScores } from '@/hooks/useMadurezNodeScores';
import { useRepositorios } from '@/hooks/useRepositorios';
import { useSubdireccions } from '@/hooks/useSubdireccions';
import { extractErrorMessage, cn } from '@/lib/utils';
import type { Repositorio } from '@/lib/schemas/repositorio.schema';

const LEVEL = {
  direccion: 'Dirección',
  subdireccion: 'Subdirección',
  gerencia: 'Gerencia',
  organizacion: 'Organización',
  celula: 'Célula',
} as const;

type NodeKind = keyof typeof LEVEL;

type TreeNode = {
  kind: NodeKind;
  id: string;
  nombre: string;
  responsable: string;
  href: string;
  children: TreeNode[];
};

function countReposCel(celId: string, repos: { celula_id?: string | null }[]) {
  return repos.filter((r) => r.celula_id === celId).length;
}

function countOrphanReposOrg(orgId: string, repos: { organizacion_id: string; celula_id?: string | null }[]) {
  return repos.filter((r) => r.organizacion_id === orgId && (r.celula_id == null || r.celula_id === '')).length;
}

function repoCountForNode(node: TreeNode, repos: Repositorio[]): number {
  if (node.kind === 'celula') return countReposCel(node.id, repos);
  if (node.kind === 'organizacion') {
    const fromCels = node.children.reduce(
      (sum, ch) => (ch.kind === 'celula' ? sum + countReposCel(ch.id, repos) : sum),
      0,
    );
    return fromCels + countOrphanReposOrg(node.id, repos);
  }
  return node.children.reduce((sum, ch) => sum + repoCountForNode(ch, repos), 0);
}

function collectCelulaIdsUnder(node: TreeNode): string[] {
  if (node.kind === 'celula') return [node.id];
  return node.children.flatMap((ch) => collectCelulaIdsUnder(ch));
}

function madurezDisplay(node: TreeNode, scores: Record<string, number>): string {
  const ids = collectCelulaIdsUnder(node);
  if (!ids.length) return '—';
  const vals = ids.map((id) => scores[id]).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (!vals.length) return '—';
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg.toFixed(0);
}

function TreeRows2({
  node,
  depth,
  expanded,
  toggle,
  repos,
  madurezScores,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  repos: Repositorio[];
  madurezScores: Record<string, number>;
}) {
  const key = `${node.kind}:${node.id}`;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(key);
  const selfCount = repoCountForNode(node, repos);
  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/40">
        <td className="py-2 pl-1 align-middle" style={{ paddingLeft: `${8 + depth * 16}px` }}>
          <div className="flex min-w-0 items-center gap-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(key)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-expanded={isOpen}
              >
                <ChevronRight
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
                />
              </button>
            ) : (
              <span className="inline-block w-7" />
            )}
            <Link href={node.href} className="min-w-0 truncate font-medium text-primary hover:underline">
              {node.nombre}
            </Link>
          </div>
        </td>
        <td className="px-1 py-2 align-middle">
          <Badge variant="outline" className="whitespace-nowrap text-[10px]">
            {LEVEL[node.kind]}
          </Badge>
        </td>
        <td
          className="max-w-[180px] truncate px-1 py-2 text-sm text-muted-foreground"
          title={node.responsable}
        >
          {node.responsable}
        </td>
        <td className="w-24 px-1 py-2 text-right text-sm tabular-nums text-muted-foreground">
          {selfCount}
        </td>
        <td
          className="w-24 px-1 py-2 text-right text-sm tabular-nums text-muted-foreground"
          title="Score 0–100 desde `/madurez/node-scores` (promedio de células bajo este nodo)."
        >
          {madurezDisplay(node, madurezScores)}
        </td>
      </tr>
      {hasChildren &&
        isOpen &&
        node.children.map((ch) => (
          <TreeRows2
            key={`${ch.kind}-${ch.id}`}
            node={ch}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            repos={repos}
            madurezScores={madurezScores}
          />
        ))}
    </>
  );
}

export default function OrganizacionJerarquiaPage() {
  const d = useDireccions();
  const s = useSubdireccions();
  const g = useGerencias();
  const o = useOrganizacions();
  const c = useCelulas();
  const r = useRepositorios();
  const { data: madurezScores = {} } = useMadurezCelulaScores();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((k: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }, []);

  const tree: TreeNode[] = useMemo(() => {
    const dir = d.data ?? [];
    const sub = s.data ?? [];
    const ger = g.data ?? [];
    const org = o.data ?? [];
    const cel = c.data ?? [];
    return dir
      .map((direccion) => {
        const subs = sub
          .filter((x) => x.direccion_id === direccion.id)
          .map((subd) => {
            const gers = ger
              .filter((x) => x.subdireccion_id === subd.id)
              .map((gerencia) => {
                const orgs = org
                  .filter((x) => x.gerencia_id === gerencia.id)
                  .map((organizacion) => {
                    const cels = cel
                      .filter((x) => x.organizacion_id === organizacion.id)
                      .map((celula) => ({
                        kind: 'celula' as const,
                        id: celula.id,
                        nombre: celula.nombre,
                        responsable: celula.tipo,
                        href: '/celulas',
                        children: [] as TreeNode[],
                      }));
                    return {
                      kind: 'organizacion' as const,
                      id: organizacion.id,
                      nombre: organizacion.nombre,
                      responsable: organizacion.responsable ?? '—',
                      href: '/organizacions',
                      children: cels,
                    };
                  });
                return {
                  kind: 'gerencia' as const,
                  id: gerencia.id,
                  nombre: gerencia.nombre,
                  responsable: '—',
                  href: '/gerencias',
                  children: orgs,
                };
              });
            return {
              kind: 'subdireccion' as const,
              id: subd.id,
              nombre: subd.nombre,
              responsable: subd.director_nombre ?? '—',
              href: '/subdireccions',
              children: gers,
            };
          });
        return {
          kind: 'direccion' as const,
          id: direccion.id,
          nombre: direccion.nombre,
          responsable: '—',
          href: '/direccions',
          children: subs,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [d.data, s.data, g.data, o.data, c.data]);

  const loading = d.isLoading || s.isLoading || g.isLoading || o.isLoading || c.isLoading || r.isLoading;
  const repos = r.data ?? [];
  const listError =
    d.error ?? s.error ?? g.error ?? o.error ?? c.error ?? r.error ?? null;
  const hasListError = Boolean(
    d.isError || s.isError || g.isError || o.isError || c.isError || r.isError,
  );

  if (loading) {
    return (
      <PageWrapper className="space-y-6 p-6">
        <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-12 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 p-6">
      <PremiumPageHeader
        eyebrow="Organización"
        icon={Network}
        title="Jerarquía organizacional"
        description="Estructura: dirección → célula. Inventario de activos enlazado por célula. Madurez: score agregado de vulnerabilidades por alcance (endpoint `/madurez/node-scores`, promedio por fila)."
      >
        <Link
          href="/inventario"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-white/[0.1]"
        >
          <Package className="h-4 w-4 text-primary" aria-hidden />
          Inventario de activos
        </Link>
      </PremiumPageHeader>

      {hasListError && (
        <div
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{extractErrorMessage(listError, 'No se pudo cargar la estructura. Revisa la sesión o vuelve a intentar.')}</p>
        </div>
      )}

      <PremiumPanel className="p-0">
        {!hasListError && tree.length === 0 ? (
          <EmptyState
            icon={Network}
            title="Aún no hay estructura registrada"
            description="Crea al menos una dirección para ver el árbol. El inventario de repositorios y activos web se asigna después a las células."
          >
            <Link
              href="/direccions"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
              Ir a catálogo de direcciones
            </Link>
          </EmptyState>
        ) : hasListError ? null : (
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-0 sm:p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="py-3 pl-1">Nombre</th>
                      <th className="w-32 px-1 py-3">Nivel</th>
                      <th className="w-40 px-1 py-3">Responsable</th>
                      <th className="w-24 px-1 py-3 text-right">Repos</th>
                      <th className="w-28 px-1 py-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1">
                          Madurez
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex rounded p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                aria-label="Qué significa la columna Madurez"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs text-xs">
                              Índice 0–100 desde el motor de madurez (vulnerabilidades cerradas vs activas bajo activos de
                              la célula). En niveles superiores se muestra el promedio de las células descendientes.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.map((node) => (
                      <TreeRows2
                        key={`${node.kind}-${node.id}`}
                        node={node}
                        depth={0}
                        expanded={expanded}
                        toggle={toggle}
                        repos={repos}
                        madurezScores={madurezScores}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </PremiumPanel>
    </PageWrapper>
  );
}
